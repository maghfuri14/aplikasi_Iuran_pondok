import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  FileText, 
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { formatRupiah, formatDateIndo, BULAN_SHORT } from '../utils/formatters';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  setCurrentTab: (tab: NavTab) => void;
  onOpenQuickPayment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  setCurrentTab, 
  onOpenQuickPayment 
}) => {
  const { 
    currentUser, 
    santriList, 
    cashSummary, 
    cashEntries, 
    transactions, 
    settings, 
    calculateSantriTunggakan,
    approveCashKeluar,
    rejectCashKeluar,
    setSelectedSantriDetail,
    showToast
  } = useApp();

  // State for rejecting cash entry modal
  const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');

  // Top 5 Tunggakan Terbesar (for Admin)
  const topTunggakan = React.useMemo(() => {
    return santriList
      .filter(s => s.status === 'Aktif' && s.kategori !== 'Kilatan')
      .map(s => {
        const info = calculateSantriTunggakan(s.id);
        return {
          santri: s,
          total: info.totalTunggakan,
          bulanCount: info.bulanTunggakan.length
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [santriList, calculateSantriTunggakan]);

  // Pending Cash Keluar Entries
  const pendingEntries = React.useMemo(() => {
    return cashEntries.filter(c => c.tipe === 'keluar' && c.status === 'Menunggu Persetujuan');
  }, [cashEntries]);

  // 12-Month Financial Cashflow Trend Calculation (Current Year)
  const currentYear = new Date().getFullYear();
  const monthlyTrend = React.useMemo(() => {
    const trend = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      nama: BULAN_SHORT[i],
      masuk: 0,
      keluar: 0
    }));

    cashEntries.forEach(entry => {
      if (entry.status !== 'Disetujui') return;
      const parts = entry.tanggal.split('-');
      if (parts.length === 3 && parseInt(parts[0], 10) === currentYear) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          if (entry.tipe === 'masuk') {
            trend[monthIndex].masuk += entry.nominal;
          } else {
            trend[monthIndex].keluar += entry.nominal;
          }
        }
      }
    });

    const maxVal = Math.max(...trend.map(t => Math.max(t.masuk, t.keluar)), 1);

    return { trend, maxVal };
  }, [cashEntries, currentYear]);

  // Handle reject submission
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingEntryId) return;
    if (!alasanTolak.trim()) {
      showToast('Gagal: Keterangan penolakan wajib diisi.', 'error');
      return;
    }
    const res = rejectCashKeluar(rejectingEntryId, alasanTolak);
    if (res.success) {
      setRejectingEntryId(null);
      setAlasanTolak('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">
                {settings.namaPondok} Pare, Kediri
              </span>
              <h2 className="text-2xl font-bold mt-1 tracking-tight">
                Ahlan wa Sahlan, {currentUser.name}
              </h2>
              <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
                Sistem Manajemen Kas & Iuran terintegrasi (v9.6 Execution-Ready). Jaringan internal LAN aman tanpa ketergantungan koneksi cloud.
              </p>
            </div>

            {currentUser.role !== 'sekretaris' && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onOpenQuickPayment}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>Catat Pembayaran</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CASE A: ADMIN & BENDAHARA DASHBOARDS (WITH FINANCIALS) */}
      {currentUser.role !== 'sekretaris' ? (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Dana Tersisa */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Dana Tersisa (Kas Bersih)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {formatRupiah(cashSummary.danaTersisa)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Saldo Awal:</span>
                <span className="font-mono font-semibold">{formatRupiah(cashSummary.saldoAwal)}</span>
              </div>
            </div>

            {/* Total Kas Masuk */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Kas Masuk Aktif</span>
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatRupiah(cashSummary.totalMasuk)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Total Transaksi Aktif:</span>
                <span className="font-mono font-semibold">{transactions.filter(t => t.status === 'Aktif').length} kuitansi</span>
              </div>
            </div>

            {/* Total Kas Keluar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Kas Keluar Disetujui</span>
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-rose-700 dark:text-rose-400">
                {formatRupiah(cashSummary.totalKeluar)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Pengeluaran Realisasi:</span>
                <span className="font-mono font-semibold">{cashEntries.filter(c => c.tipe === 'keluar' && c.status === 'Disetujui').length} pos</span>
              </div>
            </div>

            {/* Pending Approvals Card */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
              cashSummary.pendingKeluarCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Persetujuan</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  cashSummary.pendingKeluarCount > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-amber-700 dark:text-amber-400">
                {cashSummary.pendingKeluarCount} Pengajuan
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Nominal Menggantung:</span>
                <span className="font-mono font-semibold">{formatRupiah(cashSummary.pendingKeluarNominal)}</span>
              </div>
            </div>

          </div>

          {/* Pending Maker-Checker Approvals Section (Prominent Alert for Admin) */}
          {pendingEntries.length > 0 && (
            <div className="p-5 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Pengajuan Kas Keluar Memerlukan Otorisasi Maker-Checker (≥ {formatRupiah(settings.approvalThreshold)})</span>
                </div>
                <button
                  onClick={() => setCurrentTab('kas')}
                  className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950"
                >
                  Buka Jurnal Kas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingEntries.map(entry => (
                  <div 
                    key={entry.id} 
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {entry.kategori}
                        </span>
                        <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
                          {formatRupiah(entry.nominal)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-2 font-medium">
                        {entry.keterangan}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Diajukan: {formatDateIndo(entry.tanggal)} oleh <strong>{entry.dibuatOleh}</strong>
                      </p>
                    </div>

                    {currentUser.role === 'admin' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setRejectingEntryId(entry.id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => approveCashKeluar(entry.id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Setujui Pengeluaran
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cashflow Trend & Top Tunggakan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cashflow Trend Bar Visualizer (12 Bulan) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Grafik Tren Pemasukan vs Pengeluaran ({currentYear})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbandingan arus kas masuk dan kas keluar disetujui 12 bulan
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Pengeluaran</span>
                  </div>
                </div>
              </div>

              {/* Monthly Visualizer Bars */}
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-48 pt-6 border-b border-slate-100 dark:border-slate-800">
                {monthlyTrend.trend.map(item => {
                  const masukPct = Math.round((item.masuk / monthlyTrend.maxVal) * 100);
                  const keluarPct = Math.round((item.keluar / monthlyTrend.maxVal) * 100);

                  return (
                    <div key={item.month} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 whitespace-nowrap transition-opacity">
                        <p className="font-bold">{item.nama} {currentYear}</p>
                        <p className="text-emerald-400">Masuk: {formatRupiah(item.masuk)}</p>
                        <p className="text-rose-400">Keluar: {formatRupiah(item.keluar)}</p>
                      </div>

                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                        <div 
                          style={{ height: `${Math.max(4, masukPct)}%` }} 
                          className="w-1/2 max-w-[14px] bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-400"
                        />
                        <div 
                          style={{ height: `${Math.max(4, keluarPct)}%` }} 
                          className="w-1/2 max-w-[14px] bg-rose-500 rounded-t-sm transition-all hover:bg-rose-400"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-2">
                        {item.nama}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Tunggakan Terbesar (Admin & Bendahara) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Top 5 Tunggakan Terbesar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Santri dengan tagihan Syahriyah tertinggi
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('syahriyah')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Matrix View
                </button>
              </div>

              {topTunggakan.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Alhamdulillah, tidak ada tunggakan iuran pada santri aktif saat ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topTunggakan.map((item, index) => (
                    <div 
                      key={item.santri.id}
                      onClick={() => setSelectedSantriDetail(item.santri)}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold w-4 h-4 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.santri.nama}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Wali: {item.santri.namaWali} ({item.bulanCount} bulan)
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                          {formatRupiah(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        /* CASE B: SEKRETARIS DASHBOARD (NO FINANCIAL DATA - STRICT RBAC) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">Santri Aktif</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {santriList.filter(s => s.status === 'Aktif').length}
              </div>
              <p className="text-xs text-slate-500">Terdaftar dalam kegiatan harian pondok</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">Santri Mukim</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {santriList.filter(s => s.status === 'Aktif' && s.kategori === 'Mukim').length}
              </div>
              <p className="text-xs text-slate-500">Tinggal penuh di asrama pondok</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">Santri Nduduk</span>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
                {santriList.filter(s => s.status === 'Aktif' && s.kategori === 'Nduduk').length}
              </div>
              <p className="text-xs text-slate-500">Santri laju / pulang-pergi</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">Santri Kilatan</span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {santriList.filter(s => s.status === 'Aktif' && s.kategori === 'Kilatan').length}
              </div>
              <p className="text-xs text-slate-500">Program periode musiman</p>
            </div>

          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Manajemen Data Santri & Kesekretariatan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Akses khusus Sekretaris untuk pendataan santri, NIS, pencatatan mutasi/keluar, dan verifikasi wali.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('santri')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-700/20"
            >
              Buka Data Santri
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Tolak Pengajuan Kas Keluar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keterangan penolakan wajib diisi untuk catatan transparansi bendahara.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                required
                rows={3}
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Alasan penolakan pengeluaran ini..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingEntryId(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
