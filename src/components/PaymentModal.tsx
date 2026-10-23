import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Santri, 
  PaymentMethod, 
  PaymentAllocation, 
  KilatanProgram,
  AdditionalFeePayment,
  IuranTambahan
} from '../types';
import { 
  X, 
  Search, 
  CalendarCheck, 
  Sparkles, 
  AlertTriangle, 
  UserPlus, 
  CreditCard, 
  CheckCircle, 
  HelpCircle, 
  Trash2, 
  Coins, 
  Check,
  Tag,
  Calculator,
  CheckSquare
} from 'lucide-react';
import { 
  formatRupiah, 
  BULAN_NAMES, 
  BULAN_SHORT, 
  KILATAN_PROGRAMS 
} from '../utils/formatters';

export interface MonthAllocationItem {
  bulan: number;
  tahun: number;
  sisa: number;
  tarif: number;
  nominal: number;
  mode: 'lunas' | 'cicil';
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSantriId?: string;
  initialTab?: 'syahriyah' | 'kilatan';
  initialProgram?: KilatanProgram;
  initialMonth?: number;
  initialYear?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  initialSantriId,
  initialTab = 'syahriyah',
  initialProgram = 'Maulid',
  initialMonth,
  initialYear
}) => {
  const { 
    santriList, 
    settings, 
    getSyahriyahStatus, 
    getKilatanStatus, 
    addSyahriyahPayment, 
    payKilatan, 
    registerAndPayKilatan,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'syahriyah' | 'kilatan'>(initialTab);
  const [selectedSantriId, setSelectedSantriId] = useState<string>(initialSantriId || '');
  const [santriSearch, setSantriSearch] = useState('');
  
  // Year selector for Syahriyah month picker
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  
  // Selected month allocations for Syahriyah (supports multi-year and per-month cicil/lunas)
  const [selectedAllocations, setSelectedAllocations] = useState<MonthAllocationItem[]>([]);
  const [selectedAdditionalFeeIds, setSelectedAdditionalFeeIds] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [metode, setMetode] = useState<PaymentMethod>('Tunai');
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [skipMonthWarningDismissed, setSkipMonthWarningDismissed] = useState<boolean>(false);

  // Kilatan specific
  const [selectedProgram, setSelectedProgram] = useState<KilatanProgram>(initialProgram);
  const [kilatanYear, setKilatanYear] = useState<number>(currentYear);
  const [isRegisterNewKilatan, setIsRegisterNewKilatan] = useState<boolean>(false);
  
  // New Kilatan student form
  const [newSantriNama, setNewSantriNama] = useState('');
  const [newSantriNis, setNewSantriNis] = useState('');
  const [newSantriGender, setNewSantriGender] = useState<'L' | 'P'>('L');
  const [newSantriTglMasuk, setNewSantriTglMasuk] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newSantriNamaWali, setNewSantriNamaWali] = useState('');
  const [newSantriKontakWali, setNewSantriKontakWali] = useState('');
  const [newSantriAlamat, setNewSantriAlamat] = useState('');

  // Sync initial props
  useEffect(() => {
    if (initialSantriId) {
      setSelectedSantriId(initialSantriId);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialProgram) {
      setSelectedProgram(initialProgram);
    }
    if (initialYear) {
      setTargetYear(initialYear);
    }
    if (initialMonth) {
      const yearToUse = initialYear || targetYear;
      const targetSantri = santriList.find(s => s.id === (initialSantriId || selectedSantriId));
      if (targetSantri) {
        const info = getSyahriyahStatus(targetSantri.id, initialMonth, yearToUse);
        const sisa = Math.max(0, info.tarif - info.paid);
        if (sisa > 0) {
          setSelectedAllocations([{
            bulan: initialMonth,
            tahun: yearToUse,
            sisa,
            tarif: info.tarif,
            nominal: sisa,
            mode: 'lunas'
          }]);
        }
      }
    }
  }, [initialSantriId, initialTab, initialProgram, initialMonth, initialYear, isOpen]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setTanggalTransaksi(new Date().toISOString().split('T')[0]);
      setSkipMonthWarningDismissed(false);
      setIsConfirmed(false);
      if (!initialSantriId && santriList.length > 0 && !selectedSantriId) {
        setSelectedSantriId(santriList[0].id);
      }
    }
  }, [isOpen]);

  const selectedSantri = useMemo(() => {
    return santriList.find(s => s.id === selectedSantriId);
  }, [santriList, selectedSantriId]);

  // Filtered santri for dropdown
  const filteredSantri = useMemo(() => {
    if (!santriSearch) return santriList.filter(s => s.status !== 'Arsip');
    const q = santriSearch.toLowerCase();
    return santriList.filter(s => 
      s.status !== 'Arsip' &&
      (s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q))
    );
  }, [santriList, santriSearch]);

  // Available Iuran Tambahan for selected Santri's category
  const availableAdditionalFees = useMemo(() => {
    if (!selectedSantri) return [];
    const list = settings.iuranTambahanList || [];
    return list.filter(f => f.isActive && (f.kategoriSantri === 'Semua' || f.kategoriSantri === selectedSantri.kategori));
  }, [selectedSantri, settings.iuranTambahanList]);

  // Auto-select Wajib Iuran Tambahan when Santri is selected
  useEffect(() => {
    if (selectedSantri) {
      const list = settings.iuranTambahanList || [];
      const activeFees = list.filter(f => f.isActive && (f.kategoriSantri === 'Semua' || f.kategoriSantri === selectedSantri.kategori));
      const wajibIds = activeFees.filter(f => f.isWajib).map(f => f.id);
      setSelectedAdditionalFeeIds(wajibIds);
    } else {
      setSelectedAdditionalFeeIds([]);
    }
    setIsConfirmed(false);
  }, [selectedSantriId, settings.iuranTambahanList]);

  // Calculation of monthly bills for currently viewed targetYear
  const monthlyBills = useMemo(() => {
    if (!selectedSantri) return [];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
      const info = getSyahriyahStatus(selectedSantri.id, m, targetYear);
      const sisa = Math.max(0, info.tarif - info.paid);
      return {
        bulan: m,
        ...info,
        sisa
      };
    });
  }, [selectedSantri, targetYear, getSyahriyahStatus]);

  // Total sum of all Syahriyah month allocations
  const totalAlokasiSyahriyah = useMemo(() => {
    return selectedAllocations.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  }, [selectedAllocations]);

  // Selected additional fees objects
  const selectedAdditionalFees = useMemo(() => {
    return availableAdditionalFees.filter(f => selectedAdditionalFeeIds.includes(f.id));
  }, [availableAdditionalFees, selectedAdditionalFeeIds]);

  // Total sum of selected additional fees
  const totalAdditionalFees = useMemo(() => {
    return selectedAdditionalFees.reduce((acc, f) => acc + f.nominal, 0);
  }, [selectedAdditionalFees]);

  // Grand Total Akumulasi (Syahriyah allocations + Additional fees)
  const totalAkumulasi = useMemo(() => {
    return totalAlokasiSyahriyah + totalAdditionalFees;
  }, [totalAlokasiSyahriyah, totalAdditionalFees]);

  // Check if any unpaid previous month is skipped
  const hasSkippedUnpaidMonth = useMemo(() => {
    if (selectedAllocations.length === 0 || !selectedSantri) return false;
    
    // Find the earliest selected month and year
    const sorted = [...selectedAllocations].sort((a, b) => a.tahun !== b.tahun ? a.tahun - b.tahun : a.bulan - b.bulan);
    const earliest = sorted[0];

    // Check earlier months in the same year or earlier year
    for (let b = 1; b < earliest.bulan; b++) {
      const check = getSyahriyahStatus(selectedSantri.id, b, earliest.tahun);
      if (check.status === 'belum_bayar' || check.status === 'sebagian') {
        const isSelected = selectedAllocations.some(a => a.bulan === b && a.tahun === earliest.tahun);
        if (!isSelected) return true;
      }
    }
    return false;
  }, [selectedAllocations, selectedSantri, getSyahriyahStatus]);

  // Toggle month selection from matrix grid for targetYear
  const handleToggleMonth = (m: number) => {
    const bill = monthlyBills.find(b => b.bulan === m);
    if (!bill || bill.status === 'lunas' || bill.status === 'bebas' || bill.status === 'belum_masuk' || bill.status === 'tidak_aktif') {
      return;
    }

    const existsIndex = selectedAllocations.findIndex(a => a.bulan === m && a.tahun === targetYear);
    let updated: MonthAllocationItem[];

    if (existsIndex >= 0) {
      // Remove
      updated = selectedAllocations.filter((_, idx) => idx !== existsIndex);
    } else {
      // Add as Lunas by default
      const newItem: MonthAllocationItem = {
        bulan: m,
        tahun: targetYear,
        sisa: bill.sisa,
        tarif: bill.tarif,
        nominal: bill.sisa,
        mode: 'lunas'
      };
      updated = [...selectedAllocations, newItem].sort((a, b) => {
        if (a.tahun !== b.tahun) return a.tahun - b.tahun;
        return a.bulan - b.bulan;
      });
    }

    setSelectedAllocations(updated);
    setIsConfirmed(false);
    setSkipMonthWarningDismissed(false);
  };

  // Change allocation mode for a month (Lunas vs Cicil)
  const handleChangeAllocationMode = (bulan: number, tahun: number, newMode: 'lunas' | 'cicil') => {
    const updated = selectedAllocations.map(item => {
      if (item.bulan === bulan && item.tahun === tahun) {
        if (newMode === 'lunas') {
          return { ...item, mode: 'lunas' as const, nominal: item.sisa };
        } else {
          // If switching to cicil, default nominal to half or remaining if already lower
          const defaultCicil = item.nominal < item.sisa && item.nominal > 0 ? item.nominal : Math.max(10000, Math.round(item.sisa / 2 / 1000) * 1000);
          return { ...item, mode: 'cicil' as const, nominal: defaultCicil };
        }
      }
      return item;
    });

    setSelectedAllocations(updated);
    setIsConfirmed(false);
  };

  // Update custom nominal for an installment
  const handleUpdateAllocationNominal = (bulan: number, tahun: number, nominal: number) => {
    const updated = selectedAllocations.map(item => {
      if (item.bulan === bulan && item.tahun === tahun) {
        return {
          ...item,
          nominal: Math.max(0, nominal)
        };
      }
      return item;
    });

    setSelectedAllocations(updated);
    setIsConfirmed(false);
  };

  // Remove a single allocation
  const handleRemoveAllocation = (bulan: number, tahun: number) => {
    const updated = selectedAllocations.filter(a => !(a.bulan === bulan && a.tahun === tahun));
    setSelectedAllocations(updated);
    setIsConfirmed(false);
  };

  // Toggle additional fee checkbox
  const handleToggleAdditionalFee = (feeId: string) => {
    setSelectedAdditionalFeeIds(prev => 
      prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]
    );
    setIsConfirmed(false);
  };

  // Kilatan dynamic tariff
  const currentKilatanTarif = useMemo(() => {
    if (isRegisterNewKilatan) {
      return settings.kilatanTarif.Kilatan; // 130.000 for new Kilatan student
    }
    if (!selectedSantri) return settings.kilatanTarif.Mukim;
    return settings.kilatanTarif[selectedSantri.kategori] || 70000;
  }, [isRegisterNewKilatan, selectedSantri, settings.kilatanTarif]);

  // Check if current santri already paid Kilatan
  const existingKilatanStatus = useMemo(() => {
    if (isRegisterNewKilatan || !selectedSantri) return { isPaid: false };
    return getKilatanStatus(selectedSantri.id, selectedProgram, kilatanYear);
  }, [isRegisterNewKilatan, selectedSantri, selectedProgram, kilatanYear, getKilatanStatus]);

  if (!isOpen) return null;

  // Handle submit Syahriyah
  const handleSubmitSyahriyah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu', 'error');
      return;
    }

    if (selectedAllocations.length === 0 && selectedAdditionalFees.length === 0) {
      showToast('Pilih minimal satu bulan Syahriyah atau iuran tambahan yang akan dibayar', 'error');
      return;
    }

    if (!isConfirmed) {
      showToast('Beri tanda centang pada kotak konfirmasi sebelum menyimpan pembayaran', 'warning');
      return;
    }

    // Validate allocations
    for (const alloc of selectedAllocations) {
      if (alloc.nominal <= 0) {
        showToast(`Nominal pembayaran untuk bulan ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun} harus lebih dari Rp 0`, 'error');
        return;
      }
      if (alloc.nominal > alloc.sisa) {
        showToast(`Nominal untuk ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun} (Rp ${alloc.nominal.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${alloc.sisa.toLocaleString('id-ID')})`, 'error');
        return;
      }
    }

    if (totalAkumulasi <= 0) {
      showToast('Total akumulasi yang harus dibayar harus lebih besar dari 0', 'error');
      return;
    }

    // Build allocations payload
    const allocations: PaymentAllocation[] = selectedAllocations.map(item => ({
      bulan: item.bulan,
      tahun: item.tahun,
      nominal: item.nominal,
      tarif: item.tarif
    }));

    // Build additional fees payload
    const additionalFees: AdditionalFeePayment[] = selectedAdditionalFees.map(f => ({
      feeId: f.id,
      nama: f.nama,
      nominal: f.nominal
    }));

    const res = addSyahriyahPayment({
      santriId: selectedSantri.id,
      allocations,
      additionalFees,
      nominalTotal: totalAkumulasi,
      metode,
      tanggalTransaksi
    });

    if (res.success) {
      onClose();
    }
  };

  // Handle submit Kilatan
  const handleSubmitKilatan = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegisterNewKilatan) {
      if (!newSantriNama.trim() || !newSantriNis.trim() || !newSantriNamaWali.trim() || !newSantriKontakWali.trim()) {
        showToast('Lengkapi semua field wajib pendaftaran santri baru', 'error');
        return;
      }

      const res = registerAndPayKilatan(
        {
          nama: newSantriNama.trim(),
          nis: newSantriNis.trim(),
          gender: newSantriGender,
          tanggalMasuk: newSantriTglMasuk,
          namaWali: newSantriNamaWali.trim(),
          kontakWali: newSantriKontakWali.trim(),
          alamat: newSantriAlamat.trim()
        },
        {
          program: selectedProgram,
          tahun: kilatanYear,
          nominal: currentKilatanTarif,
          metode,
          tanggalTransaksi
        }
      );

      if (res.success) {
        onClose();
      }
    } else {
      if (!selectedSantri) {
        showToast('Pilih santri terlebih dahulu', 'error');
        return;
      }

      if (existingKilatanStatus.isPaid) {
        showToast(`Santri ini sudah lunas Kilatan ${selectedProgram} ${kilatanYear}`, 'warning');
        return;
      }

      const res = payKilatan({
        santriId: selectedSantri.id,
        program: selectedProgram,
        tahun: kilatanYear,
        nominal: currentKilatanTarif,
        metode,
        tanggalTransaksi
      });

      if (res.success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header with Tab Switcher */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('syahriyah')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'syahriyah'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Syahriyah Bulanan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kilatan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'kilatan'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Iuran Kilatan</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* TAB 1: SYAHRIYAH */}
          {activeTab === 'syahriyah' && (
            <form id="syahriyah-form" onSubmit={handleSubmitSyahriyah} className="space-y-4">
              
              {/* Santri Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Pilih Santri
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari nama santri atau NIS..."
                      value={santriSearch}
                      onChange={(e) => setSantriSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  
                  <select
                    value={selectedSantriId}
                    onChange={(e) => {
                      setSelectedSantriId(e.target.value);
                      setSelectedAllocations([]);
                      setIsConfirmed(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                  >
                    {filteredSantri.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nis}) — Kategori: {s.kategori} {s.status !== 'Aktif' ? `[${s.status}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Santri Info Banner */}
              {selectedSantri && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedSantri.nama}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">NIS: {selectedSantri.nis}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Santri {selectedSantri.kategori}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      Tarif: {formatRupiah(selectedSantri.kategori === 'Mukim' ? settings.syahriyahMukim : settings.syahriyahNduduk)}/bln
                    </span>
                  </div>
                </div>
              )}

              {/* Year & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tahun Tagihan Kalender
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Bisa ganti tahun untuk pilih bulan lain
                    </span>
                  </div>
                  <select
                    value={targetYear}
                    onChange={(e) => {
                      setTargetYear(Number(e.target.value));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  >
                    <option value={currentYear - 2}>{currentYear - 2}</option>
                    <option value={currentYear - 1}>{currentYear - 1}</option>
                    <option value={currentYear}>{currentYear} (Tahun Ini)</option>
                    <option value={currentYear + 1}>{currentYear + 1} (Tahun Depan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={tanggalTransaksi}
                    onChange={(e) => setTanggalTransaksi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Month Selection Grid (Alokasi Syahriyah) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Kalender Bulan Tagihan: {targetYear}</span>
                    {selectedAllocations.filter(a => a.tahun === targetYear).length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        {selectedAllocations.filter(a => a.tahun === targetYear).length} dipilih
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Klik bulan untuk menambah / menghapus
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {monthlyBills.map((b) => {
                    const isSelected = selectedAllocations.some(a => a.bulan === b.bulan && a.tahun === targetYear);
                    const isLunas = b.status === 'lunas';
                    const isBebas = b.status === 'bebas';
                    const isNeutral = b.status === 'belum_masuk' || b.status === 'tidak_aktif';
                    const isDisabled = isLunas || isBebas || isNeutral;

                    let statusBadge = '';
                    if (isLunas) statusBadge = 'Lunas ✓';
                    else if (b.status === 'sebagian') statusBadge = `Sisa ${formatRupiah(b.sisa)}`;
                    else if (isBebas) statusBadge = 'Bebas ★';
                    else if (b.status === 'belum_masuk') statusBadge = 'Belum Masuk -';
                    else if (b.status === 'tidak_aktif') statusBadge = 'Tidak Aktif ○';
                    else statusBadge = formatRupiah(b.sisa);

                    return (
                      <button
                        type="button"
                        key={b.bulan}
                        disabled={isDisabled}
                        onClick={() => handleToggleMonth(b.bulan)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                            : isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20 font-bold scale-[1.02]'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer'
                        }`}
                      >
                        <div className="text-xs font-semibold flex justify-between items-center">
                          <span>{BULAN_SHORT[b.bulan - 1]}</span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[10px] mt-1 font-mono truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {statusBadge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rincian Alokasi Bulan Terpilih (Masing-masing bulan bisa Lunas atau Cicil) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Rincian Bulan Terpilih ({selectedAllocations.length} bulan)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Pilih bayar cicil atau langsung lunas per bulan
                  </span>
                </div>

                {selectedAllocations.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500">
                    Belum ada bulan dipilih. Klik bulan pada kalender di atas (bisa dari tahun berbeda).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAllocations.map((item) => (
                      <div
                        key={`${item.tahun}-${item.bulan}`}
                        className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                      >
                        {/* Header Item: Month & Year + Sisa Tagihan + Remove Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {BULAN_NAMES[item.bulan - 1]} {item.tahun}
                            </span>
                            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                              Sisa Tagihan: {formatRupiah(item.sisa)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAllocation(item.bulan, item.tahun)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Hapus bulan ini dari daftar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode Choice Buttons: Lunas vs Cicil */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleChangeAllocationMode(item.bulan, item.tahun, 'lunas')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              item.mode === 'lunas'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Langsung Lunas ({formatRupiah(item.sisa)})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeAllocationMode(item.bulan, item.tahun, 'cicil')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              item.mode === 'cicil'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Bayar Cicil / Sebagian</span>
                          </button>
                        </div>

                        {/* Cicil Mode Input Section */}
                        {item.mode === 'cicil' && (
                          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                                Nominal Cicilan Bulan Ini:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAllocationNominal(item.bulan, item.tahun, Math.round(item.sisa / 2 / 1000) * 1000)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 cursor-pointer"
                                >
                                  50% ({formatRupiah(Math.round(item.sisa / 2 / 1000) * 1000)})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAllocationNominal(item.bulan, item.tahun, item.sisa)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 cursor-pointer"
                                >
                                  Maks (Lunas)
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">Rp</span>
                              <input
                                type="number"
                                min="1000"
                                max={item.sisa}
                                step="1000"
                                value={item.nominal || ''}
                                onChange={(e) => handleUpdateAllocationNominal(item.bulan, item.tahun, Number(e.target.value))}
                                placeholder="0"
                                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              {item.nominal >= item.sisa ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                  ✓ Nominal sama dengan sisa tagihan, bulan ini lunas penuh.
                                </span>
                              ) : item.nominal > 0 ? (
                                <span className="text-amber-800 dark:text-amber-300">
                                  Sisa tunggakan bulan ini setelah bayar: <strong className="font-mono">{formatRupiah(item.sisa - item.nominal)}</strong> (Status menjadi <strong>Sebagian / !</strong>)
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                  Nominal cicilan harus lebih besar dari Rp 0
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning: Bulan Belum Bayar dilewati */}
              {hasSkippedUnpaidMonth && !skipMonthWarningDismissed && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-semibold">Ada bulan Belum Bayar terdahulu yang dilewati.</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Sistem merekomendasikan menyelesaikan tunggakan bulan terdahulu terlebih dahulu. Lanjutkan jika memang diniatkan untuk bulan tertentu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSkipMonthWarningDismissed(true)}
                    className="text-[11px] font-bold underline hover:text-amber-950 cursor-pointer shrink-0"
                  >
                    Lanjutkan
                  </button>
                </div>
              )}

              {/* Iuran Tambahan (Checkbox pilihan iuran tambahan yang diatur Admin) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Iuran Tambahan ({selectedAdditionalFees.length} terpilih)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Bisa diatur & ditambah oleh Admin di Pengaturan
                  </span>
                </div>

                {availableAdditionalFees.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center text-xs text-slate-400">
                    Tidak ada iuran tambahan aktif untuk kategori santri ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableAdditionalFees.map((fee) => {
                      const isChecked = selectedAdditionalFeeIds.includes(fee.id);
                      return (
                        <label
                          key={fee.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/80 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAdditionalFee(fee.id)}
                            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                {fee.nama}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
                                fee.isWajib
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}>
                                {fee.isWajib ? 'Wajib' : 'Sukarela'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {formatRupiah(fee.nominal)}
                              </span>
                              {fee.keterangan && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={fee.keterangan}>
                                  {fee.keterangan}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total Akumulasi yang Harus Dibayar (Menggantikan input manual) */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-xs space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>Total Akumulasi yang Harus Dibayar</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80 px-2.5 py-0.5 rounded-full">
                    Otomatis Terakumulasi
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex justify-between items-center">
                    <span>• Alokasi Syahriyah ({selectedAllocations.length} bulan):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {formatRupiah(totalAlokasiSyahriyah)}
                    </span>
                  </div>
                  {selectedAdditionalFees.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span>• Iuran Tambahan ({selectedAdditionalFees.length} item):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                        {formatRupiah(totalAdditionalFees)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t-2 border-emerald-400 dark:border-emerald-600">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                    Total Harus Dibayar:
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(totalAkumulasi)}
                  </span>
                </div>
              </div>

              {/* Ceklis Konfirmasi Sebelum Menyimpan Pembayaran */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isConfirmed
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800/90 border-slate-300 dark:border-slate-700'
              } flex items-start gap-3 shadow-2xs`}>
                <input
                  type="checkbox"
                  id="confirm-syahriyah-payment"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <label htmlFor="confirm-syahriyah-payment" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none leading-relaxed">
                  <strong className="text-slate-900 dark:text-white font-bold block mb-0.5 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Konfirmasi Pembayaran *</span>
                  </strong>
                  Saya menyatakan dan mengonfirmasi bahwa rincian alokasi bulan dan iuran tambahan di atas telah diverifikasi dengan benar serta uang sejumlah <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{formatRupiah(totalAkumulasi)}</strong> telah diterima secara sah.
                </label>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'Transfer Bank', 'QRIS/E-Wallet'] as PaymentMethod[]).map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMetode(m)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        metode === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: KILATAN */}
          {activeTab === 'kilatan' && (
            <form id="kilatan-form" onSubmit={handleSubmitKilatan} className="space-y-4">
              
              {/* Kilatan Registration Switcher: Existing vs New Student */}
              <div className="p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl flex text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsRegisterNewKilatan(false)}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    !isRegisterNewKilatan
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Santri Terdaftar
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterNewKilatan(true)}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                    isRegisterNewKilatan
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Santri Kilatan Baru</span>
                </button>
              </div>

              {/* Program Selector in Strict Order: Maulid, Jumadil Ula, Romadhon, Dzulhijjah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Program Kilatan
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value as KilatanProgram)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {KILATAN_PROGRAMS.map(prog => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Tahun Pelaksanaan
                  </label>
                  <input
                    type="number"
                    value={kilatanYear}
                    onChange={(e) => setKilatanYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* CASE A: EXISTING SANTRI */}
              {!isRegisterNewKilatan ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pilih Santri
                  </label>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari santri..."
                      value={santriSearch}
                      onChange={(e) => setSantriSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={selectedSantriId}
                    onChange={(e) => setSelectedSantriId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                  >
                    {filteredSantri.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nis}) — Kategori: {s.kategori}
                      </option>
                    ))}
                  </select>

                  {/* Status alert */}
                  {existingKilatanStatus.isPaid && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                      Santri ini sudah membayar Kilatan {selectedProgram} {kilatanYear}.
                    </div>
                  )}
                </div>
              ) : (
                /* CASE B: NEW KILATAN STUDENT ON-THE-FLY FORM (PRD Section 4.5) */
                <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 pb-1 border-b border-teal-200 dark:border-teal-800">
                    <UserPlus className="w-4 h-4" />
                    <span>Data Santri Kilatan Baru (Wajib Diisi)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap Santri *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Ihsan"
                        value={newSantriNama}
                        onChange={(e) => setNewSantriNama(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        NIS Santri (Unik) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 20269001"
                        value={newSantriNis}
                        onChange={(e) => setNewSantriNis(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Jenis Kelamin *
                      </label>
                      <select
                        value={newSantriGender}
                        onChange={(e) => setNewSantriGender(e.target.value as 'L' | 'P')}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Masuk *
                      </label>
                      <input
                        type="date"
                        required
                        value={newSantriTglMasuk}
                        onChange={(e) => setNewSantriTglMasuk(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Kategori Santri
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Kilatan (Terkunci)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Wali *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama orang tua/wali"
                        value={newSantriNamaWali}
                        onChange={(e) => setNewSantriNamaWali(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Kontak / WhatsApp Wali *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={newSantriKontakWali}
                        onChange={(e) => setNewSantriKontakWali(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Domisili (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Kabupaten/Kota asal"
                      value={newSantriAlamat}
                      onChange={(e) => setNewSantriAlamat(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Tariff Card */}
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                    Tarif Program {selectedProgram} ({kilatanYear})
                  </span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-300">
                    Kategori: {isRegisterNewKilatan ? 'Kilatan' : selectedSantri?.kategori || 'Mukim'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-extrabold text-teal-800 dark:text-teal-200">
                    {formatRupiah(currentKilatanTarif)}
                  </span>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={tanggalTransaksi}
                    onChange={(e) => setTanggalTransaksi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={metode}
                    onChange={(e) => setMetode(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS/E-Wallet">QRIS / E-Wallet</option>
                  </select>
                </div>
              </div>

            </form>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>

          {activeTab === 'syahriyah' ? (
            <button
              type="submit"
              form="syahriyah-form"
              disabled={
                !isConfirmed ||
                totalAkumulasi <= 0 || 
                (selectedAllocations.length === 0 && selectedAdditionalFees.length === 0) || 
                selectedAllocations.some(a => a.nominal <= 0 || a.nominal > a.sisa)
              }
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                isConfirmed &&
                totalAkumulasi > 0 && 
                (selectedAllocations.length > 0 || selectedAdditionalFees.length > 0) && 
                !selectedAllocations.some(a => a.nominal <= 0 || a.nominal > a.sisa)
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Simpan & Terbitkan Kuitansi ({formatRupiah(totalAkumulasi)})</span>
            </button>
          ) : (
            <button
              type="submit"
              form="kilatan-form"
              disabled={!isRegisterNewKilatan && existingKilatanStatus.isPaid}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isRegisterNewKilatan ? 'Daftar & Bayar Kilatan' : 'Bayar Iuran Kilatan'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
