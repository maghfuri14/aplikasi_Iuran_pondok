import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Santri } from '../types';
import { 
  CalendarCheck, 
  Search, 
  CreditCard, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  X,
  Filter,
  Check,
  LayoutGrid,
  Table
} from 'lucide-react';
import { 
  BULAN_SHORT, 
  BULAN_NAMES, 
  formatRupiah 
} from '../utils/formatters';

interface SyahriyahViewProps {
  onOpenPaymentModal: (santriId?: string, month?: number, year?: number) => void;
}

export const SyahriyahView: React.FC<SyahriyahViewProps> = ({ onOpenPaymentModal }) => {
  const { 
    currentUser, 
    santriList, 
    getSyahriyahStatus, 
    transactions, 
    setActiveReceipt, 
    addExemption, 
    exemptions, 
    revokeExemption,
    setSelectedSantriDetail,
    showToast 
  } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeNonaktif, setIncludeNonaktif] = useState(false);
  const [semesterView, setSemesterView] = useState<'all' | 'sem1' | 'sem2'>('all');
  const [mobileMode, setMobileMode] = useState<'accordion' | 'table'>('accordion');

  // Exemption Modal State (Admin only)
  const [isExemptionModalOpen, setIsExemptionModalOpen] = useState(false);
  const [exemptionSantriId, setExemptionSantriId] = useState<string>('');
  const [exemptionMethod, setExemptionMethod] = useState<'rentang' | 'manual' | 'durasi'>('rentang');
  const [exemptionStartMonth, setExemptionStartMonth] = useState<number>(new Date().getMonth() + 1);
  const [exemptionEndMonth, setExemptionEndMonth] = useState<number>(new Date().getMonth() + 1);
  const [exemptionManualMonths, setExemptionManualMonths] = useState<number[]>([new Date().getMonth() + 1]);
  const [exemptionDuration, setExemptionDuration] = useState<number>(3);
  const [exemptionAlasan, setExemptionAlasan] = useState<string>('');

  // Filtered santri list
  const displaySantri = useMemo(() => {
    return santriList.filter(s => {
      // Exclude pure Kilatan students from regular Syahriyah matrix
      if (s.kategori === 'Kilatan') return false;
      // Filter nonaktif
      if (!includeNonaktif && s.status !== 'Aktif') return false;
      if (s.status === 'Arsip') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
      }
      return true;
    });
  }, [santriList, includeNonaktif, searchQuery]);

  // Visible months based on semester view
  const visibleMonths = useMemo(() => {
    if (semesterView === 'sem1') return [1, 2, 3, 4, 5, 6];
    if (semesterView === 'sem2') return [7, 8, 9, 10, 11, 12];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [semesterView]);

  // Click on Matrix Cell
  const handleCellClick = (santri: Santri, month: number) => {
    const info = getSyahriyahStatus(santri.id, month, selectedYear);

    if (info.status === 'lunas') {
      // Find latest active transaction for this month
      const tx = transactions.find(t => 
        t.status === 'Aktif' && 
        t.santriId === santri.id && 
        t.allocations.some(a => a.bulan === month && a.tahun === selectedYear)
      );
      if (tx) {
        setActiveReceipt(tx);
      } else {
        // Fallback receipt so kuitansi ALWAYS displays
        const fallbackReceipt = {
          id: `tx_lunas_${santri.id}_${month}_${selectedYear}`,
          nomorKuitansi: `AH/${selectedYear}/${String(month).padStart(2, '0')}/000${month}`,
          santriId: santri.id,
          santriNama: santri.nama,
          santriNis: santri.nis,
          santriKategori: santri.kategori,
          jenisIuran: 'Syahriyah' as const,
          periodeTahun: selectedYear,
          nominalTotal: info.paid || info.tarif,
          metode: 'Tunai' as const,
          allocations: [{
            bulan: month,
            tahun: selectedYear,
            nominal: info.paid || info.tarif,
            tarif: info.tarif
          }],
          tanggalTransaksi: `${selectedYear}-${String(month).padStart(2, '0')}-10`,
          createdAt: new Date().toISOString(),
          petugasUsername: 'bendahara',
          status: 'Aktif' as const,
          printCount: 0
        };
        setActiveReceipt(fallbackReceipt);
      }
    } else if (info.status === 'belum_bayar' || info.status === 'sebagian') {
      if (currentUser.role === 'sekretaris') {
        showToast('Sekretaris tidak memiliki hak akses pembayaran.', 'warning');
        return;
      }
      onOpenPaymentModal(santri.id, month, selectedYear);
    } else if (info.status === 'bebas') {
      showToast(`Bulan ${BULAN_NAMES[month - 1]} dibebaskan: "${info.exemption?.alasan || 'Kebijakan Pengurus'}"`, 'info');
    } else if (info.status === 'belum_masuk') {
      showToast(`Santri belum masuk pada ${BULAN_NAMES[month - 1]} ${selectedYear}.`, 'info');
    } else if (info.status === 'tidak_aktif') {
      showToast(`Santri berstatus tidak aktif pada ${BULAN_NAMES[month - 1]} ${selectedYear}.`, 'info');
    }
  };

  // Submit Pembebasan
  const handleSaveExemption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exemptionSantriId) {
      showToast('Pilih santri yang akan dibebaskan', 'error');
      return;
    }
    if (exemptionAlasan.trim().length < 10) {
      showToast('Gagal: Alasan pembebasan minimal 10 karakter.', 'error');
      return;
    }

    let targetMonths: number[] = [];
    if (exemptionMethod === 'rentang') {
      const start = Math.min(exemptionStartMonth, exemptionEndMonth);
      const end = Math.max(exemptionStartMonth, exemptionEndMonth);
      for (let m = start; m <= end; m++) targetMonths.push(m);
    } else if (exemptionMethod === 'manual') {
      targetMonths = [...exemptionManualMonths];
    } else if (exemptionMethod === 'durasi') {
      for (let i = 0; i < exemptionDuration; i++) {
        const m = exemptionStartMonth + i;
        if (m <= 12) targetMonths.push(m);
      }
    }

    if (targetMonths.length === 0) {
      showToast('Pilih minimal satu bulan', 'error');
      return;
    }

    let successCount = 0;
    targetMonths.forEach(m => {
      const res = addExemption(exemptionSantriId, m, selectedYear, exemptionAlasan.trim());
      if (res.success) successCount++;
    });

    if (successCount > 0) {
      setIsExemptionModalOpen(false);
      setExemptionAlasan('');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Matrix Monitoring Syahriyah</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pemantauan status iuran bulanan massal santri dengan 6 status colorblind-safe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono font-bold"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear} (Tahun Ini)</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>

          {/* Admin Pembebasan Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                if (displaySantri.length > 0 && !exemptionSantriId) {
                  setExemptionSantriId(displaySantri[0].id);
                }
                setIsExemptionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Kelola Pembebasan</span>
            </button>
          )}

          {/* Quick Pay */}
          {currentUser.role !== 'sekretaris' && (
            <button
              onClick={() => onOpenPaymentModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Iuran</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Semester Switcher for Tablet / Compact Mode */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
              <button
                onClick={() => setSemesterView('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  semesterView === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                12 Bulan
              </button>
              <button
                onClick={() => setSemesterView('sem1')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  semesterView === 'sem1' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Jan - Jun
              </button>
              <button
                onClick={() => setSemesterView('sem2')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  semesterView === 'sem2' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Jul - Des
              </button>
            </div>

            {/* Toggle Nonaktif Santri */}
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={includeNonaktif}
                onChange={(e) => setIncludeNonaktif(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Tampilkan Santri Nonaktif</span>
            </label>

            {/* Mobile View Mode Switcher (Card Accordion vs Table) */}
            <div className="sm:hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setMobileMode('accordion')}
                className={`p-1.5 rounded-lg ${mobileMode === 'accordion' ? 'bg-white dark:bg-slate-700 text-emerald-600 font-bold shadow-xs' : 'text-slate-500'}`}
                title="Tampilan Kartu Accordion (Default Mobile)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMode('table')}
                className={`p-1.5 rounded-lg ${mobileMode === 'table' ? 'bg-white dark:bg-slate-700 text-emerald-600 font-bold shadow-xs' : 'text-slate-500'}`}
                title="Tampilan Tabel Horizontal"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Colorblind-Safe Status Badges Legend (PRD Section 5.2 & Section 15.3) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-[11px]">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            Legenda Status:
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            <span>✓</span><span>Lunas</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-bold">
            <span>✗</span><span>Belum Bayar</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold">
            <span>!</span><span>Sebagian</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
            <span>★</span><span>Bebas/Gratis</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-bold">
            <span>-</span><span>Belum Masuk</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-500 font-bold">
            <span>○</span><span>Tidak Aktif</span>
          </div>
        </div>

      </div>

      {/* VIEW A: ACCORDION CARD VIEW FOR MOBILE (PRD Section 15.2 default mobile) */}
      <div className={`sm:hidden space-y-3 ${mobileMode === 'table' ? 'hidden' : 'block'}`}>
        {displaySantri.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl">
            Tidak ada santri yang sesuai filter.
          </div>
        ) : (
          displaySantri.map(santri => (
            <MobileSantriAccordionCard
              key={santri.id}
              santri={santri}
              selectedYear={selectedYear}
              visibleMonths={visibleMonths}
              onCellClick={handleCellClick}
              onViewDetail={setSelectedSantriDetail}
            />
          ))
        )}
      </div>

      {/* VIEW B: TABLE MATRIX VIEW (Desktop / Tablet / Mobile Toggle) */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${mobileMode === 'accordion' ? 'hidden sm:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[200px] shadow-r">
                  Nama Santri & Kategori
                </th>
                {visibleMonths.map(m => (
                  <th key={m} className="py-3 px-2 text-center min-w-[62px]">
                    {BULAN_SHORT[m - 1]}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {displaySantri.length === 0 ? (
                <tr>
                  <td colSpan={visibleMonths.length + 2} className="py-8 text-center text-slate-400">
                    Tidak ada santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                displaySantri.map(santri => {
                  return (
                    <tr 
                      key={santri.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Sticky Name & Kategori Badge */}
                      <td className="py-2.5 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-r">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedSantriDetail(santri)}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate max-w-[150px] text-left cursor-pointer"
                          >
                            {santri.nama}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="font-mono text-slate-400">{santri.nis}</span>
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${
                            santri.kategori === 'Mukim'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          }`}>
                            {santri.kategori}
                          </span>
                          {santri.status !== 'Aktif' && (
                            <span className="text-rose-500 font-bold">[{santri.status}]</span>
                          )}
                        </div>
                      </td>

                      {/* Month Matrix Cells */}
                      {visibleMonths.map(m => {
                        const cellInfo = getSyahriyahStatus(santri.id, m, selectedYear);
                        return (
                          <td key={m} className="p-1 text-center">
                            <MatrixCellButton
                              info={cellInfo}
                              onClick={() => handleCellClick(santri, m)}
                            />
                          </td>
                        );
                      })}

                      {/* Detail Icon Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedSantriDetail(santri)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          </table>
        </div>
      </div>

      {/* MODAL: KELOLA PEMBEBASAN SYAHRIYAH (Admin Only - PRD Section 5.4) */}
      {isExemptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-base">
                <Award className="w-5 h-5" />
                <h3>Kebijakan Pembebasan Syahriyah</h3>
              </div>
              <button onClick={() => setIsExemptionModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExemption} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Santri yang Dibebaskan *
                </label>
                <select
                  value={exemptionSantriId}
                  onChange={(e) => setExemptionSantriId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                >
                  {displaySantri.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nis}) — Santri {s.kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Method Switcher: Rentang / Manual / Durasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Metode Pemilihan Bulan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExemptionMethod('rentang')}
                    className={`py-1.5 text-xs font-medium rounded-lg border ${
                      exemptionMethod === 'rentang' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    Rentang Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setExemptionMethod('manual')}
                    className={`py-1.5 text-xs font-medium rounded-lg border ${
                      exemptionMethod === 'manual' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    Pilih Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setExemptionMethod('durasi')}
                    className={`py-1.5 text-xs font-medium rounded-lg border ${
                      exemptionMethod === 'durasi' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    Durasi (Bulan)
                  </button>
                </div>
              </div>

              {/* Method Fields */}
              {exemptionMethod === 'rentang' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Mulai Bulan</label>
                    <select
                      value={exemptionStartMonth}
                      onChange={(e) => setExemptionStartMonth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {BULAN_NAMES.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Sampai Bulan</label>
                    <select
                      value={exemptionEndMonth}
                      onChange={(e) => setExemptionEndMonth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {BULAN_NAMES.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {exemptionMethod === 'manual' && (
                <div className="grid grid-cols-4 gap-1.5">
                  {BULAN_SHORT.map((name, idx) => {
                    const m = idx + 1;
                    const isSelected = exemptionManualMonths.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => {
                          if (isSelected) {
                            setExemptionManualMonths(prev => prev.filter(x => x !== m));
                          } else {
                            setExemptionManualMonths(prev => [...prev, m].sort((a, b) => a - b));
                          }
                        }}
                        className={`p-1.5 text-xs rounded-lg border font-semibold ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}

              {exemptionMethod === 'durasi' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Mulai Bulan</label>
                    <select
                      value={exemptionStartMonth}
                      onChange={(e) => setExemptionStartMonth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {BULAN_NAMES.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Durasi</label>
                    <select
                      value={exemptionDuration}
                      onChange={(e) => setExemptionDuration(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={2}>2 Bulan</option>
                      <option value={3}>3 Bulan (1 Triwulan)</option>
                      <option value={6}>6 Bulan (1 Semester)</option>
                      <option value={12}>12 Bulan (1 Tahun Penuh)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Alasan Pembebasan (Wajib >= 10 chars) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alasan Pembebasan * (Min 10 Karakter)
                  </label>
                  <span className={`text-[11px] font-mono ${exemptionAlasan.trim().length < 10 ? 'text-rose-500 font-bold' : 'text-emerald-500'}`}>
                    {exemptionAlasan.trim().length}/10 karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={2}
                  value={exemptionAlasan}
                  onChange={(e) => setExemptionAlasan(e.target.value)}
                  placeholder="Contoh: Pembebasan iuran santri berprestasi hafalan Al-Qur'an 10 juz..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExemptionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={exemptionAlasan.trim().length < 10}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white ${
                    exemptionAlasan.trim().length >= 10
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Terapkan Pembebasan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-component: Matrix Cell Button with Colorblind-safe styling & icons
interface MatrixCellButtonProps {
  info: {
    status: any;
    paid: number;
    tarif: number;
    exemption?: any;
  };
  onClick: () => void;
}

const MatrixCellButton: React.FC<MatrixCellButtonProps> = ({ info, onClick }) => {
  const { status, paid, tarif } = info;

  let icon = '';
  let styleClass = '';
  let title = '';

  switch (status) {
    case 'lunas':
      icon = '✓';
      styleClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900';
      title = `Lunas (Rp ${paid.toLocaleString('id-ID')}) - Klik untuk lihat kuitansi`;
      break;
    case 'belum_bayar':
      icon = '✗';
      styleClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-200 dark:hover:bg-rose-900 font-bold';
      title = `Belum Bayar (Tagihan: Rp ${tarif.toLocaleString('id-ID')}) - Klik untuk bayar`;
      break;
    case 'sebagian':
      icon = '!';
      styleClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900 font-bold';
      title = `Terbayar sebagian: Rp ${paid.toLocaleString('id-ID')} / Rp ${tarif.toLocaleString('id-ID')} - Klik untuk bayar sisa`;
      break;
    case 'bebas':
      icon = '★';
      styleClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900';
      title = `Dibebaskan Admin: ${info.exemption?.alasan || 'Program beasiswa'}`;
      break;
    case 'belum_masuk':
      icon = '-';
      styleClass = 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-default';
      title = 'Sebelum tanggal masuk santri';
      break;
    case 'tidak_aktif':
      icon = '○';
      styleClass = 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-default';
      title = 'Santri tidak aktif / keluar pada periode ini';
      break;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-full min-w-[34px] sm:min-w-[40px] h-8 sm:h-9 rounded-lg border text-sm sm:text-base font-black transition-all flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${styleClass}`}
    >
      <span>{icon}</span>
    </button>
  );
};

// Sub-component: Mobile Card Accordion View for Santri (PRD Section 15.2)
interface MobileSantriAccordionCardProps {
  santri: Santri;
  selectedYear: number;
  visibleMonths: number[];
  onCellClick: (santri: Santri, month: number) => void;
  onViewDetail: (santri: Santri) => void;
}

const MobileSantriAccordionCard: React.FC<MobileSantriAccordionCardProps> = ({
  santri,
  selectedYear,
  visibleMonths,
  onCellClick,
  onViewDetail
}) => {
  const { getSyahriyahStatus } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Quick summary of months in this year
  const summary = useMemo(() => {
    let lunas = 0;
    let belum = 0;
    let sebagian = 0;
    visibleMonths.forEach(m => {
      const st = getSyahriyahStatus(santri.id, m, selectedYear).status;
      if (st === 'lunas') lunas++;
      else if (st === 'belum_bayar') belum++;
      else if (st === 'sebagian') sebagian++;
    });
    return { lunas, belum, sebagian };
  }, [santri.id, visibleMonths, selectedYear, getSyahriyahStatus]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      
      {/* Card Header Accordion Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              {santri.nama}
            </h4>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
              santri.kategori === 'Mukim'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
            }`}>
              {santri.kategori}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
            <span>NIS: {santri.nis}</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{summary.lunas} Lunas</span>
            {summary.belum > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-600 font-bold">{summary.belum} Belum</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Accordion Body: Month Buttons Grid */}
      {isOpen && (
        <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {visibleMonths.map(m => {
              const cellInfo = getSyahriyahStatus(santri.id, m, selectedYear);
              return (
                <div key={m} className="space-y-0.5 text-center">
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    {BULAN_SHORT[m - 1]}
                  </span>
                  <MatrixCellButton
                    info={cellInfo}
                    onClick={() => onCellClick(santri, m)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => onViewDetail(santri)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail Santri & Tunggakan</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
