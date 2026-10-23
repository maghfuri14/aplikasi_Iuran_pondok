import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Santri, KilatanProgram } from '../types';
import { 
  Sparkles, 
  Search, 
  UserPlus, 
  Eye, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Wallet,
  Users,
  Check,
  X,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { 
  KILATAN_PROGRAMS, 
  formatRupiah 
} from '../utils/formatters';

interface KilatanViewProps {
  onOpenPaymentModal: (santriId?: string, program?: KilatanProgram) => void;
}

export const KilatanView: React.FC<KilatanViewProps> = ({ onOpenPaymentModal }) => {
  const { 
    currentUser, 
    santriList, 
    settings, 
    getKilatanStatus, 
    setActiveReceipt, 
    setSelectedSantriDetail,
    setIsQuickPaymentOpen,
    showToast 
  } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<'Semua' | 'Kilatan' | 'Mukim' | 'Nduduk'>('Semua');

  // Filtered santri list
  const displaySantri = useMemo(() => {
    return santriList.filter(s => {
      if (s.status === 'Arsip') return false;
      if (kategoriFilter !== 'Semua' && s.kategori !== kategoriFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
      }
      return true;
    });
  }, [santriList, kategoriFilter, searchQuery]);

  // Overall Statistics for Selected Year
  const programStats = useMemo(() => {
    const stats: Record<KilatanProgram, { lunasCount: number; totalNominal: number }> = {
      'Maulid': { lunasCount: 0, totalNominal: 0 },
      'Jumadil Ula': { lunasCount: 0, totalNominal: 0 },
      'Romadhon': { lunasCount: 0, totalNominal: 0 },
      'Dzulhijjah': { lunasCount: 0, totalNominal: 0 }
    };

    displaySantri.forEach(santri => {
      KILATAN_PROGRAMS.forEach(prog => {
        const st = getKilatanStatus(santri.id, prog, selectedYear);
        if (st.isPaid) {
          stats[prog].lunasCount += 1;
          stats[prog].totalNominal += st.tarif;
        }
      });
    });

    const grandTotalNominal = Object.values(stats).reduce((acc, curr) => acc + curr.totalNominal, 0);
    const totalTransactions = Object.values(stats).reduce((acc, curr) => acc + curr.lunasCount, 0);

    return { stats, grandTotalNominal, totalTransactions };
  }, [displaySantri, selectedYear, getKilatanStatus]);

  // Handle click on program cell
  const handleProgramClick = (santri: Santri, program: KilatanProgram) => {
    const status = getKilatanStatus(santri.id, program, selectedYear);
    if (status.isPaid) {
      if (status.transaction) {
        setActiveReceipt(status.transaction);
      } else {
        // Fallback receipt so kuitansi ALWAYS displays
        const progIdx = KILATAN_PROGRAMS.indexOf(program);
        const fallbackReceipt = {
          id: `tx_kilatan_${santri.id}_${program}_${selectedYear}`,
          nomorKuitansi: `AH/${selectedYear}/0${progIdx + 1}/KLT`,
          santriId: santri.id,
          santriNama: santri.nama,
          santriNis: santri.nis,
          santriKategori: santri.kategori,
          jenisIuran: 'Kilatan' as const,
          kilatanProgram: program,
          periodeTahun: selectedYear,
          nominalTotal: status.tarif,
          metode: 'Tunai' as const,
          allocations: [],
          tanggalTransaksi: `${selectedYear}-0${progIdx + 1}-15`,
          createdAt: new Date().toISOString(),
          petugasUsername: 'bendahara',
          status: 'Aktif' as const,
          printCount: 0
        };
        setActiveReceipt(fallbackReceipt);
      }
    } else {
      if (currentUser.role === 'sekretaris') {
        showToast('Sekretaris tidak memiliki hak akses pembayaran.', 'warning');
        return;
      }
      onOpenPaymentModal(santri.id, program);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Matrix Iuran Program Kilatan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring pembayaran 4 program musiman: Maulid, Jumadil Ula, Romadhon, dan Dzulhijjah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden cursor-pointer"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear} (Tahun Ini)</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          {/* Button: Daftar Santri Kilatan Baru & Bayar */}
          {currentUser.role !== 'sekretaris' && (
            <button
              onClick={() => setIsQuickPaymentOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Santri Kilatan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan & Referensi Tarif Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Terkumpul */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Iuran Kilatan ({selectedYear})
            </span>
            <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatRupiah(programStats.grandTotalNominal)}
            </span>
            <span className="text-[10px] text-slate-400">
              {programStats.totalTransactions} transaksi tercatat lunas
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tarif Santri Kilatan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Santri Kilatan Baru
              </span>
            </div>
            <span className="font-mono text-base font-black text-slate-900 dark:text-white mt-1 block">
              {formatRupiah(settings.kilatanTarif.Kilatan)}
            </span>
            <span className="text-[10px] text-slate-400">Per program iuran</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Khusus Kilatan
          </span>
        </div>

        {/* Card 3: Tarif Santri Mukim */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Santri Mukim
              </span>
            </div>
            <span className="font-mono text-base font-black text-slate-900 dark:text-white mt-1 block">
              {formatRupiah(settings.kilatanTarif.Mukim)}
            </span>
            <span className="text-[10px] text-slate-400">Menetap di asrama</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Santri Mukim
          </span>
        </div>

        {/* Card 4: Tarif Santri Nduduk */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Santri Nduduk
              </span>
            </div>
            <span className="font-mono text-base font-black text-slate-900 dark:text-white mt-1 block">
              {formatRupiah(settings.kilatanTarif.Nduduk)}
            </span>
            <span className="text-[10px] text-slate-400">Santri pulang-pergi</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            Santri Nduduk
          </span>
        </div>

      </div>

      {/* Filter, Search & Status Legend Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Live Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Category Filter Pills with Item Counters */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            {(['Semua', 'Kilatan', 'Mukim', 'Nduduk'] as const).map(cat => {
              const count = santriList.filter(s => {
                if (s.status === 'Arsip') return false;
                if (cat !== 'Semua' && s.kategori !== cat) return false;
                return true;
              }).length;

              return (
                <button
                  key={cat}
                  onClick={() => setKategoriFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    kategoriFilter === cat
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Legend Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Legenda Simbol:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center font-black text-xs">
                ✓
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                Lunas (Klik untuk Kuitansi)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center justify-center font-black text-xs">
                ✗
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                Belum Bayar (Klik untuk Bayar)
              </span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Menampilkan {displaySantri.length} santri
          </span>
        </div>

      </div>

      {/* Matrix Table View (Strict Order: Maulid, Jumadil Ula, Romadhon, Dzulhijjah) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                
                {/* Sticky Left Student Column */}
                <th className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                  Santri / Kategori
                </th>

                {/* 4 Program Columns in Strict Order */}
                {KILATAN_PROGRAMS.map(prog => (
                  <th key={prog} className="py-3.5 px-3 text-center min-w-[100px] w-32 border-l border-slate-200/60 dark:border-slate-800/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {prog}
                    </span>
                  </th>
                ))}

                {/* Action Column */}
                <th className="py-3.5 px-4 text-right w-16">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {displaySantri.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada santri yang sesuai kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                displaySantri.map(santri => {
                  const tarifForSantri = settings.kilatanTarif[santri.kategori] || 70000;

                  return (
                    <tr 
                      key={santri.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Sticky Santri Info */}
                      <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => setSelectedSantriDetail(santri)}
                          className="font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 text-left transition-colors cursor-pointer text-xs block truncate max-w-[180px]"
                        >
                          {santri.nama}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="font-mono text-slate-400">{santri.nis}</span>
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${
                            santri.kategori === 'Kilatan'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : santri.kategori === 'Mukim'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}>
                            {santri.kategori}
                          </span>
                        </div>
                      </td>

                      {/* 4 Programs Columns in Strict Order */}
                      {KILATAN_PROGRAMS.map(prog => {
                        const status = getKilatanStatus(santri.id, prog, selectedYear);

                        return (
                          <td key={prog} className="py-2.5 px-3 text-center border-l border-slate-100 dark:border-slate-800/60">
                            {status.isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleProgramClick(santri, prog)}
                                className="w-10 h-8 mx-auto rounded-lg border text-sm font-black transition-all flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 cursor-pointer bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900"
                                title={`Lunas (${formatRupiah(status.tarif)}) - Klik untuk lihat kuitansi`}
                              >
                                <span>✓</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleProgramClick(santri, prog)}
                                className="w-10 h-8 mx-auto rounded-lg border text-sm font-black transition-all flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 cursor-pointer bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-200 dark:hover:bg-rose-900 font-bold"
                                title={`Belum Bayar (Tarif: ${formatRupiah(tarifForSantri)}) - Klik untuk bayar`}
                              >
                                <span>✗</span>
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Detail Icon Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSantriDetail(santri)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Lihat Detail Santri"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Summary per Program */}
            {displaySantri.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 text-xs">
                  <td className="py-3 px-4 font-bold sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] text-slate-900 dark:text-white">
                    Total Lunas & Penerimaan:
                  </td>
                  {KILATAN_PROGRAMS.map(prog => {
                    const st = programStats.stats[prog];
                    return (
                      <td key={prog} className="py-3 px-3 text-center border-l border-slate-200/60 dark:border-slate-800/60">
                        <div className="font-bold font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                          {st.lunasCount} Santri
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {formatRupiah(st.totalNominal)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      </div>

    </div>
  );
};
