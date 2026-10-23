import { PaymentTransaction, Settings } from '../types';

export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const BULAN_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const KILATAN_PROGRAMS: Array<'Maulid' | 'Jumadil Ula' | 'Romadhon' | 'Dzulhijjah'> = [
  'Maulid',
  'Jumadil Ula',
  'Romadhon',
  'Dzulhijjah'
];

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${BULAN_NAMES[month] || ''} ${year}`;
    }
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
  } catch {
    return dateTimeStr;
  }
}

export function generateReceiptNumber(seq: number, date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const numStr = String(seq).padStart(4, '0');
  return `AH/${year}/${month}/${numStr}`;
}

export function terbilangRupiah(nominal: number): string {
  if (isNaN(nominal) || nominal <= 0) return 'Nol Rupiah';
  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function convert(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return (convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10)).trim();
    if (n < 200) return ('Seratus ' + convert(n - 100)).trim();
    if (n < 1000) return (convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100)).trim();
    if (n < 2000) return ('Seribu ' + convert(n - 1000)).trim();
    if (n < 1000000) return (convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000)).trim();
    if (n < 1000000000) return (convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000)).trim();
    return (convert(Math.floor(n / 1000000000)) + ' Milyar ' + convert(n % 1000000000)).trim();
  }
  
  return (convert(Math.floor(nominal)).trim().replace(/\s+/g, ' ') + ' Rupiah');
}

export function buildReceiptWhatsAppText(receipt: PaymentTransaction, settings: Settings): string {
  const line = '--------------------------------';
  
  let allocDetails = '';
  if (receipt.jenisIuran === 'Syahriyah') {
    const listSyahriyah = receipt.allocations.map(a => {
      const isLunas = a.nominal >= a.tarif;
      const statusStr = isLunas ? '[LUNAS]' : `[CICIL - Sisa Rp ${(a.tarif - a.nominal).toLocaleString('id-ID')}]`;
      return `• Syahriyah ${BULAN_NAMES[a.bulan - 1]} ${a.tahun}: ${formatRupiah(a.nominal)} ${statusStr}`;
    }).join('\n');

    let listFees = '';
    if (receipt.additionalFees && receipt.additionalFees.length > 0) {
      listFees = '\n' + receipt.additionalFees.map(f => `• ${f.nama}: ${formatRupiah(f.nominal)}`).join('\n');
    }
    allocDetails = listSyahriyah + listFees;
  } else {
    allocDetails = `• Program Kilatan ${receipt.kilatanProgram} (${receipt.periodeTahun}): ${formatRupiah(receipt.nominalTotal)}`;
  }

  return `*BUKTI PEMBAYARAN IURAN PONDOK*
*${settings.namaPondok.toUpperCase()}*
${settings.alamatPondok}
${line}
*No. Kuitansi :* ${receipt.nomorKuitansi}
*Status       :* ${receipt.status.toUpperCase()}
*Tanggal      :* ${formatDateIndo(receipt.tanggalTransaksi)}
*Nama Santri  :* ${receipt.santriNama}
*NIS          :* ${receipt.santriNis}
*Kategori     :* Santri ${receipt.santriKategori}
*Jenis Iuran  :* ${receipt.jenisIuran}
${line}
*Rincian Pembayaran Lengkap:*
${allocDetails}
${line}
*TOTAL BAYAR  :* ${formatRupiah(receipt.nominalTotal)}
*Terbilang    :* _${terbilangRupiah(receipt.nominalTotal)}_
*Metode       :* ${receipt.metode}
*Petugas      :* ${receipt.petugasUsername}
${line}
_Kuitansi sah dikeluarkan secara elektronik oleh SimKas PP Al Hidayah Tertek Pare, Kediri. Simpan bukti ini untuk arsip Anda._`;
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
