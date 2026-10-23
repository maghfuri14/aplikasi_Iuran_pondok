import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  User, 
  UserRole, 
  Santri, 
  Settings, 
  PaymentTransaction, 
  CashEntry, 
  SyahriyahExemption, 
  SyahriyahStatus,
  KilatanProgram,
  PaymentMethod,
  PaymentAllocation,
  IuranTambahan,
  AdditionalFeePayment
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_SETTINGS, 
  INITIAL_SANTRI, 
  INITIAL_EXEMPTIONS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CASH_ENTRIES 
} from '../data/initialData';
import { generateReceiptNumber, BULAN_NAMES } from '../utils/formatters';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
  switchUser: (role: UserRole) => void;
  users: User[];
  
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  addIuranTambahan: (item: Omit<IuranTambahan, 'id'>) => { success: boolean; item?: IuranTambahan };
  updateIuranTambahan: (id: string, item: Partial<IuranTambahan>) => { success: boolean };
  deleteIuranTambahan: (id: string) => { success: boolean };
  toggleIuranTambahanStatus: (id: string) => { success: boolean };
  
  santriList: Santri[];
  addSantri: (santriData: Omit<Santri, 'id' | 'createdAt'>) => { success: boolean; error?: string; santri?: Santri };
  updateSantri: (id: string, santriData: Partial<Santri>) => { success: boolean; error?: string };
  archiveSantri: (id: string) => { success: boolean; error?: string };
  restoreSantri: (id: string) => { success: boolean; error?: string };
  exitSantri: (id: string, tanggalKeluar: string, perlakuan: 'penuh' | 'separuh' | 'bebas') => { success: boolean; error?: string };
  reactivateSantri: (id: string, tanggalAktifKembali: string) => { success: boolean; error?: string };
  importSantriCSV: (rows: any[]) => { success: boolean; count: number; errors: string[] };

  exemptions: SyahriyahExemption[];
  addExemption: (santriId: string, bulan: number, tahun: number, alasan: string) => { success: boolean; error?: string };
  revokeExemption: (id: string) => { success: boolean; error?: string };

  transactions: PaymentTransaction[];
  addSyahriyahPayment: (data: {
    santriId: string;
    allocations: PaymentAllocation[];
    additionalFees?: AdditionalFeePayment[];
    nominalTotal: number;
    metode: PaymentMethod;
    tanggalTransaksi: string;
    buktiPembayaran?: string;
  }) => { success: boolean; error?: string; receipt?: PaymentTransaction };
  
  payKilatan: (data: {
    santriId: string;
    program: KilatanProgram;
    tahun: number;
    nominal: number;
    metode: PaymentMethod;
    tanggalTransaksi: string;
    buktiPembayaran?: string;
  }) => { success: boolean; error?: string; receipt?: PaymentTransaction };

  registerAndPayKilatan: (santriData: {
    nama: string;
    nis: string;
    gender: 'L' | 'P';
    tanggalMasuk: string;
    namaWali: string;
    kontakWali: string;
    tanggalLahir?: string;
    alamat?: string;
  }, paymentData: {
    program: KilatanProgram;
    tahun: number;
    nominal: number;
    metode: PaymentMethod;
    tanggalTransaksi: string;
    buktiPembayaran?: string;
  }) => { success: boolean; error?: string; receipt?: PaymentTransaction };

  cancelPayment: (paymentId: string, alasan: string) => { success: boolean; error?: string };
  reprintReceipt: (receiptId: string) => { success: boolean; error?: string };

  cashEntries: CashEntry[];
  addManualCashEntry: (data: {
    tipe: 'masuk' | 'keluar';
    kategori: string;
    nominal: number;
    keterangan: string;
    tanggal: string;
  }) => { success: boolean; error?: string };
  approveCashKeluar: (entryId: string) => { success: boolean; error?: string };
  rejectCashKeluar: (entryId: string, alasan: string) => { success: boolean; error?: string };
  cancelPendingCashKeluar: (entryId: string, alasan?: string) => { success: boolean; error?: string };
  cancelApprovedCashKeluar: (entryId: string, alasan: string) => { success: boolean; error?: string };
  updateSaldoAwal: (nominal: number) => { success: boolean; error?: string };

  // Helper status checkers
  getSyahriyahStatus: (santriId: string, bulan: number, tahun: number) => { 
    status: SyahriyahStatus; 
    paid: number; 
    tarif: number;
    exemption?: SyahriyahExemption;
  };
  getKilatanStatus: (santriId: string, program: KilatanProgram, tahun: number) => {
    isPaid: boolean;
    tarif: number;
    transaction?: PaymentTransaction;
  };
  calculateSantriTunggakan: (santriId: string, tahun?: number) => {
    totalTunggakan: number;
    bulanTunggakan: Array<{ bulan: number; tahun: number; sisa: number }>;
  };

  // Cash calculations
  cashSummary: {
    saldoAwal: number;
    totalMasuk: number;
    totalKeluar: number;
    danaTersisa: number;
    pendingKeluarCount: number;
    pendingKeluarNominal: number;
  };

  // UI state
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Global modals
  activeReceipt: PaymentTransaction | null;
  setActiveReceipt: (receipt: PaymentTransaction | null) => void;
  isQuickPaymentOpen: boolean;
  setIsQuickPaymentOpen: (open: boolean) => void;
  quickPaymentSantriId?: string;
  setQuickPaymentSantriId: (id?: string) => void;
  selectedSantriDetail: Santri | null;
  setSelectedSantriDetail: (santri: Santri | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_PREFIX = 'simkas_alhidayah_v9_6_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current user
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_USERS[0]; // Admin by default
  });

  const switchUser = (role: UserRole) => {
    const found = users.find(u => u.role === role) || users[0];
    setCurrentUser(found);
    localStorage.setItem(`${STORAGE_PREFIX}user`, JSON.stringify(found));
    showToast(`Beralih ke mode ${found.name} (${found.role.toUpperCase()})`, 'info');
  };

  // 2. Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        const merged = { ...INITIAL_SETTINGS, ...parsed };
        if (!merged.iuranTambahanList || !Array.isArray(merged.iuranTambahanList)) {
          merged.iuranTambahanList = INITIAL_SETTINGS.iuranTambahanList;
        }
        return merged;
      } catch {}
    }
    return INITIAL_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
      return updated;
    });
    showToast('Pengaturan berhasil diperbarui', 'success');
  };

  const addIuranTambahan = (item: Omit<IuranTambahan, 'id'>) => {
    if (currentUser.role !== 'admin') {
      showToast('Gagal: Hanya Admin yang dapat menambah iuran tambahan', 'error');
      return { success: false };
    }
    const newItem: IuranTambahan = {
      ...item,
      id: 'fee_' + Date.now()
    };
    const currentList = settings.iuranTambahanList || [];
    const updatedList = [...currentList, newItem];
    updateSettings({ iuranTambahanList: updatedList });
    showToast(`Iuran "${newItem.nama}" berhasil ditambahkan`, 'success');
    return { success: true, item: newItem };
  };

  const updateIuranTambahan = (id: string, item: Partial<IuranTambahan>) => {
    if (currentUser.role !== 'admin') {
      showToast('Gagal: Hanya Admin yang dapat mengedit iuran tambahan', 'error');
      return { success: false };
    }
    const currentList = settings.iuranTambahanList || [];
    const updatedList = currentList.map(f => f.id === id ? { ...f, ...item } : f);
    updateSettings({ iuranTambahanList: updatedList });
    showToast('Iuran tambahan berhasil diperbarui', 'success');
    return { success: true };
  };

  const deleteIuranTambahan = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Gagal: Hanya Admin yang dapat menghapus iuran tambahan', 'error');
      return { success: false };
    }
    const currentList = settings.iuranTambahanList || [];
    const updatedList = currentList.filter(f => f.id !== id);
    updateSettings({ iuranTambahanList: updatedList });
    showToast('Iuran tambahan berhasil dihapus', 'success');
    return { success: true };
  };

  const toggleIuranTambahanStatus = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Gagal: Hanya Admin yang dapat mengubah status iuran tambahan', 'error');
      return { success: false };
    }
    const currentList = settings.iuranTambahanList || [];
    const updatedList = currentList.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
    updateSettings({ iuranTambahanList: updatedList });
    showToast('Status iuran tambahan berhasil diubah', 'success');
    return { success: true };
  };

  // 3. Santri
  const [santriList, setSantriList] = useState<Santri[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}santri`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_SANTRI;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}santri`, JSON.stringify(santriList));
  }, [santriList]);

  // 4. Exemptions
  const [exemptions, setExemptions] = useState<SyahriyahExemption[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}exemptions`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_EXEMPTIONS;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}exemptions`, JSON.stringify(exemptions));
  }, [exemptions]);

  // 5. Transactions
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}transactions`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  // 6. Cash Entries
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}cash`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_CASH_ENTRIES;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}cash`, JSON.stringify(cashEntries));
  }, [cashEntries]);

  // 7. Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}dark`) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}dark`, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 8. Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Modals state
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [quickPaymentSantriId, setQuickPaymentSantriId] = useState<string | undefined>();
  const [selectedSantriDetail, setSelectedSantriDetail] = useState<Santri | null>(null);

  // Santri operations
  const addSantri = (data: Omit<Santri, 'id' | 'createdAt'>) => {
    // Check duplicate NIS
    const dup = santriList.find(s => s.nis.trim() === data.nis.trim());
    if (dup) {
      const err = `Gagal: NIS [${data.nis}] sudah terdaftar atas nama [${dup.nama}].`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const newSantri: Santri = {
      ...data,
      id: 's_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setSantriList(prev => [newSantri, ...prev]);
    showToast(`Santri ${newSantri.nama} berhasil ditambahkan`, 'success');
    return { success: true, santri: newSantri };
  };

  const updateSantri = (id: string, data: Partial<Santri>) => {
    // RBAC: Bendahara cannot edit santri once registered
    if (currentUser.role === 'bendahara') {
      const err = 'Gagal: Bendahara tidak memiliki hak akses untuk mengedit data santri terdaftar.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Check duplicate NIS if changed
    if (data.nis) {
      const dup = santriList.find(s => s.nis.trim() === data.nis!.trim() && s.id !== id);
      if (dup) {
        const err = `Gagal: NIS [${data.nis}] sudah terdaftar atas nama [${dup.nama}].`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
    }

    setSantriList(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    showToast('Data santri berhasil diperbarui', 'success');
    return { success: true };
  };

  const archiveSantri = (id: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat mengarsipkan santri.';
      showToast(err, 'error');
      return { success: false, error: err };
    }
    setSantriList(prev => prev.map(s => s.id === id ? { ...s, status: 'Arsip' } : s));
    showToast('Santri berhasil diarsipkan', 'success');
    return { success: true };
  };

  const restoreSantri = (id: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat memulihkan santri.';
      showToast(err, 'error');
      return { success: false, error: err };
    }
    setSantriList(prev => prev.map(s => s.id === id ? { ...s, status: 'Aktif' } : s));
    showToast('Santri berhasil dipulihkan ke status Aktif', 'success');
    return { success: true };
  };

  const exitSantri = (id: string, tanggalKeluar: string, perlakuan: 'penuh' | 'separuh' | 'bebas') => {
    if (currentUser.role === 'bendahara') {
      const err = 'Gagal: Bendahara tidak memiliki hak akses mencatat tanggal keluar santri.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setSantriList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'Tidak Aktif',
          tanggalKeluar,
          perlakuanBulanKeluar: perlakuan
        };
      }
      return s;
    }));
    showToast('Tanggal keluar santri berhasil dicatat', 'success');
    return { success: true };
  };

  const reactivateSantri = (id: string, tanggalAktifKembali: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat mengisi atau mengubah tanggal aktif kembali santri.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setSantriList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'Aktif',
          tanggalAktifKembali
        };
      }
      return s;
    }));
    showToast('Santri berhasil diaktifkan kembali. Syahriyah mulai ditagih bulan berikutnya.', 'success');
    return { success: true };
  };

  const importSantriCSV = (rows: any[]) => {
    const existingNis = new Set(santriList.map(s => s.nis.trim().toLowerCase()));
    const validRows: Santri[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const nis = String(row.nis || row.NIS || '').trim();
      const nama = String(row.nama || row.Nama || '').trim();
      const gender = (String(row.gender || row.JenisKelamin || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P';
      const kategoriRaw = String(row.kategori || row.Kategori || 'Mukim').trim();
      const kategori: any = ['Mukim', 'Nduduk', 'Kilatan'].includes(kategoriRaw) ? kategoriRaw : 'Mukim';
      const tanggalMasuk = String(row.tanggalMasuk || row.TanggalMasuk || '2026-01-01').trim();
      const namaWali = String(row.namaWali || row.Wali || 'Wali Santri').trim();
      const kontakWali = String(row.kontakWali || row.KontakWali || '081234567890').trim();

      if (!nis || !nama) {
        errors.push(`Baris ${rowNum}: NIS dan Nama wajib diisi.`);
        return;
      }
      if (existingNis.has(nis.toLowerCase())) {
        errors.push(`Baris ${rowNum}: Gagal: NIS [${nis}] sudah terdaftar.`);
        return;
      }

      existingNis.add(nis.toLowerCase());
      validRows.push({
        id: 's_imp_' + Date.now() + '_' + idx,
        nis,
        nama,
        gender,
        kategori,
        status: 'Aktif',
        tanggalMasuk,
        namaWali,
        kontakWali,
        alamat: String(row.alamat || '').trim(),
        createdAt: new Date().toISOString()
      });
    });

    if (validRows.length > 0) {
      setSantriList(prev => [...validRows, ...prev]);
    }

    return {
      success: validRows.length > 0,
      count: validRows.length,
      errors
    };
  };

  // Status Syahriyah Evaluator
  const getSyahriyahStatus = (santriId: string, bulan: number, tahun: number) => {
    const santri = santriList.find(s => s.id === santriId);
    if (!santri) {
      return { status: 'belum_bayar' as SyahriyahStatus, paid: 0, tarif: 50000 };
    }

    const tarif = santri.kategori === 'Mukim' ? settings.syahriyahMukim : settings.syahriyahNduduk;

    // 1. Cek sebelum tanggal masuk
    if (santri.tanggalMasuk) {
      const masukParts = santri.tanggalMasuk.split('-');
      const masukYear = parseInt(masukParts[0], 10);
      const masukMonth = parseInt(masukParts[1], 10);
      if (tahun < masukYear || (tahun === masukYear && bulan < masukMonth)) {
        return { status: 'belum_masuk' as SyahriyahStatus, paid: 0, tarif };
      }
    }

    // 2. Cek santri keluar / tidak aktif
    if (santri.tanggalKeluar) {
      const keluarParts = santri.tanggalKeluar.split('-');
      const keluarYear = parseInt(keluarParts[0], 10);
      const keluarMonth = parseInt(keluarParts[1], 10);

      // Cek apakah ada tanggal aktif kembali
      let isReactivated = false;
      if (santri.tanggalAktifKembali) {
        const aktifParts = santri.tanggalAktifKembali.split('-');
        const aktifYear = parseInt(aktifParts[0], 10);
        const aktifMonth = parseInt(aktifParts[1], 10);
        // Tagihan mulai bulan berikutnya setelah aktif kembali
        if (tahun > aktifYear || (tahun === aktifYear && bulan > aktifMonth)) {
          isReactivated = true;
        }
      }

      if (!isReactivated) {
        if (tahun > keluarYear || (tahun === keluarYear && bulan > keluarMonth)) {
          return { status: 'tidak_aktif' as SyahriyahStatus, paid: 0, tarif };
        }
        // Perlakuan bulan keluar jika persis sama
        if (tahun === keluarYear && bulan === keluarMonth) {
          if (santri.perlakuanBulanKeluar === 'bebas') {
            return { status: 'bebas' as SyahriyahStatus, paid: 0, tarif };
          }
        }
      }
    }

    // 3. Cek Pembebasan (Exemption)
    const ex = exemptions.find(e => e.santriId === santriId && e.bulan === bulan && e.tahun === tahun);
    if (ex) {
      return { status: 'bebas' as SyahriyahStatus, paid: 0, tarif, exemption: ex };
    }

    // 4. Hitung transaksi aktif
    let totalPaid = 0;
    transactions.forEach(tx => {
      if (tx.status === 'Aktif' && tx.santriId === santriId && tx.jenisIuran === 'Syahriyah') {
        tx.allocations.forEach(alloc => {
          if (alloc.bulan === bulan && alloc.tahun === tahun) {
            totalPaid += alloc.nominal;
          }
        });
      }
    });

    if (totalPaid >= tarif) {
      return { status: 'lunas' as SyahriyahStatus, paid: totalPaid, tarif };
    } else if (totalPaid > 0) {
      return { status: 'sebagian' as SyahriyahStatus, paid: totalPaid, tarif };
    } else {
      return { status: 'belum_bayar' as SyahriyahStatus, paid: 0, tarif };
    }
  };

  const getKilatanStatus = (santriId: string, program: KilatanProgram, tahun: number) => {
    const santri = santriList.find(s => s.id === santriId);
    const category = santri?.kategori || 'Mukim';
    const tarif = settings.kilatanTarif[category] || 70000;

    const tx = transactions.find(t => 
      t.status === 'Aktif' && 
      t.santriId === santriId && 
      t.jenisIuran === 'Kilatan' && 
      t.kilatanProgram === program && 
      t.periodeTahun === tahun
    );

    return {
      isPaid: !!tx,
      tarif,
      transaction: tx
    };
  };

  const calculateSantriTunggakan = (santriId: string, targetYear = new Date().getFullYear()) => {
    const santri = santriList.find(s => s.id === santriId);
    if (!santri || santri.kategori === 'Kilatan') {
      return { totalTunggakan: 0, bulanTunggakan: [] };
    }

    const currentMonth = new Date().getMonth() + 1;
    const bulanTunggakan: Array<{ bulan: number; tahun: number; sisa: number }> = [];
    let total = 0;

    // Check up to current month for the current year
    const maxBulan = targetYear === new Date().getFullYear() ? currentMonth : 12;

    for (let b = 1; b <= maxBulan; b++) {
      const check = getSyahriyahStatus(santriId, b, targetYear);
      if (check.status === 'belum_bayar' || check.status === 'sebagian') {
        const sisa = check.tarif - check.paid;
        total += sisa;
        bulanTunggakan.push({ bulan: b, tahun: targetYear, sisa });
      }
    }

    return { totalTunggakan: total, bulanTunggakan };
  };

  // Add Exemption
  const addExemption = (santriId: string, bulan: number, tahun: number, alasan: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat mengelola pembebasan Syahriyah.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if (!alasan || alasan.trim().length < 10) {
      const err = 'Gagal: Alasan pembebasan minimal 10 karakter.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Tidak boleh berlaku surut (minimal bulan berjalan)
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    if (tahun < curYear || (tahun === curYear && bulan < curMonth)) {
      const err = 'Gagal: Pembebasan tidak boleh berlaku surut (minimal bulan berjalan).';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Cek apakah sudah ada pembayaran aktif
    const check = getSyahriyahStatus(santriId, bulan, tahun);
    if (check.paid > 0) {
      const err = `Gagal: Bulan ${BULAN_NAMES[bulan - 1]} ${tahun} sudah memiliki pembayaran aktif.`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const newEx: SyahriyahExemption = {
      id: 'ex_' + Date.now(),
      santriId,
      bulan,
      tahun,
      alasan: alasan.trim(),
      createdBy: currentUser.username,
      createdAt: new Date().toISOString()
    };

    setExemptions(prev => [...prev, newEx]);
    showToast(`Pembebasan Syahriyah untuk bulan ${BULAN_NAMES[bulan - 1]} ${tahun} berhasil dibuat`, 'success');
    return { success: true };
  };

  const revokeExemption = (id: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat mencabut pembebasan Syahriyah.';
      showToast(err, 'error');
      return { success: false, error: err };
    }
    setExemptions(prev => prev.filter(e => e.id !== id));
    showToast('Pembebasan Syahriyah berhasil dicabut', 'success');
    return { success: true };
  };

  // Syahriyah Payment
  const addSyahriyahPayment = (data: {
    santriId: string;
    allocations: PaymentAllocation[];
    additionalFees?: AdditionalFeePayment[];
    nominalTotal: number;
    metode: PaymentMethod;
    tanggalTransaksi: string;
    buktiPembayaran?: string;
  }) => {
    // 1. RBAC check: Bendahara & Admin
    if (currentUser.role !== 'admin' && currentUser.role !== 'bendahara') {
      const err = 'Gagal: Anda tidak memiliki akses untuk mencatat pembayaran.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 2. Check future date
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.tanggalTransaksi > todayStr) {
      const err = 'Gagal: Tanggal pembayaran tidak boleh lebih besar dari hari ini.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 3. Validation: Total allocation + additional fees must match nominal received
    const totalAlloc = data.allocations.reduce((acc, curr) => acc + curr.nominal, 0);
    const totalAdditional = (data.additionalFees || []).reduce((acc, curr) => acc + curr.nominal, 0);
    const expectedTotal = totalAlloc + totalAdditional;

    if (expectedTotal !== data.nominalTotal) {
      const err = `Gagal: Total akumulasi (${expectedTotal}) harus sama dengan nominal diterima (${data.nominalTotal}).`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 4. Validate per month allocation
    const santri = santriList.find(s => s.id === data.santriId);
    if (!santri) {
      const err = 'Gagal: Santri tidak ditemukan.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    for (const alloc of data.allocations) {
      const check = getSyahriyahStatus(data.santriId, alloc.bulan, alloc.tahun);
      if (check.status === 'belum_masuk') {
        const err = `Gagal: Bulan ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun} belum masuk periode tagihan santri.`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
      if (check.status === 'tidak_aktif') {
        const err = `Gagal: Santri tidak aktif pada bulan ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun}.`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
      if (check.status === 'bebas') {
        const err = `Gagal: Bulan ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun} telah dibebaskan dari Syahriyah.`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
      const sisaTagihan = check.tarif - check.paid;
      if (alloc.nominal > sisaTagihan) {
        const err = `Gagal: Alokasi untuk ${BULAN_NAMES[alloc.bulan - 1]} ${alloc.tahun} melebihi sisa tagihan (Rp ${sisaTagihan.toLocaleString('id-ID')}).`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
    }

    // Generate receipt number
    const seq = transactions.length + 1;
    const txDate = new Date(data.tanggalTransaksi);
    const nomorKuitansi = generateReceiptNumber(seq, txDate);
    const txId = 'tx_' + Date.now();

    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      santriKategori: santri.kategori,
      jenisIuran: 'Syahriyah',
      periodeTahun: txDate.getFullYear(),
      nominalTotal: data.nominalTotal,
      metode: data.metode,
      buktiPembayaran: data.buktiPembayaran,
      allocations: data.allocations,
      additionalFees: data.additionalFees || [],
      tanggalTransaksi: data.tanggalTransaksi,
      createdAt: new Date().toISOString(),
      petugasUsername: currentUser.username,
      status: 'Aktif',
      printCount: 0,
    };

    // Auto-create CashEntry
    const allocDesc = data.allocations
      .map(a => `${BULAN_NAMES[a.bulan - 1].substring(0, 3)} ${a.tahun}`)
      .join(', ');
    const addFeeDesc = (data.additionalFees && data.additionalFees.length > 0)
      ? ` + ${data.additionalFees.length} Iuran Tambahan`
      : '';
    const newCash: CashEntry = {
      id: 'c_' + Date.now(),
      tanggal: data.tanggalTransaksi,
      tipe: 'masuk',
      kategori: 'Syahriyah Santri',
      nominal: data.nominalTotal,
      keterangan: `Syahriyah ${santri.nama} (${allocDesc || '-'}${addFeeDesc}) [${nomorKuitansi}]`,
      status: 'Disetujui',
      sumber: 'Sistem Iuran',
      paymentId: txId,
      dibuatOleh: currentUser.username,
      dibuatAt: new Date().toISOString(),
      disetujuiOleh: 'sistem',
      disetujuiAt: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
    setCashEntries(prev => [newCash, ...prev]);
    setActiveReceipt(newTx);
    showToast(`Pembayaran Syahriyah berhasil dicatat. No. Kuitansi: ${nomorKuitansi}`, 'success');
    return { success: true, receipt: newTx };
  };

  // Kilatan Payment
  const payKilatan = (data: {
    santriId: string;
    program: KilatanProgram;
    tahun: number;
    nominal: number;
    metode: PaymentMethod;
    tanggalTransaksi: string;
    buktiPembayaran?: string;
  }) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'bendahara') {
      const err = 'Gagal: Anda tidak memiliki akses untuk mencatat pembayaran.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (data.tanggalTransaksi > todayStr) {
      const err = 'Gagal: Tanggal pembayaran tidak boleh lebih besar dari hari ini.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const santri = santriList.find(s => s.id === data.santriId);
    if (!santri) {
      const err = 'Gagal: Santri tidak ditemukan.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Check if already paid
    const check = getKilatanStatus(santri.id, data.program, data.tahun);
    if (check.isPaid) {
      const err = `Gagal: Santri ini sudah membayar Kilatan ${data.program} ${data.tahun}.`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const seq = transactions.length + 1;
    const txDate = new Date(data.tanggalTransaksi);
    const nomorKuitansi = generateReceiptNumber(seq, txDate);
    const txId = 'tx_' + Date.now();

    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      santriKategori: santri.kategori,
      jenisIuran: 'Kilatan',
      kilatanProgram: data.program,
      periodeTahun: data.tahun,
      nominalTotal: data.nominal,
      metode: data.metode,
      buktiPembayaran: data.buktiPembayaran,
      allocations: [],
      tanggalTransaksi: data.tanggalTransaksi,
      createdAt: new Date().toISOString(),
      petugasUsername: currentUser.username,
      status: 'Aktif',
      printCount: 0,
    };

    const newCash: CashEntry = {
      id: 'c_' + Date.now(),
      tanggal: data.tanggalTransaksi,
      tipe: 'masuk',
      kategori: 'Iuran Kilatan',
      nominal: data.nominal,
      keterangan: `Kilatan ${data.program} ${santri.nama} (${data.tahun}) [${nomorKuitansi}]`,
      status: 'Disetujui',
      sumber: 'Sistem Iuran',
      paymentId: txId,
      dibuatOleh: currentUser.username,
      dibuatAt: new Date().toISOString(),
      disetujuiOleh: 'sistem',
      disetujuiAt: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
    setCashEntries(prev => [newCash, ...prev]);
    setActiveReceipt(newTx);
    showToast(`Pembayaran Kilatan ${data.program} berhasil dicatat. No. Kuitansi: ${nomorKuitansi}`, 'success');
    return { success: true, receipt: newTx };
  };

  // Register New Kilatan Student and Pay
  const registerAndPayKilatan = (
    santriData: {
      nama: string;
      nis: string;
      gender: 'L' | 'P';
      tanggalMasuk: string;
      namaWali: string;
      kontakWali: string;
      tanggalLahir?: string;
      alamat?: string;
    },
    paymentData: {
      program: KilatanProgram;
      tahun: number;
      nominal: number;
      metode: PaymentMethod;
      tanggalTransaksi: string;
      buktiPembayaran?: string;
    }
  ) => {
    // Check duplicate NIS
    const dup = santriList.find(s => s.nis.trim() === santriData.nis.trim());
    if (dup) {
      const err = `Gagal: NIS [${santriData.nis}] sudah terdaftar atas nama [${dup.nama}].`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (paymentData.tanggalTransaksi > todayStr) {
      const err = 'Gagal: Tanggal pembayaran tidak boleh lebih besar dari hari ini.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const santriId = 's_' + Date.now();
    const newSantri: Santri = {
      id: santriId,
      nis: santriData.nis.trim(),
      nama: santriData.nama.trim(),
      gender: santriData.gender,
      kategori: 'Kilatan',
      status: 'Aktif',
      tanggalMasuk: santriData.tanggalMasuk,
      namaWali: santriData.namaWali.trim(),
      kontakWali: santriData.kontakWali.trim(),
      tanggalLahir: santriData.tanggalLahir,
      alamat: santriData.alamat,
      createdAt: new Date().toISOString()
    };

    const seq = transactions.length + 1;
    const txDate = new Date(paymentData.tanggalTransaksi);
    const nomorKuitansi = generateReceiptNumber(seq, txDate);
    const txId = 'tx_' + Date.now();

    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi,
      santriId: newSantri.id,
      santriNama: newSantri.nama,
      santriNis: newSantri.nis,
      santriKategori: 'Kilatan',
      jenisIuran: 'Kilatan',
      kilatanProgram: paymentData.program,
      periodeTahun: paymentData.tahun,
      nominalTotal: paymentData.nominal,
      metode: paymentData.metode,
      buktiPembayaran: paymentData.buktiPembayaran,
      allocations: [],
      tanggalTransaksi: paymentData.tanggalTransaksi,
      createdAt: new Date().toISOString(),
      petugasUsername: currentUser.username,
      status: 'Aktif',
      printCount: 0,
    };

    const newCash: CashEntry = {
      id: 'c_' + Date.now(),
      tanggal: paymentData.tanggalTransaksi,
      tipe: 'masuk',
      kategori: 'Iuran Kilatan',
      nominal: paymentData.nominal,
      keterangan: `Pendaftaran + Kilatan ${paymentData.program} ${newSantri.nama} [${nomorKuitansi}]`,
      status: 'Disetujui',
      sumber: 'Sistem Iuran',
      paymentId: txId,
      dibuatOleh: currentUser.username,
      dibuatAt: new Date().toISOString(),
      disetujuiOleh: 'sistem',
      disetujuiAt: new Date().toISOString()
    };

    setSantriList(prev => [newSantri, ...prev]);
    setTransactions(prev => [newTx, ...prev]);
    setCashEntries(prev => [newCash, ...prev]);
    setActiveReceipt(newTx);
    showToast(`Santri Kilatan baru ${newSantri.nama} berhasil didaftarkan dan pembayaran tercatat.`, 'success');
    return { success: true, receipt: newTx };
  };

  // Cancel Payment (Admin Only, min 10 chars)
  const cancelPayment = (paymentId: string, alasan: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat membatalkan pembayaran.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if (!alasan || alasan.trim().length < 10) {
      const err = 'Gagal: Alasan pembatalan minimal 10 karakter.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const targetTx = transactions.find(t => t.id === paymentId);
    if (!targetTx) {
      const err = 'Gagal: Transaksi tidak ditemukan.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Immutable cancellation
    setTransactions(prev => prev.map(t => {
      if (t.id === paymentId) {
        return {
          ...t,
          status: 'Batal',
          alasanBatal: alasan.trim(),
          batalBy: currentUser.username,
          batalAt: new Date().toISOString()
        };
      }
      return t;
    }));

    // Linked CashEntry status becomes Dibatalkan
    setCashEntries(prev => prev.map(c => {
      if (c.paymentId === paymentId) {
        return {
          ...c,
          status: 'Dibatalkan',
          alasanBatal: alasan.trim(),
          batalOleh: currentUser.username,
          batalAt: new Date().toISOString()
        };
      }
      return c;
    }));

    showToast(`Transaksi ${targetTx.nomorKuitansi} berhasil dibatalkan.`, 'success');
    return { success: true };
  };

  const reprintReceipt = (receiptId: string) => {
    const target = transactions.find(t => t.id === receiptId);
    if (!target) return { success: false, error: 'Kuitansi tidak ditemukan' };
    if (target.status === 'Batal') {
      const err = 'Gagal: Kuitansi batal tidak dapat dicetak ulang.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setTransactions(prev => prev.map(t => {
      if (t.id === receiptId) {
        return {
          ...t,
          printCount: (t.printCount || 0) + 1,
          lastPrintAt: new Date().toISOString()
        };
      }
      return t;
    }));

    showToast(`Mencetak ulang kuitansi ${target.nomorKuitansi} (Cetak Ulang #${(target.printCount || 0) + 1})`, 'info');
    return { success: true };
  };

  // Cash Operations & Maker-Checker
  const addManualCashEntry = (data: {
    tipe: 'masuk' | 'keluar';
    kategori: string;
    nominal: number;
    keterangan: string;
    tanggal: string;
  }) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'bendahara') {
      const err = 'Gagal: Anda tidak memiliki akses untuk mencatat kas.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if (data.nominal <= 0) {
      const err = 'Gagal: Nominal harus lebih besar dari 0.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    let initialStatus: any = 'Disetujui';

    // Maker-checker rule for Kas Keluar
    if (data.tipe === 'keluar') {
      if (data.nominal >= settings.approvalThreshold) {
        initialStatus = 'Menunggu Persetujuan';
      } else {
        initialStatus = 'Disetujui';
      }
    }

    const newEntry: CashEntry = {
      id: 'c_' + Date.now(),
      tanggal: data.tanggal,
      tipe: data.tipe,
      kategori: data.kategori,
      nominal: data.nominal,
      keterangan: data.keterangan.trim(),
      status: initialStatus,
      sumber: 'Manual',
      dibuatOleh: currentUser.username,
      dibuatAt: new Date().toISOString(),
      disetujuiOleh: initialStatus === 'Disetujui' ? (currentUser.role === 'admin' ? currentUser.username : 'sistem') : undefined,
      disetujuiAt: initialStatus === 'Disetujui' ? new Date().toISOString() : undefined
    };

    setCashEntries(prev => [newEntry, ...prev]);

    if (initialStatus === 'Menunggu Persetujuan') {
      showToast(`Pengajuan Kas Keluar Rp ${data.nominal.toLocaleString('id-ID')} dicatat (Menunggu Persetujuan Admin karena ≥ Rp ${settings.approvalThreshold.toLocaleString('id-ID')})`, 'warning');
    } else {
      showToast(`Kas ${data.tipe === 'masuk' ? 'Masuk' : 'Keluar'} Rp ${data.nominal.toLocaleString('id-ID')} berhasil dicatat`, 'success');
    }

    return { success: true };
  };

  const approveCashKeluar = (entryId: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat menyetujui pengajuan Kas Keluar.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setCashEntries(prev => prev.map(c => {
      if (c.id === entryId) {
        return {
          ...c,
          status: 'Disetujui',
          disetujuiOleh: currentUser.username,
          disetujuiAt: new Date().toISOString()
        };
      }
      return c;
    }));

    showToast('Pengajuan Kas Keluar telah disetujui. Saldo kas diperbarui.', 'success');
    return { success: true };
  };

  const rejectCashKeluar = (entryId: string, alasan: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat menolak pengajuan Kas Keluar.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if (!alasan || alasan.trim().length === 0) {
      const err = 'Gagal: Keterangan penolakan wajib diisi.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setCashEntries(prev => prev.map(c => {
      if (c.id === entryId) {
        return {
          ...c,
          status: 'Ditolak',
          alasanTolak: alasan.trim()
        };
      }
      return c;
    }));

    showToast('Pengajuan Kas Keluar telah ditolak.', 'info');
    return { success: true };
  };

  const cancelPendingCashKeluar = (entryId: string, alasan?: string) => {
    const target = cashEntries.find(c => c.id === entryId);
    if (!target) return { success: false, error: 'Data kas tidak ditemukan' };

    // Bendahara can cancel their own, Admin can cancel any
    if (currentUser.role !== 'admin' && target.dibuatOleh !== currentUser.username) {
      const err = 'Gagal: Anda hanya dapat membatalkan pengajuan Kas Keluar milik Anda sendiri.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setCashEntries(prev => prev.map(c => {
      if (c.id === entryId) {
        return {
          ...c,
          status: 'Dibatalkan',
          alasanBatal: alasan || 'Dibatalkan oleh pembuat pengajuan',
          batalOleh: currentUser.username,
          batalAt: new Date().toISOString()
        };
      }
      return c;
    }));

    showToast('Pengajuan Kas Keluar berhasil dibatalkan.', 'info');
    return { success: true };
  };

  const cancelApprovedCashKeluar = (entryId: string, alasan: string) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat membatalkan Kas Keluar yang telah disetujui.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if (!alasan || alasan.trim().length < 10) {
      const err = 'Gagal: Alasan pembatalan minimal 10 karakter.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setCashEntries(prev => prev.map(c => {
      if (c.id === entryId) {
        return {
          ...c,
          status: 'Dibatalkan',
          alasanBatal: alasan.trim(),
          batalOleh: currentUser.username,
          batalAt: new Date().toISOString()
        };
      }
      return c;
    }));

    showToast('Kas Keluar yang disetujui berhasil dibatalkan. Saldo kas diperbarui.', 'success');
    return { success: true };
  };

  const updateSaldoAwal = (nominal: number) => {
    if (currentUser.role !== 'admin') {
      const err = 'Gagal: Hanya Admin yang dapat mengatur saldo awal kas.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // Check if there are active transactions
    if (transactions.length > 0 || cashEntries.length > 0) {
      const err = 'Gagal: Saldo awal hanya dapat diinput sebelum adanya transaksi pertama.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    setSettings(prev => ({ ...prev, saldoAwal: nominal }));
    showToast(`Saldo awal kas berhasil diatur menjadi Rp ${nominal.toLocaleString('id-ID')}`, 'success');
    return { success: true };
  };

  // Cash Summary Calculation:
  // Rumus PRD: Dana tersisa = saldo awal + total Kas Masuk aktif - total Kas Keluar Disetujui
  const cashSummary = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let pendingKeluarCount = 0;
    let pendingKeluarNominal = 0;

    cashEntries.forEach(entry => {
      if (entry.tipe === 'masuk' && entry.status === 'Disetujui') {
        totalMasuk += entry.nominal;
      } else if (entry.tipe === 'keluar') {
        if (entry.status === 'Disetujui') {
          totalKeluar += entry.nominal;
        } else if (entry.status === 'Menunggu Persetujuan') {
          pendingKeluarCount++;
          pendingKeluarNominal += entry.nominal;
        }
      }
    });

    const danaTersisa = settings.saldoAwal + totalMasuk - totalKeluar;

    return {
      saldoAwal: settings.saldoAwal,
      totalMasuk,
      totalKeluar,
      danaTersisa,
      pendingKeluarCount,
      pendingKeluarNominal
    };
  }, [cashEntries, settings.saldoAwal]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        users,
        settings,
        updateSettings,
        addIuranTambahan,
        updateIuranTambahan,
        deleteIuranTambahan,
        toggleIuranTambahanStatus,
        santriList,
        addSantri,
        updateSantri,
        archiveSantri,
        restoreSantri,
        exitSantri,
        reactivateSantri,
        importSantriCSV,
        exemptions,
        addExemption,
        revokeExemption,
        transactions,
        addSyahriyahPayment,
        payKilatan,
        registerAndPayKilatan,
        cancelPayment,
        reprintReceipt,
        cashEntries,
        addManualCashEntry,
        approveCashKeluar,
        rejectCashKeluar,
        cancelPendingCashKeluar,
        cancelApprovedCashKeluar,
        updateSaldoAwal,
        getSyahriyahStatus,
        getKilatanStatus,
        calculateSantriTunggakan,
        cashSummary,
        darkMode,
        setDarkMode,
        toasts,
        showToast,
        removeToast,
        activeReceipt,
        setActiveReceipt,
        isQuickPaymentOpen,
        setIsQuickPaymentOpen,
        quickPaymentSantriId,
        setQuickPaymentSantriId,
        selectedSantriDetail,
        setSelectedSantriDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
