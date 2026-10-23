import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Santri, SantriCategory, SantriStatus } from '../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Upload, 
  Download, 
  Eye, 
  Edit3, 
  Archive, 
  RotateCcw, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  X
} from 'lucide-react';
import { formatDateIndo, downloadCSV } from '../utils/formatters';

export const SantriView: React.FC = () => {
  const { 
    currentUser, 
    santriList, 
    addSantri, 
    updateSantri, 
    archiveSantri, 
    restoreSantri, 
    exitSantri, 
    reactivateSantri, 
    importSantriCSV,
    setSelectedSantriDetail,
    showToast 
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | SantriCategory>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | SantriStatus>('Aktif');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [exitingSantri, setExitingSantri] = useState<Santri | null>(null);
  const [reactivatingSantri, setReactivatingSantri] = useState<Santri | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Exit form state
  const [exitDate, setExitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exitPerlakuan, setExitPerlakuan] = useState<'penuh' | 'separuh' | 'bebas'>('penuh');

  // Reactivate form state
  const [reactivateDate, setReactivateDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Import CSV text state
  const [importCsvText, setImportCsvText] = useState('');

  // Filtered Santri
  const filteredList = useMemo(() => {
    return santriList.filter(s => {
      if (categoryFilter !== 'Semua' && s.kategori !== categoryFilter) return false;
      if (statusFilter !== 'Semua' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        const matchWali = s.namaWali.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchWali) return false;
      }
      return true;
    });
  }, [santriList, categoryFilter, statusFilter, searchQuery]);

  // Export Santri to CSV
  const handleExportCSV = () => {
    const headers = ['NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Kategori', 'Status', 'Tanggal Masuk', 'Tanggal Keluar', 'Nama Wali', 'Kontak Wali', 'Alamat'];
    const rows = filteredList.map(s => [
      s.nis,
      s.nama,
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      s.kategori,
      s.status,
      s.tanggalMasuk,
      s.tanggalKeluar || '-',
      s.namaWali,
      s.kontakWali,
      s.alamat || '-'
    ]);

    downloadCSV(`Data_Santri_PP_AlHidayah_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
    showToast('Data santri berhasil diekspor ke CSV', 'success');
  };

  // Submit Exit
  const handleConfirmExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitingSantri) return;
    const res = exitSantri(exitingSantri.id, exitDate, exitPerlakuan);
    if (res.success) {
      setExitingSantri(null);
    }
  };

  // Submit Reactivate
  const handleConfirmReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivatingSantri) return;
    const res = reactivateSantri(reactivatingSantri.id, reactivateDate);
    if (res.success) {
      setReactivatingSantri(null);
    }
  };

  // Handle CSV Import
  const handleProcessImport = () => {
    if (!importCsvText.trim()) {
      showToast('Tempelkan data CSV terlebih dahulu', 'error');
      return;
    }

    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        showToast('Data CSV minimal memiliki 1 baris header dan 1 baris data', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push(rowObj);
      }

      const res = importSantriCSV(parsedRows);
      if (res.success) {
        showToast(`Berhasil mengimpor ${res.count} santri baru`, 'success');
        if (res.errors.length > 0) {
          showToast(`Peringatan: ${res.errors.length} baris dilewati karena duplikat/invalid`, 'warning');
        }
        setIsImportModalOpen(false);
        setImportCsvText('');
      } else {
        showToast(`Gagal impor: ${res.errors.join(', ')}`, 'error');
      }
    } catch {
      showToast('Format CSV tidak valid. Gunakan pemisah koma.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Data Pokok Santri</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola data santri mukim, nduduk, kilatan, riwayat mutasi, dan verifikasi wali
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          {/* Import CSV (Admin & Sekretaris) */}
          {currentUser.role !== 'bendahara' && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Impor CSV</span>
            </button>
          )}

          {/* Add Santri (Admin & Sekretaris) */}
          {currentUser.role !== 'bendahara' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Santri Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari santri berdasarkan nama, NIS, atau wali..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            {(['Semua', 'Mukim', 'Nduduk', 'Kilatan'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            {(['Semua', 'Aktif', 'Tidak Aktif', 'Arsip'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Santri Data Table (PC-First with Sticky Left Name Column) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[200px]">
                  Santri / NIS
                </th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Tanggal Masuk</th>
                <th className="py-3 px-3">Nama Wali</th>
                <th className="py-3 px-3">Kontak Wali</th>
                <th className="py-3 px-3">Alamat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(santri => {
                  const isAktif = santri.status === 'Aktif';
                  const isArsip = santri.status === 'Arsip';

                  return (
                    <tr 
                      key={santri.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Sticky Name & NIS Column */}
                      <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSantriDetail(santri)}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer"
                          >
                            {santri.nama}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          NIS: {santri.nis} • {santri.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                          santri.kategori === 'Mukim'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : santri.kategori === 'Nduduk'
                            ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {santri.kategori}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                          isAktif
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : santri.status === 'Tidak Aktif'
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {santri.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {formatDateIndo(santri.tanggalMasuk)}
                      </td>

                      <td className="py-3 px-3 font-medium">
                        {santri.namaWali}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {santri.kontakWali}
                      </td>

                      <td className="py-3 px-3 max-w-[150px] truncate" title={santri.alamat}>
                        {santri.alamat || '-'}
                      </td>

                      {/* Action Tools */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* 👁️ View Detail */}
                          <button
                            onClick={() => setSelectedSantriDetail(santri)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Lihat Detail & Riwayat Pembayaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit (Admin & Sekretaris only, Bendahara disabled) */}
                          {currentUser.role !== 'bendahara' && (
                            <button
                              onClick={() => setEditingSantri(santri)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Data Santri"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Record Exit Date (Admin & Sekretaris) */}
                          {currentUser.role !== 'bendahara' && isAktif && (
                            <button
                              onClick={() => setExitingSantri(santri)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Catat Tanggal Keluar"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reactivate (Admin only) */}
                          {currentUser.role === 'admin' && santri.status === 'Tidak Aktif' && (
                            <button
                              onClick={() => setReactivatingSantri(santri)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              title="Aktifkan Kembali Santri"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive / Restore (Admin only - NEVER "Hapus Santri") */}
                          {currentUser.role === 'admin' && (
                            !isArsip ? (
                              <button
                                onClick={() => archiveSantri(santri.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                title="Arsipkan Santri"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => restoreSantri(santri.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                                title="Pulihkan Santri"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
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

      {/* MODAL 1: Tambah Santri Baru */}
      {isAddModalOpen && (
        <SantriFormModal
          title="Tambah Santri Baru"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(data) => {
            const res = addSantri(data as any);
            if (res.success) setIsAddModalOpen(false);
          }}
        />
      )}

      {/* MODAL 2: Edit Santri */}
      {editingSantri && (
        <SantriFormModal
          title="Edit Data Santri"
          initialData={editingSantri}
          onClose={() => setEditingSantri(null)}
          onSubmit={(data) => {
            const res = updateSantri(editingSantri.id, data);
            if (res.success) setEditingSantri(null);
          }}
        />
      )}

      {/* MODAL 3: Catat Tanggal Keluar Santri */}
      {exitingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Catat Tanggal Keluar Santri
              </h3>
              <button onClick={() => setExitingSantri(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Santri: <strong>{exitingSantri.nama}</strong> ({exitingSantri.nis}). Setelah tanggal keluar, santri berstatus <em>Tidak Aktif</em>.
            </p>

            <form onSubmit={handleConfirmExit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Keluar *
                </label>
                <input
                  type="date"
                  required
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perlakuan Iuran Bulan Keluar (Kebijakan Admin)
                </label>
                <select
                  value={exitPerlakuan}
                  onChange={(e) => setExitPerlakuan(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="penuh">Dikenakan Iuran Penuh</option>
                  <option value="separuh">Dikenakan Iuran Separuh (50%)</option>
                  <option value="bebas">Tidak Dikenakan Iuran (Bebas)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExitingSantri(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Tanggal Keluar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Aktifkan Kembali Santri */}
      {reactivatingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Aktifkan Kembali Santri
              </h3>
              <button onClick={() => setReactivatingSantri(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Santri: <strong>{reactivatingSantri.nama}</strong> ({reactivatingSantri.nis}). Syahriyah akan mulai ditagih pada bulan berikutnya setelah tanggal aktif kembali.
            </p>

            <form onSubmit={handleConfirmReactivate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Aktif Kembali *
                </label>
                <input
                  type="date"
                  required
                  value={reactivateDate}
                  onChange={(e) => setReactivateDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReactivatingSantri(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Aktifkan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Impor CSV Santri */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Impor Data Santri (CSV)
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tempelkan format CSV dengan kolom header: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">nis,nama,gender,kategori,tanggalMasuk,namaWali,kontakWali,alamat</code>
            </p>

            <textarea
              rows={6}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={`nis,nama,gender,kategori,tanggalMasuk,namaWali,kontakWali,alamat\n20260111,Achmad Baihaqi,L,Mukim,2026-01-10,H. Suwandi,081234567899,Pare`}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Proses Impor Santri
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-component for adding / editing santri
interface SantriFormModalProps {
  title: string;
  initialData?: Santri;
  onClose: () => void;
  onSubmit: (data: Partial<Santri>) => void;
}

const SantriFormModal: React.FC<SantriFormModalProps> = ({
  title,
  initialData,
  onClose,
  onSubmit
}) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [nis, setNis] = useState(initialData?.nis || '');
  const [gender, setGender] = useState<'L' | 'P'>(initialData?.gender || 'L');
  const [kategori, setKategori] = useState<SantriCategory>(initialData?.kategori || 'Mukim');
  const [status, setStatus] = useState<SantriStatus>(initialData?.status || 'Aktif');
  const [tanggalMasuk, setTanggalMasuk] = useState(initialData?.tanggalMasuk || new Date().toISOString().split('T')[0]);
  const [namaWali, setNamaWali] = useState(initialData?.namaWali || '');
  const [kontakWali, setKontakWali] = useState(initialData?.kontakWali || '');
  const [alamat, setAlamat] = useState(initialData?.alamat || '');

  // Recommended Syahriyah rule from PRD:
  // Masuk 1-15 -> rekomendasi penuh, 16-akhir -> rekomendasi separuh
  const rekomendasiSyahriyah = useMemo(() => {
    if (!tanggalMasuk) return 'Penuh';
    const day = parseInt(tanggalMasuk.split('-')[2] || '1', 10);
    return day <= 15 ? 'Penuh (100%)' : 'Separuh (50%)';
  }, [tanggalMasuk]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nama: nama.trim(),
      nis: nis.trim(),
      gender,
      kategori,
      status,
      tanggalMasuk,
      namaWali: namaWali.trim(),
      kontakWali: kontakWali.trim(),
      alamat: alamat.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Santri *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap santri"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIS (Nomor Induk Santri) *
              </label>
              <input
                type="text"
                required
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Contoh: 20240115"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="L">Laki-laki (Putra)</option>
                <option value="P">Perempuan (Putri)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Santri
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="Mukim">Mukim</option>
                <option value="Nduduk">Nduduk</option>
                <option value="Kilatan">Kilatan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Masuk Santri *
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                Rekomendasi Syahriyah: {rekomendasiSyahriyah}
              </span>
            </div>
            <input
              type="date"
              required
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Orang Tua / Wali *
              </label>
              <input
                type="text"
                required
                value={namaWali}
                onChange={(e) => setNamaWali(e.target.value)}
                placeholder="Nama wali santri"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kontak / WhatsApp Wali *
              </label>
              <input
                type="tel"
                required
                value={kontakWali}
                onChange={(e) => setKontakWali(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Domisili
            </label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Desa, Kecamatan, Kota"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Simpan Data Santri
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
