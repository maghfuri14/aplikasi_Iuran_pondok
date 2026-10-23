import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CashEntry, CashType, CashStatus } from '../types';
import { 
  BookMarked, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  FileText, 
  Eye, 
  X,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';

export const BukuKasView: React.FC = () => {
  const { 
    currentUser, 
    settings, 
    cashEntries, 
    cashSummary, 
    transactions,
    addManualCashEntry, 
    approveCashKeluar, 
    rejectCashKeluar, 
    cancelPendingCashKeluar, 
    cancelApprovedCashKeluar,
    setActiveReceipt,
    showToast 
  } = useApp();

  // Filter state
  const [activeTab, setActiveTab] = useState<'semua' | 'masuk' | 'keluar' | 'pending'>('semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [dateRange, setDateRange] = useState<'semua' | 'bulan_ini' | 'tahun_ini'>('semua');

  // Modals state
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [rejectingEntry, setRejectingEntry] = useState<CashEntry | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');
  
  const [cancelingEntry, setCancelingEntry] = useState<CashEntry | null>(null);
  const [alasanBatal, setAlasanBatal] = useState('');

  // Add Manual Form State
  const [formTipe, setFormTipe] = useState<CashType>('masuk');
  const [formKategori, setFormKategori] = useState<string>('');
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formTanggal, setFormTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Set default category when switching type
  React.useEffect(() => {
    if (formTipe === 'masuk') {
      setFormKategori(settings.kategoriKasMasuk[2] || 'Infaq / Sedekah Wali Santri');
    } else {
      setFormKategori(settings.kategoriKasKeluar[0] || 'Listrik & Air (PLN & PDAM)');
    }
  }, [formTipe, settings]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cashEntries.filter(entry => {
      if (activeTab === 'masuk' && entry.tipe !== 'masuk') return false;
      if (activeTab === 'keluar' && entry.tipe !== 'keluar') return false;
      if (activeTab === 'pending' && entry.status !== 'Menunggu Persetujuan') return false;

      if (categoryFilter !== 'Semua' && entry.kategori !== categoryFilter) return false;

      // Date range filter
      if (dateRange !== 'semua') {
        const parts = entry.tanggal.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const now = new Date();
        if (dateRange === 'tahun_ini' && year !== now.getFullYear()) return false;
        if (dateRange === 'bulan_ini' && (year !== now.getFullYear() || month !== (now.getMonth() + 1))) return false;
      }

      return true;
    });
  }, [cashEntries, activeTab, categoryFilter, dateRange]);

  // Submit Manual Cash Entry
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (formNominal <= 0) {
      showToast('Nominal harus lebih besar dari 0', 'error');
      return;
    }
    if (!formKeterangan.trim()) {
      showToast('Keterangan kas wajib diisi', 'error');
      return;
    }

    const res = addManualCashEntry({
      tipe: formTipe,
      kategori: formKategori,
      nominal: formNominal,
      keterangan: formKeterangan,
      tanggal: formTanggal
    });

    if (res.success) {
      setIsAddManualOpen(false);
      setFormNominal(0);
      setFormKeterangan('');
    }
  };

  // Submit Reject
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingEntry) return;
    if (!alasanTolak.trim()) {
      showToast('Gagal: Keterangan penolakan wajib diisi.', 'error');
      return;
    }

    const res = rejectCashKeluar(rejectingEntry.id, alasanTolak);
    if (res.success) {
      setRejectingEntry(null);
      setAlasanTolak('');
    }
  };

  // Submit Cancel Approved / Pending Entry
  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingEntry) return;

    if (cancelingEntry.status === 'Disetujui') {
      if (alasanBatal.trim().length < 10) {
        showToast('Gagal: Alasan pembatalan minimal 10 karakter.', 'error');
        return;
      }
      const res = cancelApprovedCashKeluar(cancelingEntry.id, alasanBatal);
      if (res.success) {
        setCancelingEntry(null);
        setAlasanBatal('');
      }
    } else if (cancelingEntry.status === 'Menunggu Persetujuan') {
      const res = cancelPendingCashKeluar(cancelingEntry.id, alasanBatal || 'Dibatalkan oleh pemohon');
      if (res.success) {
        setCancelingEntry(null);
        setAlasanBatal('');
      }
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Buku Kas & Jurnal Pengeluaran</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jurnal pembukuan immutable dengan alur Maker-Checker otorisasi pengeluaran
          </p>
        </div>

        {currentUser.role !== 'sekretaris' && (
          <button
            onClick={() => setIsAddManualOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Kas Manual (Non-Iuran)</span>
          </button>
        )}
      </div>

      {/* Widget Saldo Resmi Rekapitulasi Akhir (PRD Section 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Saldo Awal Terkunci</span>
          <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatRupiah(cashSummary.saldoAwal)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Total Kas Masuk Aktif</span>
          <div className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            +{formatRupiah(cashSummary.totalMasuk)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Total Kas Keluar Disetujui</span>
          <div className="font-mono text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
            -{formatRupiah(cashSummary.totalKeluar)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-md">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Dana Tersisa (Saldo Kas)</span>
          <div className="font-mono text-xl font-black mt-1">
            {formatRupiah(cashSummary.danaTersisa)}
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'semua' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab('masuk')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'masuk' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kas Masuk
          </button>
          <button
            onClick={() => setActiveTab('keluar')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'keluar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kas Keluar
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all relative ${
              activeTab === 'pending' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Persetujuan</span>
            {cashSummary.pendingKeluarCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                {cashSummary.pendingKeluarCount}
              </span>
            )}
          </button>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="semua">Semua Waktu</option>
            <option value="bulan_ini">Bulan Ini</option>
            <option value="tahun_ini">Tahun Ini</option>
          </select>
        </div>

      </div>

      {/* Jurnal Kas Table (Strict Immutable - NO HAPUS BUTTON) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3">Tipe & Kategori</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-3">Sumber</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi kas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isMasuk = entry.tipe === 'masuk';
                  const isDisetujui = entry.status === 'Disetujui';
                  const isPending = entry.status === 'Menunggu Persetujuan';
                  const isDitolak = entry.status === 'Ditolak';
                  const isBatal = entry.status === 'Dibatalkan';

                  return (
                    <tr 
                      key={entry.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isBatal || isDitolak ? 'opacity-60 bg-slate-50/40 dark:bg-slate-800/20' : ''
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        {formatDateIndo(entry.tanggal)}
                      </td>

                      {/* Tipe & Kategori */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isMasuk ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">▲ Masuk</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">▼ Keluar</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {entry.kategori}
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {entry.keterangan}
                        </p>
                        {isDitolak && entry.alasanTolak && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 italic mt-0.5">
                            Alasan ditolak: {entry.alasanTolak}
                          </p>
                        )}
                        {isBatal && entry.alasanBatal && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 italic mt-0.5">
                            Alasan dibatalkan: {entry.alasanBatal} ({entry.batalOleh})
                          </p>
                        )}
                      </td>

                      {/* Sumber */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          entry.sumber === 'Sistem Iuran'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {entry.sumber}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isMasuk ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                          {isMasuk ? '+' : '-'}{formatRupiah(entry.nominal)}
                        </span>
                      </td>

                      {/* Status Maker-Checker */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDisetujui
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : isDitolak
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {entry.status}
                        </span>
                      </td>

                      {/* Actions according to Role & Maker-Checker State */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* If linked to payment receipt */}
                          {entry.paymentId && (
                            <button
                              onClick={() => {
                                const tx = transactions.find(t => t.id === entry.paymentId);
                                if (tx) setActiveReceipt(tx);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Lihat Kuitansi Terhubung"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* CASE 1: Menunggu Persetujuan */}
                          {isPending && (
                            <>
                              {/* Admin: Setujui / Tolak */}
                              {currentUser.role === 'admin' && (
                                <>
                                  <button
                                    onClick={() => approveCashKeluar(entry.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] shadow-xs cursor-pointer"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => setRejectingEntry(entry)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {/* Bendahara: Batalkan Pengajuan miliknya */}
                              {currentUser.role === 'bendahara' && entry.dibuatOleh === currentUser.username && (
                                <button
                                  onClick={() => setCancelingEntry(entry)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg"
                                >
                                  Batalkan Pengajuan
                                </button>
                              )}
                            </>
                          )}

                          {/* CASE 2: Disetujui (Admin can Cancel with reason min 10 chars) */}
                          {isDisetujui && currentUser.role === 'admin' && (
                            <button
                              onClick={() => setCancelingEntry(entry)}
                              className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                              title="Batalkan Kas Keluar yang telah disetujui"
                            >
                              Batalkan
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Catat Kas Manual (Non-Iuran) */}
      {isAddManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Catat Transaksi Kas Manual (Non-Iuran)
              </h3>
              <button onClick={() => setIsAddManualOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5">
              
              {/* Tipe: Masuk / Keluar */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormTipe('masuk')}
                  className={`py-2 rounded-lg transition-all ${
                    formTipe === 'masuk' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kas Masuk (Infaq/Donasi)
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipe('keluar')}
                  className={`py-2 rounded-lg transition-all ${
                    formTipe === 'keluar' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kas Keluar (Operasional)
                </button>
              </div>

              {/* Kategori Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Transaksi *
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  {(formTipe === 'masuk' ? settings.kategoriKasMasuk : settings.kategoriKasKeluar).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Nominal & Maker-Checker threshold indicator */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nominal Rupiah *
                  </label>
                  {formTipe === 'keluar' && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      Threshold Approval: {formatRupiah(settings.approvalThreshold)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  step="1000"
                  min="1000"
                  placeholder="0"
                  value={formNominal || ''}
                  onChange={(e) => setFormNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold"
                />

                {formTipe === 'keluar' && formNominal >= settings.approvalThreshold && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    * Nominal ini ≥ {formatRupiah(settings.approvalThreshold)}. Akan otomatis masuk ke status <strong>Menunggu Persetujuan Admin</strong> sebelum mengurangi saldo kas.
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Rincian Pengeluaran *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Rincian peruntukan kas..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddManualOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Transaksi Kas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tolak Kas Keluar */}
      {rejectingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Tolak Pengajuan Kas Keluar
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pengajuan: <strong>{rejectingEntry.keterangan}</strong> ({formatRupiah(rejectingEntry.nominal)}). Keterangan penolakan wajib diisi.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                required
                rows={3}
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Alasan penolakan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingEntry(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
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

      {/* MODAL 3: Batalkan Transaksi Kas (Min 10 Karakter) */}
      {cancelingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <h3>Batalkan Transaksi Kas</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Transaksi: <strong>{cancelingEntry.keterangan}</strong> ({formatRupiah(cancelingEntry.nominal)}). Transaksi tidak akan dihapus, hanya statusnya yang menjadi <em>Dibatalkan</em>.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              {cancelingEntry.status === 'Disetujui' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alasan Pembatalan (Min 10 Karakter) *
                    </label>
                    <span className={`text-[11px] font-mono ${alasanBatal.trim().length < 10 ? 'text-rose-500 font-bold' : 'text-emerald-500'}`}>
                      {alasanBatal.trim().length}/10
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={alasanBatal}
                    onChange={(e) => setAlasanBatal(e.target.value)}
                    placeholder="Alasan pembatalan..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelingEntry(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={cancelingEntry.status === 'Disetujui' && alasanBatal.trim().length < 10}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs ${
                    cancelingEntry.status !== 'Disetujui' || alasanBatal.trim().length >= 10
                      ? 'bg-rose-600 hover:bg-rose-500 cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi Pembatalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
