export type UserRole = 'admin' | 'bendahara' | 'sekretaris';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type SantriCategory = 'Mukim' | 'Nduduk' | 'Kilatan';
export type SantriStatus = 'Aktif' | 'Tidak Aktif' | 'Arsip';

export interface Santri {
  id: string;
  nis: string;
  nama: string;
  gender: 'L' | 'P';
  kategori: SantriCategory;
  status: SantriStatus;
  tanggalMasuk: string; // YYYY-MM-DD
  tanggalKeluar?: string; // YYYY-MM-DD
  perlakuanBulanKeluar?: 'penuh' | 'separuh' | 'bebas';
  tanggalAktifKembali?: string; // YYYY-MM-DD
  tanggalLahir?: string;
  alamat?: string;
  namaWali: string;
  kontakWali: string;
  foto?: string;
  catatan?: string;
  createdAt: string;
}

// 6 Status Syahriyah
export type SyahriyahStatus = 
  | 'lunas'        // ✓ Terbayar penuh
  | 'sebagian'     // ! Terbayar sebagian
  | 'belum_bayar'  // ✗ Belum ada pembayaran
  | 'bebas'        // ★ Dibebaskan oleh Admin
  | 'belum_masuk'  // - Sebelum tanggal masuk pertama
  | 'tidak_aktif'; // ○ Antara keluar dan aktif kembali

export interface SyahriyahExemption {
  id: string;
  santriId: string;
  bulan: number; // 1-12
  tahun: number;
  alasan: string; // Min 10 chars
  createdBy: string;
  createdAt: string;
}

export interface PaymentAllocation {
  bulan: number; // 1-12
  tahun: number;
  nominal: number;
  tarif: number;
}

export type PaymentMethod = 'Tunai' | 'Transfer Bank' | 'QRIS/E-Wallet';

export interface AdditionalFeePayment {
  feeId: string;
  nama: string;
  nominal: number;
}

export interface PaymentTransaction {
  id: string;
  nomorKuitansi: string; // AH/YYYY/MM/XXXX
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriKategori: SantriCategory;
  jenisIuran: 'Syahriyah' | 'Kilatan';
  kilatanProgram?: 'Maulid' | 'Jumadil Ula' | 'Romadhon' | 'Dzulhijjah';
  periodeTahun: number;
  nominalTotal: number;
  metode: PaymentMethod;
  buktiPembayaran?: string;
  allocations: PaymentAllocation[]; // for Syahriyah
  additionalFees?: AdditionalFeePayment[]; // for Iuran Tambahan
  tanggalTransaksi: string; // YYYY-MM-DD
  createdAt: string;
  petugasUsername: string;
  status: 'Aktif' | 'Batal';
  alasanBatal?: string;
  batalBy?: string;
  batalAt?: string;
  printCount: number;
  lastPrintAt?: string;
}

export type KilatanProgram = 'Maulid' | 'Jumadil Ula' | 'Romadhon' | 'Dzulhijjah';

export interface KilatanPeriod {
  program: KilatanProgram;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
}

export type CashType = 'masuk' | 'keluar';
export type CashStatus = 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';

export interface CashEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tipe: CashType;
  kategori: string;
  nominal: number;
  keterangan: string;
  status: CashStatus;
  sumber: 'Sistem Iuran' | 'Manual';
  paymentId?: string; // Terhubung ke PaymentTransaction jika Sistem Iuran
  dibuatOleh: string; // Username
  dibuatAt: string;
  disetujuiOleh?: string;
  disetujuiAt?: string;
  alasanTolak?: string;
  alasanBatal?: string;
  batalOleh?: string;
  batalAt?: string;
}

export interface IuranTambahan {
  id: string;
  nama: string;
  nominal: number;
  isWajib: boolean; // true = wajib, false = sukarela / opsional
  kategoriSantri: 'Semua' | 'Mukim' | 'Nduduk';
  keterangan?: string;
  isActive: boolean;
}

export interface Settings {
  // Kop Surat & Profil Lembaga
  namaPondok: string;
  subJudulPondok?: string;
  alamatPondok: string;
  teleponPondok: string;
  emailPondok?: string;
  websitePondok?: string;
  logoPondokUrl?: string;
  pimpinanPondok: string;
  bendaharaUtama: string;

  // Kebijakan Tarif & Iuran
  syahriyahMukim: number; // default 50000
  syahriyahNduduk: number; // default 25000
  kilatanTarif: {
    Kilatan: number; // 130000
    Mukim: number;   // 70000
    Nduduk: number;  // 70000
  };
  iuranTambahanList: IuranTambahan[];

  // Pengaturan Tampilan Kuitansi
  kuitansiFormatDefault?: '58mm' | '80mm' | 'a4';
  tampilkanLogoKuitansi?: boolean;
  tampilkanQRCodeKuitansi?: boolean;
  tampilkanPetugasKuitansi?: boolean;
  tampilkanCatatanKuitansi?: boolean;
  catatanKuitansiFootnote?: string;
  ukuranFontKuitansi?: 'Kecil' | 'Sedang' | 'Besar';
  warnaAksenKuitansi?: 'Emerald' | 'Navy' | 'Monokrom';

  // Otorisasi & Kas
  approvalThreshold: number; // default 500000
  saldoAwal: number;
  saldoAwalTerkunci: boolean;
  kategoriKasMasuk: string[];
  kategoriKasKeluar: string[];
}
