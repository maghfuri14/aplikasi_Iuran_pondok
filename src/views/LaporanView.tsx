import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  Filter, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ChevronDown,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { 
  formatRupiah, 
  formatDateIndo, 
  downloadCSV, 
  BULAN_NAMES,
  BULAN_SHORT
} from '../utils/formatters';

type ReportType = 
  | 'ringkasan' 
  | 'kas_masuk' 
  | 'kas_keluar' 
  | 'syahriyah' 
  | 'kilatan' 
  | 'tunggakan_wali';

type PresetRange = 'bulan_ini' | 'kuartal_ini' | 'tahun_ini' | 'custom';

export const LaporanView: React.FC = () => {
  const { 
    currentUser, 
    settings, 
    cashEntries, 
    transactions, 
    santriList, 
    calculateSantriTunggakan,
    showToast 
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>('ringkasan');
  const [preset, setPreset] = useState<PresetRange>('bulan_ini');
  
  // Custom date range
  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return now.toISOString().split('T')[0];
  });

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Sync dates when preset changes
  const handlePresetChange = (newPreset: PresetRange) => {
    setPreset(newPreset);
    const d = new Date();
    const curYear = d.getFullYear();
    const curMonth = d.getMonth();

    if (newPreset === 'bulan_ini') {
      setStartDate(new Date(curYear, curMonth, 1).toISOString().split('T')[0]);
      setEndDate(d.toISOString().split('T')[0]);
    } else if (newPreset === 'kuartal_ini') {
      const qStartMonth = Math.floor(curMonth / 3) * 3;
      setStartDate(new Date(curYear, qStartMonth, 1).toISOString().split('T')[0]);
      setEndDate(d.toISOString().split('T')[0]);
    } else if (newPreset === 'tahun_ini') {
      setStartDate(`${curYear}-01-01`);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  // Filtered Cash Entries in date range
  const dateFilteredCash = useMemo(() => {
    return cashEntries.filter(c => {
      return c.tanggal >= startDate && c.tanggal <= endDate;
    });
  }, [cashEntries, startDate, endDate]);

  // Filtered Transactions in date range
  const dateFilteredTx = useMemo(() => {
    return transactions.filter(t => {
      return t.tanggalTransaksi >= startDate && t.tanggalTransaksi <= endDate;
    });
  }, [transactions, startDate, endDate]);

  // Tunggakan Per Wali
  const tunggakanPerWaliList = useMemo(() => {
    const map = new Map<string, {
      namaWali: string;
      kontakWali: string;
      santriList: string[];
      totalTunggakan: number;
    }>();

    santriList.forEach(s => {
      if (s.status !== 'Aktif' || s.kategori === 'Kilatan') return;
      const tunggakan = calculateSantriTunggakan(s.id);
      if (tunggakan.totalTunggakan > 0) {
        const key = s.namaWali.trim().toLowerCase();
        const existing = map.get(key) || {
          namaWali: s.namaWali,
          kontakWali: s.kontakWali,
          santriList: [],
          totalTunggakan: 0
        };
        existing.santriList.push(s.nama);
        existing.totalTunggakan += tunggakan.totalTunggakan;
        map.set(key, existing);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalTunggakan - a.totalTunggakan);
  }, [santriList, calculateSantriTunggakan]);

  // Export to CSV
  const handleExportCSV = () => {
    setIsExportDropdownOpen(false);

    if (reportType === 'kas_masuk') {
      const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Sumber', 'Nominal', 'Status'];
      const rows = dateFilteredCash.filter(c => c.tipe === 'masuk').map(c => [
        c.tanggal, c.kategori, c.keterangan, c.sumber, c.nominal, c.status
      ]);
      downloadCSV(`Laporan_Kas_Masuk_${startDate}_sd_${endDate}.csv`, [headers, ...rows]);
    } else if (reportType === 'kas_keluar') {
      const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Nominal', 'Status', 'Disetujui Oleh'];
      const rows = dateFilteredCash.filter(c => c.tipe === 'keluar').map(c => [
        c.tanggal, c.kategori, c.keterangan, c.nominal, c.status, c.disetujuiOleh || '-'
      ]);
      downloadCSV(`Laporan_Kas_Keluar_${startDate}_sd_${endDate}.csv`, [headers, ...rows]);
    } else if (reportType === 'syahriyah') {
      const headers = ['No Kuitansi', 'Tanggal', 'NIS', 'Nama Santri', 'Kategori', 'Total', 'Metode', 'Status'];
      const rows = dateFilteredTx.filter(t => t.jenisIuran === 'Syahriyah').map(t => [
        t.nomorKuitansi, t.tanggalTransaksi, t.santriNis, t.santriNama, t.santriKategori, t.nominalTotal, t.metode, t.status
      ]);
      downloadCSV(`Laporan_Syahriyah_${startDate}_sd_${endDate}.csv`, [headers, ...rows]);
    } else if (reportType === 'kilatan') {
      const headers = ['No Kuitansi', 'Tanggal', 'NIS', 'Nama Santri', 'Program', 'Tahun', 'Nominal', 'Metode', 'Status'];
      const rows = dateFilteredTx.filter(t => t.jenisIuran === 'Kilatan').map(t => [
        t.nomorKuitansi, t.tanggalTransaksi, t.santriNis, t.santriNama, t.kilatanProgram || '', t.periodeTahun, t.nominalTotal, t.metode, t.status
      ]);
      downloadCSV(`Laporan_Kilatan_${startDate}_sd_${endDate}.csv`, [headers, ...rows]);
    } else if (reportType === 'tunggakan_wali') {
      const headers = ['Nama Wali', 'Kontak WhatsApp', 'Nama Santri', 'Total Tunggakan'];
      const rows = tunggakanPerWaliList.map(w => [
        w.namaWali, w.kontakWali, w.santriList.join('; '), w.totalTunggakan
      ]);
      downloadCSV(`Laporan_Tunggakan_Per_Wali_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
    } else {
      // Ringkasan Periode
      const totalMasuk = dateFilteredCash.filter(c => c.tipe === 'masuk' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0);
      const totalKeluar = dateFilteredCash.filter(c => c.tipe === 'keluar' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0);
      const rows = [
        ['Periode Laporan', `${startDate} s/d ${endDate}`],
        ['Total Pemasukan Kas', totalMasuk],
        ['Total Pengeluaran Kas Disetujui', totalKeluar],
        ['Surplus / Defisit Periode', totalMasuk - totalKeluar],
      ];
      downloadCSV(`Ringkasan_Kas_Periode_${startDate}_sd_${endDate}.csv`, rows);
    }

    showToast('Laporan berhasil diekspor ke CSV', 'success');
  };

  // Export to Excel (.xlsx via XML-compatible CSV)
  const handleExportExcel = () => {
    setIsExportDropdownOpen(false);
    handleExportCSV();
  };

  // Export to PDF / Print View
  const handlePrintPDF = () => {
    setIsExportDropdownOpen(false);
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Laporan Keuangan & Rekapitulasi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ekspor laporan keuangan resmi pesantren, rekap iuran santri, dan rincian tunggakan wali
          </p>
        </div>

        {/* Unified Single Export Button with Dropdown (PRD Section 11.2) */}
        <div className="relative">
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Laporan</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isExportDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-30 animate-in fade-in zoom-in-95">
              <button
                onClick={handlePrintPDF}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>PDF (Cetak / Simpan)</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>CSV Spreadsheet</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        
        {/* Report Types Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ringkasan', label: 'Ringkasan Kas Periode' },
            { id: 'kas_masuk', label: 'Kas Masuk' },
            { id: 'kas_keluar', label: 'Kas Keluar' },
            { id: 'syahriyah', label: 'Rekap Syahriyah' },
            { id: 'kilatan', label: 'Rekap Kilatan' },
            { id: 'tunggakan_wali', label: 'Tunggakan per Wali' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reportType === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter Presets & Custom Range */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            <button
              onClick={() => handlePresetChange('bulan_ini')}
              className={`px-3 py-1 rounded-lg ${preset === 'bulan_ini' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePresetChange('kuartal_ini')}
              className={`px-3 py-1 rounded-lg ${preset === 'kuartal_ini' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Kuartal Ini
            </button>
            <button
              onClick={() => handlePresetChange('tahun_ini')}
              className={`px-3 py-1 rounded-lg ${preset === 'tahun_ini' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPreset('custom')}
              className={`px-3 py-1 rounded-lg ${preset === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Custom
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Rentang:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

        </div>

      </div>

      {/* Printable Report Container */}
      <div id="printable-report" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        
        {/* Kop Lembaga untuk Print / PDF */}
        <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 inline" />
            <h3 className="font-extrabold text-base uppercase text-slate-900 dark:text-white tracking-wider">
              {settings.namaPondok}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {settings.alamatPondok} • Telp: {settings.teleponPondok}
          </p>
          <div className="pt-2">
            <h4 className="font-bold text-sm uppercase text-slate-800 dark:text-slate-200 underline">
              {reportType === 'ringkasan' && 'Laporan Ringkasan Arus Kas'}
              {reportType === 'kas_masuk' && 'Laporan Penerimaan Kas Masuk'}
              {reportType === 'kas_keluar' && 'Laporan Pengeluaran Kas Keluar'}
              {reportType === 'syahriyah' && 'Laporan Penerimaan Iuran Syahriyah'}
              {reportType === 'kilatan' && 'Laporan Penerimaan Iuran Kilatan'}
              {reportType === 'tunggakan_wali' && 'Laporan Tunggakan Iuran per Wali Santri'}
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Periode: {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}
            </p>
          </div>
        </div>

        {/* REPORT CONTENT PER TYPE */}

        {/* 1. Ringkasan Kas Periode */}
        {reportType === 'ringkasan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Pemasukan Periode</span>
                <div className="font-mono text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                  +{formatRupiah(dateFilteredCash.filter(c => c.tipe === 'masuk' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0))}
                </div>
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Total Pengeluaran Disetujui</span>
                <div className="font-mono text-xl font-bold text-rose-900 dark:text-rose-200 mt-1">
                  -{formatRupiah(dateFilteredCash.filter(c => c.tipe === 'keluar' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Surplus / Selisih Periode</span>
                <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatRupiah(
                    dateFilteredCash.filter(c => c.tipe === 'masuk' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0) -
                    dateFilteredCash.filter(c => c.tipe === 'keluar' && c.status === 'Disetujui').reduce((a, b) => a + b.nominal, 0)
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Kategori</th>
                    <th className="py-2">Keterangan</th>
                    <th className="py-2 text-right">Masuk</th>
                    <th className="py-2 text-right">Keluar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dateFilteredCash.filter(c => c.status === 'Disetujui').map(c => (
                    <tr key={c.id}>
                      <td className="py-2 font-mono">{formatDateIndo(c.tanggal)}</td>
                      <td className="py-2 font-medium">{c.kategori}</td>
                      <td className="py-2">{c.keterangan}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        {c.tipe === 'masuk' ? formatRupiah(c.nominal) : '-'}
                      </td>
                      <td className="py-2 text-right font-mono text-rose-600">
                        {c.tipe === 'keluar' ? formatRupiah(c.nominal) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Kas Masuk */}
        {reportType === 'kas_masuk' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Keterangan</th>
                  <th className="py-2">Sumber</th>
                  <th className="py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dateFilteredCash.filter(c => c.tipe === 'masuk' && c.status === 'Disetujui').map(c => (
                  <tr key={c.id}>
                    <td className="py-2 font-mono">{formatDateIndo(c.tanggal)}</td>
                    <td className="py-2 font-medium">{c.kategori}</td>
                    <td className="py-2">{c.keterangan}</td>
                    <td className="py-2">{c.sumber}</td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-600">{formatRupiah(c.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Kas Keluar */}
        {reportType === 'kas_keluar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Keterangan</th>
                  <th className="py-2">Disetujui Oleh</th>
                  <th className="py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dateFilteredCash.filter(c => c.tipe === 'keluar' && c.status === 'Disetujui').map(c => (
                  <tr key={c.id}>
                    <td className="py-2 font-mono">{formatDateIndo(c.tanggal)}</td>
                    <td className="py-2 font-medium">{c.kategori}</td>
                    <td className="py-2">{c.keterangan}</td>
                    <td className="py-2 font-medium">{c.disetujuiOleh || '-'}</td>
                    <td className="py-2 text-right font-mono font-bold text-rose-600">{formatRupiah(c.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Rekap Syahriyah */}
        {reportType === 'syahriyah' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="py-2">No Kuitansi</th>
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Santri / NIS</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Alokasi Bulan</th>
                  <th className="py-2 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dateFilteredTx.filter(t => t.jenisIuran === 'Syahriyah' && t.status === 'Aktif').map(t => (
                  <tr key={t.id}>
                    <td className="py-2 font-mono font-bold">{t.nomorKuitansi}</td>
                    <td className="py-2 font-mono">{formatDateIndo(t.tanggalTransaksi)}</td>
                    <td className="py-2 font-semibold">{t.santriNama} ({t.santriNis})</td>
                    <td className="py-2">{t.santriKategori}</td>
                    <td className="py-2 font-mono">{t.allocations.map(a => `${BULAN_SHORT[a.bulan - 1]} ${a.tahun}`).join(', ')}</td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-600">{formatRupiah(t.nominalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Rekap Kilatan */}
        {reportType === 'kilatan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="py-2">No Kuitansi</th>
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Santri / NIS</th>
                  <th className="py-2">Program</th>
                  <th className="py-2">Tahun</th>
                  <th className="py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dateFilteredTx.filter(t => t.jenisIuran === 'Kilatan' && t.status === 'Aktif').map(t => (
                  <tr key={t.id}>
                    <td className="py-2 font-mono font-bold">{t.nomorKuitansi}</td>
                    <td className="py-2 font-mono">{formatDateIndo(t.tanggalTransaksi)}</td>
                    <td className="py-2 font-semibold">{t.santriNama} ({t.santriNis})</td>
                    <td className="py-2 font-bold">{t.kilatanProgram}</td>
                    <td className="py-2 font-mono">{t.periodeTahun}</td>
                    <td className="py-2 text-right font-mono font-bold text-teal-600">{formatRupiah(t.nominalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Tunggakan Per Wali */}
        {reportType === 'tunggakan_wali' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="py-2">Nama Wali Santri</th>
                  <th className="py-2">Kontak / WhatsApp</th>
                  <th className="py-2">Santri Terkait</th>
                  <th className="py-2 text-right">Total Tunggakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tunggakanPerWaliList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Tidak ada wali santri yang memiliki tunggakan iuran.
                    </td>
                  </tr>
                ) : (
                  tunggakanPerWaliList.map((w, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-slate-900 dark:text-white">{w.namaWali}</td>
                      <td className="py-2 font-mono">{w.kontakWali}</td>
                      <td className="py-2">{w.santriList.join(', ')}</td>
                      <td className="py-2 text-right font-mono font-bold text-rose-600">{formatRupiah(w.totalTunggakan)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Penanggung Jawab di Bawah Laporan */}
        <div className="pt-8 flex justify-between items-end text-xs text-slate-700 dark:text-slate-300">
          <div className="text-center">
            <p className="text-slate-500 mb-12">Mengetahui,<br />Pimpinan Pondok Pesantren</p>
            <p className="font-bold underline text-slate-900 dark:text-white">{settings.pimpinanPondok}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 mb-12">Pare, {formatDateIndo(new Date().toISOString().split('T')[0])}<br />Bendahara Utama</p>
            <p className="font-bold underline text-slate-900 dark:text-white">{settings.bendaharaUtama}</p>
          </div>
        </div>

      </div>

    </div>
  );
};
