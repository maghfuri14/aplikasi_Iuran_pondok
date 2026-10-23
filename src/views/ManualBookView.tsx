import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  ShieldCheck, 
  Wallet, 
  UserCheck, 
  CalendarCheck, 
  Sparkles, 
  Printer, 
  Keyboard, 
  CheckCircle,
  FileText
} from 'lucide-react';

export const ManualBookView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'umum' | 'syahriyah' | 'kilatan' | 'kas' | 'santri' | 'kuitansi' | 'shortcut'>('umum');

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Buku Panduan Pengguna (Manual Book v9.6)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Panduan operasional standar SimKas Pondok Pesantren Al Hidayah Tertek Pare, Kediri
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
        {[
          { id: 'umum', label: 'Ringkasan & Role', icon: BookOpen },
          { id: 'syahriyah', label: 'Iuran Syahriyah', icon: CalendarCheck },
          { id: 'kilatan', label: 'Iuran Kilatan', icon: Sparkles },
          { id: 'kas', label: 'Kas & Maker-Checker', icon: Wallet },
          { id: 'santri', label: 'Manajemen Santri', icon: UserCheck },
          { id: 'kuitansi', label: 'Kuitansi & Printer', icon: Printer },
          { id: 'shortcut', label: 'Shortcut Keyboard', icon: Keyboard },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeSection === item.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* 1. UMUM & ROLE */}
        {activeSection === 'umum' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              1. Struktur Pengguna & Hak Akses (Role-Based Access Control)
            </h3>
            <p>
              SimKas Pondok dirancang khusus untuk operasional jaringan internal (LAN) tanpa ketergantungan cloud. Sistem menerapkan pemisahan tugas ketat:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm block">Admin / Kepala Pondok</span>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-emerald-800 dark:text-emerald-300">
                  <li>Akses penuh ke seluruh modul sistem.</li>
                  <li>Otorisasi (Maker-Checker) Kas Keluar ≥ Rp 500.000.</li>
                  <li>Pembatalan transaksi pembayaran & kuitansi.</li>
                  <li>Pengelolaan pembebasan Syahriyah santri.</li>
                  <li>Pengaturan tarif, saldo awal, dan identitas pondok.</li>
                </ul>
              </div>

              <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                <span className="font-bold text-teal-900 dark:text-teal-200 text-sm block">Bendahara</span>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-teal-800 dark:text-teal-300">
                  <li>Mencatat pembayaran Syahriyah & Kilatan.</li>
                  <li>Mendaftarkan santri Kilatan baru via alur pembayaran.</li>
                  <li>Mengajukan Kas Keluar (maker pengeluaran).</li>
                  <li>Mencetak kuitansi dan menyalin teks WhatsApp.</li>
                  <li>Melihat laporan keuangan & rekapitulasi.</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-200 text-sm block">Sekretaris</span>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-blue-800 dark:text-blue-300">
                  <li>Mengelola data pokok santri dan nomor NIS.</li>
                  <li>Mencatat mutasi masuk dan tanggal keluar santri.</li>
                  <li>Mengimpor dan mengekspor data santri ke CSV.</li>
                  <li><strong>TIDAK MEMILIKI AKSES</strong> terhadap data keuangan & kas.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. SYAHRIYAH */}
        {activeSection === 'syahriyah' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              2. Tata Kelola Iuran Syahriyah Bulanan
            </h3>
            
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">6 Status Pembayaran Resmi (Colorblind-Safe):</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 font-bold text-emerald-800">
                  ✓ Lunas: Terbayar penuh sesuai tarif
                </div>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 font-bold text-rose-800">
                  ✗ Belum Bayar: Belum ada pembayaran aktif
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 font-bold text-amber-800">
                  ! Sebagian: Terbayar sebagian dari tarif
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 font-bold text-indigo-800">
                  ★ Bebas: Dibebaskan oleh kebijakan Admin
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 font-bold text-slate-700">
                  - Belum Masuk: Sebelum tanggal masuk santri
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 font-bold text-slate-500">
                  ○ Tidak Aktif: Antara tanggal keluar & aktif
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Aturan Alokasi Pembayaran Fleksibel:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Alokasi pembayaran dapat ditujukan ke bulan tunggakan, bulan berjalan, atau bulan ke depan mana pun tanpa batasan jumlah bulan.</li>
                <li>Alokasi boleh tidak berurutan (misal membayar bulan depan terlebih dahulu). Jika ada bulan <code>Belum Bayar</code> yang dilewati, sistem menampilkan konfirmasi peringatan.</li>
                <li>Total alokasi harus persis sama dengan nominal diterima. Tidak ada saldo mengambang atau deposit.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 3. KILATAN */}
        {activeSection === 'kilatan' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              3. Iuran Program Kilatan
            </h3>
            
            <p>
              Program Kilatan adalah iuran khusus kegiatan musiman pesantren dengan urutan baku:
            </p>
            <ol className="list-decimal list-inside font-bold space-y-1 text-slate-800 dark:text-slate-200">
              <li>Maulid</li>
              <li>Jumadil Ula</li>
              <li>Romadhon</li>
              <li>Dzulhijjah</li>
            </ol>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1">
              <span className="font-bold text-teal-900 dark:text-teal-200">Prinsip Keikutsertaan Berbasis Pembayaran:</span>
              <p>
                Santri tidak otomatis berstatus peserta Kilatan. Keikutsertaan hanya terbentuk secara otomatis saat pembayaran dicatat. Satu transaksi dan satu kuitansi hanya untuk satu santri dan satu program Kilatan.
              </p>
            </div>
          </div>
        )}

        {/* 4. KAS & MAKER-CHECKER */}
        {activeSection === 'kas' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              4. Buku Kas & Mekanisme Maker-Checker
            </h3>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Alur Maker-Checker Pengeluaran Kas:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Nominal &lt; Rp 500.000: Langsung <strong>Disetujui</strong> dan mengurangi saldo kas.</li>
                <li>Nominal ≥ Rp 500.000: Otomatis berstatus <strong>Menunggu Persetujuan</strong>. Saldo kas tidak berkurang sebelum disetujui Admin.</li>
                <li>Bendahara dapat membatalkan pengajuan miliknya selama masih menunggu.</li>
                <li>Admin dapat menyetujui atau menolak (penolakan wajib mengisi alasan).</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Prinsip Immutable (Tidak Ada Tombol Hapus):</h4>
              <p>
                Transaksi kas tidak dihapus permanen. Pembatalan dilakukan dengan status <code>Dibatalkan</code> dan wajib mengisi alasan pembatalan minimal 10 karakter.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Rumus Resmi Saldo Dana Tersisa:</span>
              <p className="font-mono mt-1 text-slate-800 dark:text-slate-200 font-bold">
                Dana Tersisa = Saldo Awal + Total Kas Masuk Aktif - Total Kas Keluar Disetujui
              </p>
            </div>
          </div>
        )}

        {/* 5. SANTRI */}
        {activeSection === 'santri' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              5. Manajemen Santri, Mutasi & Pengarsipan
            </h3>

            <ul className="list-disc list-inside space-y-1">
              <li><strong>Rekomendasi Tanggal Masuk:</strong> Tanggal masuk 1-15 direkomendasikan Syahriyah penuh. Tanggal masuk 16-akhir bulan direkomendasikan separuh.</li>
              <li><strong>Pencatatan Keluar:</strong> Admin atau Sekretaris memilih tanggal keluar serta opsi perlakuan iuran bulan keluar (penuh, separuh, atau bebas).</li>
              <li><strong>Aktif Kembali:</strong> Hanya Admin yang dapat mengaktifkan kembali. Syahriyah mulai ditagih pada bulan berikutnya setelah tanggal aktif kembali.</li>
              <li><strong>Pengarsipan:</strong> Menggunakan istilah <code>Arsipkan Santri</code>, bukan "Hapus Santri", untuk menjaga integritas riwayat keuangan.</li>
            </ul>
          </div>
        )}

        {/* 6. KUITANSI & PRINTER */}
        {activeSection === 'kuitansi' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              6. Kuitansi & Pengaturan Dual Printer
            </h3>

            <ul className="list-disc list-inside space-y-1">
              <li><strong>Format Penomoran:</strong> <code>AH/TAHUN/BULAN/NOMORURUT</code> (Otomatis, unik, reset tahunan).</li>
              <li><strong>Dual Printer Switcher:</strong> Mendukung format cetak Pos Thermal 58mm, Pos Thermal 80mm, dan Surat Standar A4.</li>
              <li><strong>Cetak Ulang:</strong> Kuitansi yang dicetak ulang otomatis memunculkan watermark <code>CETAK ULANG</code> dan nomor urut cetak ulang tercatat.</li>
              <li><strong>Salin Teks:</strong> Tombol "Salin Teks Kuitansi" menghasilkan format teks rapi siap kirim ke WhatsApp wali santri.</li>
              <li><strong>QR Code:</strong> Dilengkapi QR verifikasi kuitansi komputerisasi sah lembaga.</li>
            </ul>
          </div>
        )}

        {/* 7. SHORTCUT KEYBOARD */}
        {activeSection === 'shortcut' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              7. Daftar Shortcut Keyboard (Keyboard-First)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span>Fokus ke Pencarian Santri</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border rounded shadow-xs font-mono font-bold">/</kbd>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span>Tutup Modal / Dialog</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border rounded shadow-xs font-mono font-bold">Esc</kbd>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span>Kirim Form Pembayaran</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border rounded shadow-xs font-mono font-bold">Ctrl + Enter</kbd>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span>Pindah Field Input</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border rounded shadow-xs font-mono font-bold">Tab</kbd>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
