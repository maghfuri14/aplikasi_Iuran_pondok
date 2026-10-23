import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  ShieldCheck, 
  DollarSign, 
  Building, 
  Lock, 
  Users, 
  DatabaseBackup, 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  X, 
  Check, 
  Printer, 
  Sliders, 
  Image as ImageIcon, 
  Globe, 
  Mail, 
  Phone, 
  QrCode, 
  FileText,
  Eye
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { IuranTambahan } from '../types';

type SettingsTab = 'kop' | 'tarif' | 'kuitansi' | 'otorisasi';

export const PengaturanView: React.FC = () => {
  const { 
    currentUser, 
    settings, 
    updateSettings, 
    users, 
    transactions, 
    cashEntries, 
    updateSaldoAwal,
    addIuranTambahan,
    updateIuranTambahan,
    deleteIuranTambahan,
    toggleIuranTambahanStatus,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('kop');
  const [isEditing, setIsEditing] = useState(false);

  // Tab 1: Kop Surat & Profil Lembaga
  const [namaPondok, setNamaPondok] = useState(settings.namaPondok);
  const [subJudulPondok, setSubJudulPondok] = useState(settings.subJudulPondok || '');
  const [alamatPondok, setAlamatPondok] = useState(settings.alamatPondok);
  const [teleponPondok, setTeleponPondok] = useState(settings.teleponPondok);
  const [emailPondok, setEmailPondok] = useState(settings.emailPondok || '');
  const [websitePondok, setWebsitePondok] = useState(settings.websitePondok || '');
  const [logoPondokUrl, setLogoPondokUrl] = useState(settings.logoPondokUrl || '');
  const [pimpinanPondok, setPimpinanPondok] = useState(settings.pimpinanPondok);
  const [bendaharaUtama, setBendaharaUtama] = useState(settings.bendaharaUtama);

  // Tab 2: Tarif & Iuran Tambahan
  const [syahriyahMukim, setSyahriyahMukim] = useState(settings.syahriyahMukim);
  const [syahriyahNduduk, setSyahriyahNduduk] = useState(settings.syahriyahNduduk);
  const [kilatanSantriKilatan, setKilatanSantriKilatan] = useState(settings.kilatanTarif.Kilatan);
  const [kilatanMukim, setKilatanMukim] = useState(settings.kilatanTarif.Mukim);
  const [kilatanNduduk, setKilatanNduduk] = useState(settings.kilatanTarif.Nduduk);

  // Iuran Tambahan Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeNama, setFeeNama] = useState('');
  const [feeNominal, setFeeNominal] = useState<number>(10000);
  const [feeIsWajib, setFeeIsWajib] = useState<boolean>(true);
  const [feeKategori, setFeeKategori] = useState<'Semua' | 'Mukim' | 'Nduduk'>('Semua');
  const [feeKeterangan, setFeeKeterangan] = useState('');

  // Tab 3: Tampilan Kuitansi
  const [kuitansiFormatDefault, setKuitansiFormatDefault] = useState<'58mm' | '80mm' | 'a4'>(
    settings.kuitansiFormatDefault || '80mm'
  );
  const [tampilkanLogoKuitansi, setTampilkanLogoKuitansi] = useState<boolean>(
    settings.tampilkanLogoKuitansi !== false
  );
  const [tampilkanQRCodeKuitansi, setTampilkanQRCodeKuitansi] = useState<boolean>(
    settings.tampilkanQRCodeKuitansi !== false
  );
  const [tampilkanPetugasKuitansi, setTampilkanPetugasKuitansi] = useState<boolean>(
    settings.tampilkanPetugasKuitansi !== false
  );
  const [tampilkanCatatanKuitansi, setTampilkanCatatanKuitansi] = useState<boolean>(
    settings.tampilkanCatatanKuitansi !== false
  );
  const [catatanKuitansiFootnote, setCatatanKuitansiFootnote] = useState(
    settings.catatanKuitansiFootnote || 'Bukti pembayaran sah secara komputerisasi SimKas Pondok.'
  );
  const [ukuranFontKuitansi, setUkuranFontKuitansi] = useState<'Kecil' | 'Sedang' | 'Besar'>(
    settings.ukuranFontKuitansi || 'Sedang'
  );
  const [warnaAksenKuitansi, setWarnaAksenKuitansi] = useState<'Emerald' | 'Navy' | 'Monokrom'>(
    settings.warnaAksenKuitansi || 'Emerald'
  );

  // Tab 4: Otorisasi Kas & Saldo Awal
  const [approvalThreshold, setApprovalThreshold] = useState(settings.approvalThreshold);
  const hasTransactions = transactions.length > 0 || cashEntries.length > 0;
  const [saldoAwalInput, setSaldoAwalInput] = useState(settings.saldoAwal);

  const handleCancelEdit = () => {
    // Reset All State
    setNamaPondok(settings.namaPondok);
    setSubJudulPondok(settings.subJudulPondok || '');
    setAlamatPondok(settings.alamatPondok);
    setTeleponPondok(settings.teleponPondok);
    setEmailPondok(settings.emailPondok || '');
    setWebsitePondok(settings.websitePondok || '');
    setLogoPondokUrl(settings.logoPondokUrl || '');
    setPimpinanPondok(settings.pimpinanPondok);
    setBendaharaUtama(settings.bendaharaUtama);

    setSyahriyahMukim(settings.syahriyahMukim);
    setSyahriyahNduduk(settings.syahriyahNduduk);
    setKilatanSantriKilatan(settings.kilatanTarif.Kilatan);
    setKilatanMukim(settings.kilatanTarif.Mukim);
    setKilatanNduduk(settings.kilatanTarif.Nduduk);

    setKuitansiFormatDefault(settings.kuitansiFormatDefault || '80mm');
    setTampilkanLogoKuitansi(settings.tampilkanLogoKuitansi !== false);
    setTampilkanQRCodeKuitansi(settings.tampilkanQRCodeKuitansi !== false);
    setTampilkanPetugasKuitansi(settings.tampilkanPetugasKuitansi !== false);
    setTampilkanCatatanKuitansi(settings.tampilkanCatatanKuitansi !== false);
    setCatatanKuitansiFootnote(settings.catatanKuitansiFootnote || 'Bukti pembayaran sah secara komputerisasi SimKas Pondok.');
    setUkuranFontKuitansi(settings.ukuranFontKuitansi || 'Sedang');
    setWarnaAksenKuitansi(settings.warnaAksenKuitansi || 'Emerald');

    setApprovalThreshold(settings.approvalThreshold);
    setSaldoAwalInput(settings.saldoAwal);
    setIsEditing(false);
  };

  const handleOpenAddFee = () => {
    setEditingFeeId(null);
    setFeeNama('');
    setFeeNominal(10000);
    setFeeIsWajib(true);
    setFeeKategori('Semua');
    setFeeKeterangan('');
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (fee: IuranTambahan) => {
    setEditingFeeId(fee.id);
    setFeeNama(fee.nama);
    setFeeNominal(fee.nominal);
    setFeeIsWajib(fee.isWajib);
    setFeeKategori(fee.kategoriSantri);
    setFeeKeterangan(fee.keterangan || '');
    setIsFeeModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeNama.trim()) {
      showToast('Nama iuran tambahan wajib diisi', 'error');
      return;
    }
    if (feeNominal <= 0) {
      showToast('Nominal iuran harus lebih besar dari 0', 'error');
      return;
    }

    if (editingFeeId) {
      updateIuranTambahan(editingFeeId, {
        nama: feeNama.trim(),
        nominal: feeNominal,
        isWajib: feeIsWajib,
        kategoriSantri: feeKategori,
        keterangan: feeKeterangan.trim()
      });
    } else {
      addIuranTambahan({
        nama: feeNama.trim(),
        nominal: feeNominal,
        isWajib: feeIsWajib,
        kategoriSantri: feeKategori,
        keterangan: feeKeterangan.trim(),
        isActive: true
      });
    }
    setIsFeeModalOpen(false);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      showToast('Gagal: Hanya Admin yang dapat memperbarui pengaturan.', 'error');
      return;
    }

    updateSettings({
      namaPondok,
      subJudulPondok,
      alamatPondok,
      teleponPondok,
      emailPondok,
      websitePondok,
      logoPondokUrl,
      pimpinanPondok,
      bendaharaUtama,

      syahriyahMukim,
      syahriyahNduduk,
      kilatanTarif: {
        Kilatan: kilatanSantriKilatan,
        Mukim: kilatanMukim,
        Nduduk: kilatanNduduk
      },

      kuitansiFormatDefault,
      tampilkanLogoKuitansi,
      tampilkanQRCodeKuitansi,
      tampilkanPetugasKuitansi,
      tampilkanCatatanKuitansi,
      catatanKuitansiFootnote,
      ukuranFontKuitansi,
      warnaAksenKuitansi,

      approvalThreshold
    });

    if (!hasTransactions && saldoAwalInput !== settings.saldoAwal) {
      updateSaldoAwal(saldoAwalInput);
    }

    setIsEditing(false);
    showToast('Semua pengaturan sistem berhasil disimpan.', 'success');
  };

  const handleTriggerBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      settings,
      timestamp: new Date().toISOString()
    }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Backup_SimKas_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Snapshot backup konfigurasi berhasil diunduh.', 'success');
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200">
        Hanya Admin / Kepala Pondok yang memiliki hak akses halaman Pengaturan Sistem.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Pengaturan Sistem & Kebijakan Kas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola profil kop lembaga, kebijakan tarif, tampilan kuitansi, dan hak akses sistem
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Pengaturan</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
              <button
                type="button"
                onClick={handleSaveGeneral}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          )}

          <button
            onClick={handleTriggerBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Download snapshot backup format JSON"
          >
            <DatabaseBackup className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Cadangkan Data</span>
          </button>
        </div>
      </div>

      {/* Editing Mode Notice Banner */}
      {isEditing && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <div>
              <p className="font-bold">Mode Edit Sedang Aktif</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Semua kolom input kini dapat diubah nilainya. Setelah selesai, klik <strong>Simpan Perubahan</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Kembalikan Semula
          </button>
        </div>
      )}

      {/* CATEGORIES / SETTINGS TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('kop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'kop'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Kop & Profil Lembaga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tarif')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'tarif'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tarif & Iuran Tambahan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kuitansi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'kuitansi'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Tampilan Kuitansi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('otorisasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'otorisasi'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Otorisasi Kas & Pengguna</span>
        </button>
      </div>

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        
        {/* ======================================================== */}
        {/* TAB 1: KOP & PROFIL LEMBAGA */}
        {/* ======================================================== */}
        {activeTab === 'kop' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Building className="w-4 h-4 text-emerald-600" />
                <h3>Identitas Lembaga & Custom Kop Surat</h3>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Ubah Kop & Profil</span>
                </button>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-full">
                  Dapat Diubah
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lembaga Pesantren *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={namaPondok}
                  onChange={(e) => setNamaPondok(e.target.value)}
                  placeholder="Contoh: PP Al Hidayah Tertek"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Judul / Keterangan Kop (Opsional)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={subJudulPondok}
                  onChange={(e) => setSubJudulPondok(e.target.value)}
                  placeholder="Contoh: Yayasan Pendidikan & Pesantren / SK Kemenkumham..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Lengkap Pesantren *
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={alamatPondok}
                onChange={(e) => setAlamatPondok(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-all ${
                  !isEditing
                    ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Telepon / Kontak *</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={teleponPondok}
                  onChange={(e) => setTeleponPondok(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Email Resmi (Opsional)</span>
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={emailPondok}
                  onChange={(e) => setEmailPondok(e.target.value)}
                  placeholder="info@pesantren.or.id"
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>Website Resmi (Opsional)</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={websitePondok}
                  onChange={(e) => setWebsitePondok(e.target.value)}
                  placeholder="www.pesantren.or.id"
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Custom Logo URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>URL Logo Pesantren / Emblem Kop (Opsional)</span>
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  disabled={!isEditing}
                  value={logoPondokUrl}
                  onChange={(e) => setLogoPondokUrl(e.target.value)}
                  placeholder="https://domain.com/logo.png atau data:image/png;base64,..."
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {logoPondokUrl ? (
                  <img
                    src={logoPondokUrl}
                    alt="Preview Logo"
                    className="w-9 h-9 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Logo ini akan ditampilkan pada Kop Kuitansi pembayaran dan laporan kas cetak.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pengasuh / Pimpinan Pondok *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={pimpinanPondok}
                  onChange={(e) => setPimpinanPondok(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Bendahara Utama (Penandatangan Kuitansi) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={bendaharaUtama}
                  onChange={(e) => setBendaharaUtama(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    !isEditing
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TARIF & IURAN TAMBAHAN */}
        {/* ======================================================== */}
        {activeTab === 'tarif' && (
          <div className="space-y-6 animate-in fade-in">
            {/* SEKSI TARIF DASAR */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3>Kebijakan Tarif Dasar Iuran Syahriyah & Kilatan</h3>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Tarif</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-full">
                    Dapat Diubah
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Syahriyah Santri Mukim (per Bulan)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      step="5000"
                      disabled={!isEditing}
                      value={syahriyahMukim}
                      onChange={(e) => setSyahriyahMukim(Number(e.target.value))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                        !isEditing
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Syahriyah Santri Nduduk (per Bulan)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      step="5000"
                      disabled={!isEditing}
                      value={syahriyahNduduk}
                      onChange={(e) => setSyahriyahNduduk(Number(e.target.value))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                        !isEditing
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Tarif Program Kilatan (per Kategori Santri)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Kategori Santri Kilatan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={kilatanSantriKilatan}
                        onChange={(e) => setKilatanSantriKilatan(Number(e.target.value))}
                        className={`w-full pl-9 pr-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                          !isEditing
                            ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Kategori Santri Mukim</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={kilatanMukim}
                        onChange={(e) => setKilatanMukim(Number(e.target.value))}
                        className={`w-full pl-9 pr-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                          !isEditing
                            ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Kategori Santri Nduduk</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={kilatanNduduk}
                        onChange={(e) => setKilatanNduduk(Number(e.target.value))}
                        className={`w-full pl-9 pr-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                          !isEditing
                            ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEKSI IURAN TAMBAHAN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <h3>Pengaturan Iuran Tambahan Syahriyah</h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddFee}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Iuran Baru</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Iuran tambahan ini akan otomatis muncul sebagai opsi centang (checkbox) pada formulir pembayaran Syahriyah. Anda dapat menentukan besaran nominal serta apakah bersifat <strong>Wajib</strong> atau <strong>Sukarela / Tidak Wajib</strong>.
              </p>

              <div className="space-y-2.5">
                {(!settings.iuranTambahanList || settings.iuranTambahanList.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Belum ada iuran tambahan. Klik tombol di atas untuk menambahkan.
                  </div>
                ) : (
                  settings.iuranTambahanList.map(fee => (
                    <div
                      key={fee.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        fee.isActive
                          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {fee.nama}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fee.isWajib
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {fee.isWajib ? 'Wajib' : 'Sukarela / Tidak Wajib'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Sasaran: {fee.kategoriSantri}
                          </span>
                          {!fee.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Non-aktif
                            </span>
                          )}
                        </div>
                        {fee.keterangan && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {fee.keterangan}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {formatRupiah(fee.nominal)}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleIuranTambahanStatus(fee.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              fee.isActive
                                ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                            title={fee.isActive ? 'Non-aktifkan iuran ini' : 'Aktifkan iuran ini'}
                          >
                            {fee.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditFee(fee)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Edit iuran"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus iuran "${fee.nama}"?`)) {
                                deleteIuranTambahan(fee.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus iuran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TAMPILAN KUITANSI & LIVE PREVIEW */}
        {/* ======================================================== */}
        {activeTab === 'kuitansi' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
            {/* OPSI PENGATURAN KUITANSI (LEFT COLUMN - 7 COLS) */}
            <div className="lg:col-span-7 space-y-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <h3>Pengaturan Tampilan & Format Kuitansi</h3>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Tampilan</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-full">
                    Dapat Diubah
                  </span>
                )}
              </div>

              {/* Format Default Kertas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Format Kertas Default Saat Cetak Kuitansi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '80mm', label: 'POS 80mm (Rekomendasi)' },
                    { id: '58mm', label: 'POS 58mm (Kecil)' },
                    { id: 'a4', label: 'Surat A4 (Standar)' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setKuitansiFormatDefault(item.id as '58mm' | '80mm' | 'a4')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        kuitansiFormatDefault === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : !isEditing
                          ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme / Warna Aksen & Ukuran Font */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Warna Aksen Kuitansi
                  </label>
                  <select
                    disabled={!isEditing}
                    value={warnaAksenKuitansi}
                    onChange={(e) => setWarnaAksenKuitansi(e.target.value as 'Emerald' | 'Navy' | 'Monokrom')}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      !isEditing
                        ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="Emerald">Hijau Emerald (Standar)</option>
                    <option value="Navy">Biru Navy (Formal)</option>
                    <option value="Monokrom">Monokrom Hitam / Slate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ukuran Font Cetak
                  </label>
                  <select
                    disabled={!isEditing}
                    value={ukuranFontKuitansi}
                    onChange={(e) => setUkuranFontKuitansi(e.target.value as 'Kecil' | 'Sedang' | 'Besar')}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      !isEditing
                        ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="Kecil">Kecil (Ringkas / 10pt)</option>
                    <option value="Sedang">Sedang (Standar / 12pt)</option>
                    <option value="Besar">Besar (Jelas / 14pt)</option>
                  </select>
                </div>
              </div>

              {/* Toggles Tampilan Komponen */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Komponen Tambahan Kuitansi
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Toggle Logo */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Logo di Kop Kuitansi</span>
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={tampilkanLogoKuitansi}
                      onChange={(e) => setTampilkanLogoKuitansi(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Toggle QR Code */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">QR Code Verifikasi</span>
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={tampilkanQRCodeKuitansi}
                      onChange={(e) => setTampilkanQRCodeKuitansi(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Toggle Petugas */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Nama Petugas Kasir</span>
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={tampilkanPetugasKuitansi}
                      onChange={(e) => setTampilkanPetugasKuitansi(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Toggle Footnote */}
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Catatan Kaki (Footnote)</span>
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={tampilkanCatatanKuitansi}
                      onChange={(e) => setTampilkanCatatanKuitansi(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Teks Catatan Footnote */}
              {tampilkanCatatanKuitansi && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Catatan / Pesan pada Kaki Kuitansi
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isEditing}
                    value={catatanKuitansiFootnote}
                    onChange={(e) => setCatatanKuitansiFootnote(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-all ${
                      !isEditing
                        ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* LIVE SAMPLE PREVIEW CARD (RIGHT COLUMN - 5 COLS) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Langsung Tampilan Kuitansi</span>
              </div>

              <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
                {/* Simulated Receipt Card */}
                <div 
                  className={`bg-white text-slate-900 shadow-md border border-slate-300 p-4 rounded-lg w-[320px] ${
                    ukuranFontKuitansi === 'Kecil'
                      ? 'text-[10px]'
                      : ukuranFontKuitansi === 'Besar'
                      ? 'text-xs'
                      : 'text-[11px]'
                  } font-mono leading-tight`}
                >
                  {/* Kop Header */}
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    {tampilkanLogoKuitansi && logoPondokUrl ? (
                      <img src={logoPondokUrl} alt="Logo" className="w-8 h-8 mx-auto mb-1 object-contain" />
                    ) : null}
                    <h4 className="font-extrabold text-xs uppercase tracking-tight text-slate-900">
                      {namaPondok || 'PP AL HIDAYAH TERTEK'}
                    </h4>
                    {subJudulPondok && (
                      <p className="text-[9px] font-semibold text-slate-600">{subJudulPondok}</p>
                    )}
                    <p className="text-[9px] text-slate-500">{alamatPondok}</p>
                    <p className="text-[9px] text-slate-400">Telp: {teleponPondok}</p>
                  </div>

                  {/* Meta */}
                  <div className="py-2 space-y-0.5 text-slate-700 border-b border-dashed border-slate-200 text-[10px]">
                    <div className="flex justify-between">
                      <span>No. Kuitansi:</span>
                      <span className="font-bold text-slate-900">AH/2026/10/0009</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Santri:</span>
                      <span className="font-semibold text-slate-900">Ahmad Syakir (20240102)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode:</span>
                      <span>Tunai</span>
                    </div>
                    {tampilkanPetugasKuitansi && (
                      <div className="flex justify-between">
                        <span>Petugas:</span>
                        <span>{currentUser.username}</span>
                      </div>
                    )}
                  </div>

                  {/* Allocations */}
                  <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                    <p className="font-bold uppercase text-[9px] text-slate-800">Rincian Pembayaran</p>
                    <div className="flex justify-between">
                      <span>• Syahriyah Oktober 2026</span>
                      <span>Rp 50.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Iuran Kebersihan</span>
                      <span>Rp 10.000</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="py-2 border-b-2 border-slate-900 flex justify-between font-bold text-xs">
                    <span>TOTAL:</span>
                    <span className={
                      warnaAksenKuitansi === 'Navy' ? 'text-indigo-900' : warnaAksenKuitansi === 'Monokrom' ? 'text-slate-900' : 'text-emerald-800'
                    }>
                      Rp 60.000
                    </span>
                  </div>

                  {/* QR & Sign */}
                  <div className="pt-2 flex items-center justify-between text-[9px]">
                    {tampilkanQRCodeKuitansi ? (
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-400">
                        [QR Code]
                      </div>
                    ) : <div />}
                    <div className="text-right">
                      <p className="text-slate-500">Pare, 22 Okt 2026</p>
                      <p className="font-semibold">Bendahara Pondok,</p>
                      <div className="h-4"></div>
                      <p className="font-bold underline">{bendaharaUtama}</p>
                    </div>
                  </div>

                  {/* Footnote */}
                  {tampilkanCatatanKuitansi && (
                    <div className="mt-2 pt-1 border-t border-dotted border-slate-300 text-center text-[8px] text-slate-400">
                      <p>{catatanKuitansiFootnote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: OTORISASI KAS & HAK AKSES PENGGUNA */}
        {/* ======================================================== */}
        {activeTab === 'otorisasi' && (
          <div className="space-y-6 animate-in fade-in">
            {/* SEKSI MAKER-CHECKER & SALDO AWAL */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3>Kebijakan Otorisasi Kas Keluar & Saldo Awal</h3>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Otorisasi</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-full">
                    Dapat Diubah
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Maker-Checker Threshold */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Threshold Persetujuan Kas Keluar (Maker-Checker)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      step="50000"
                      disabled={!isEditing}
                      value={approvalThreshold}
                      onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                        !isEditing
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pengeluaran kas oleh Bendahara yang nominalnya ≥ {formatRupiah(approvalThreshold)} wajib diverifikasi oleh Admin.
                  </p>
                </div>

                {/* Saldo Awal Kas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Saldo Awal Kas Pesantren
                    </label>
                    {hasTransactions ? (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Terkunci (Ada Transaksi)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEditing ? 'Dapat Diatur' : 'Terkunci'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      disabled={!isEditing || hasTransactions}
                      value={saldoAwalInput}
                      onChange={(e) => setSaldoAwalInput(Number(e.target.value))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                        (!isEditing || hasTransactions)
                          ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {hasTransactions 
                      ? 'Terkunci permanen karena buku kas telah mencatat transaksi aktif.' 
                      : 'Dapat diatur saat awal inisialisasi buku kas baru.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SEKSI DAFTAR PENGGUNA & HAK AKSES */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3>Daftar Pengguna Sistem & Hak Akses Role</h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">@{u.username}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Global Submit / Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Buka Kunci untuk Mengedit</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Batalkan Perubahan</span>
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Pengaturan</span>
              </button>
            </>
          )}
        </div>

      </form>

      {/* MODAL TAMBAH / EDIT IURAN TAMBAHAN */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingFeeId ? 'Edit Iuran Tambahan' : 'Tambah Iuran Tambahan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Iuran Tambahan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Iuran Haflah Akhirussanah, Iuran Kebersihan..."
                  value={feeNama}
                  onChange={(e) => setFeeNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Iuran (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={feeNominal}
                    onChange={(e) => setFeeNominal(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sifat Iuran *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeeIsWajib(true)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      feeIsWajib
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Wajib</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeIsWajib(false)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !feeIsWajib
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Sukarela / Tidak Wajib</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {feeIsWajib
                    ? 'Iuran wajib akan otomatis dicentang secara default saat transaksi pembayaran Syahriyah.'
                    : 'Iuran sukarela bersifat opsional dan tidak dicentang otomatis.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sasaran Kategori Santri
                </label>
                <select
                  value={feeKategori}
                  onChange={(e) => setFeeKategori(e.target.value as 'Semua' | 'Mukim' | 'Nduduk')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Semua">Semua Santri (Mukim & Nduduk)</option>
                  <option value="Mukim">Khusus Santri Mukim</option>
                  <option value="Nduduk">Khusus Santri Nduduk</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan tujuan iuran..."
                  value={feeKeterangan}
                  onChange={(e) => setFeeKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingFeeId ? 'Perbarui Iuran' : 'Simpan Iuran Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
