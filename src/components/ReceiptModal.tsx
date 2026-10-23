import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentTransaction } from '../types';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  AlertOctagon, 
  QrCode as QrIcon, 
  Building2, 
  FileText,
  RotateCw
} from 'lucide-react';
import { 
  formatRupiah, 
  formatDateIndo, 
  formatDateTimeIndo, 
  BULAN_NAMES, 
  buildReceiptWhatsAppText 
} from '../utils/formatters';
import QRCode from 'qrcode';

interface ReceiptModalProps {
  receipt: PaymentTransaction | null;
  onClose: () => void;
  onOpenCancelModal?: (receipt: PaymentTransaction) => void;
}

type PrinterPaperMode = '58mm' | '80mm' | 'a4';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  receipt, 
  onClose,
  onOpenCancelModal 
}) => {
  const { settings, currentUser, reprintReceipt, showToast } = useApp();
  const [paperMode, setPaperMode] = useState<PrinterPaperMode>(settings.kuitansiFormatDefault || '80mm');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const printContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!receipt) return;
    // Generate QR verification string
    const verificationText = `VERIFIKASI KUITANSI RESMI: ${receipt.nomorKuitansi} | Santri: ${receipt.santriNama} (${receipt.santriNis}) | Nominal: ${receipt.nominalTotal} | Status: ${receipt.status} | Lembaga: ${settings.namaPondok}`;
    QRCode.toDataURL(verificationText, {
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      }
    }).then(setQrDataUrl).catch(() => {});
  }, [receipt, settings.namaPondok]);

  // Ensure receipt preview always starts scrolled at the very top (Kop Surat) when opened or mode changed
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [receipt, paperMode]);

  if (!receipt) return null;

  const handleCopyWhatsApp = () => {
    const text = buildReceiptWhatsAppText(receipt, settings);
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Teks kuitansi berhasil disalin! Siap dikirim ke WhatsApp.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (receipt.status === 'Batal') {
      showToast('Gagal: Kuitansi batal tidak dapat dicetak ulang.', 'error');
      return;
    }

    // Call reprint counter update if it's already printed once
    if (receipt.printCount > 0) {
      reprintReceipt(receipt.id);
    } else {
      reprintReceipt(receipt.id);
    }

    // Trigger browser print
    window.print();
  };

  const isBatal = receipt.status === 'Batal';
  const isCetakUlang = (receipt.printCount || 0) > 0;

  // Font size class mapping
  const fontSizeClass = settings.ukuranFontKuitansi === 'Kecil' 
    ? 'text-[10px]' 
    : settings.ukuranFontKuitansi === 'Besar' 
    ? 'text-sm' 
    : 'text-xs';

  // Accent color mapping
  const accentTextClass = settings.warnaAksenKuitansi === 'Navy'
    ? 'text-indigo-900'
    : settings.warnaAksenKuitansi === 'Monokrom'
    ? 'text-slate-900'
    : 'text-emerald-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Kuitansi Pembayaran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {receipt.nomorKuitansi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Switcher (Dual Printer) */}
            <div className="bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg flex text-xs font-medium">
              <button
                onClick={() => setPaperMode('58mm')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  paperMode === '58mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Format Thermal Pos 58mm"
              >
                58mm
              </button>
              <button
                onClick={() => setPaperMode('80mm')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  paperMode === '80mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Format Thermal Pos 80mm"
              >
                80mm
              </button>
              <button
                onClick={() => setPaperMode('a4')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  paperMode === 'a4'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Format Standar A4 / Surat"
              >
                A4
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Preview Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100 dark:bg-slate-950 flex justify-center items-start">
          
          <div 
            ref={printContentRef}
            id="printable-receipt"
            className={`receipt-container relative bg-white text-slate-900 shadow-lg border border-slate-300 transition-all h-auto shrink-0 ${
              paperMode === '58mm' 
                ? `w-[280px] p-3 text-[11px] font-mono leading-tight` 
                : paperMode === '80mm'
                ? `w-[360px] p-4 ${fontSizeClass} font-mono leading-relaxed`
                : `w-[480px] p-6 ${fontSizeClass} font-sans leading-normal`
            }`}
          >
            {/* Watermark CETAK ULANG */}
            {isCetakUlang && !isBatal && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.14] rotate-[-30deg]">
                <span className="text-4xl font-black uppercase text-amber-600 border-4 border-amber-600 p-3 rounded-xl tracking-widest">
                  CETAK ULANG
                </span>
              </div>
            )}

            {/* Watermark BATAL */}
            {isBatal && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.22] rotate-[-25deg]">
                <span className="text-5xl font-black uppercase text-rose-600 border-6 border-rose-600 p-4 rounded-xl tracking-widest">
                  BATAL
                </span>
              </div>
            )}

            {/* Kop Pondok */}
            <div className="text-center pb-2.5 border-b-2 border-dashed border-slate-300">
              {settings.tampilkanLogoKuitansi !== false && settings.logoPondokUrl ? (
                <img 
                  src={settings.logoPondokUrl} 
                  alt="Logo Kop" 
                  className="w-10 h-10 mx-auto mb-1 object-contain"
                  onError={(e) => {
                    // fallback if img fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}

              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                {(!settings.logoPondokUrl || settings.tampilkanLogoKuitansi === false) && (
                  <Building2 className="w-4 h-4 text-emerald-700 inline" />
                )}
                <h4 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
                  {settings.namaPondok}
                </h4>
              </div>

              {settings.subJudulPondok && (
                <p className="text-[10px] font-semibold text-slate-700 mb-0.5">
                  {settings.subJudulPondok}
                </p>
              )}

              <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                {settings.alamatPondok}
              </p>
              <p className="text-[10px] text-slate-500">
                Telp: {settings.teleponPondok} {settings.emailPondok ? `| ${settings.emailPondok}` : ''}
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 space-y-1 text-slate-700 border-b border-dashed border-slate-200">
              <div className="flex justify-between">
                <span>No. Kuitansi:</span>
                <span className="font-bold text-slate-900">{receipt.nomorKuitansi}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDateIndo(receipt.tanggalTransaksi)}</span>
              </div>
              <div className="flex justify-between">
                <span>Santri / NIS:</span>
                <span className="font-semibold text-slate-900">{receipt.santriNama} ({receipt.santriNis})</span>
              </div>
              <div className="flex justify-between">
                <span>Kategori:</span>
                <span>Santri {receipt.santriKategori}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-medium">{receipt.metode}</span>
              </div>
              {settings.tampilkanPetugasKuitansi !== false && (
                <div className="flex justify-between">
                  <span>Petugas:</span>
                  <span>{receipt.petugasUsername}</span>
                </div>
              )}
              {isCetakUlang && (
                <div className="flex justify-between text-[10px] text-amber-700 italic">
                  <span>Status Cetak:</span>
                  <span>Cetak Ulang #{receipt.printCount}</span>
                </div>
              )}
            </div>

            {/* Item Allocation Details */}
            <div className="py-3 border-b-2 border-dashed border-slate-300">
              <div className="font-bold text-[11px] uppercase tracking-wider mb-2 text-slate-800">
                {receipt.jenisIuran === 'Syahriyah' ? 'Rincian Alokasi Syahriyah' : `Iuran Kilatan: ${receipt.kilatanProgram}`}
              </div>

              {receipt.jenisIuran === 'Syahriyah' ? (
                <div className="space-y-1.5">
                  {receipt.allocations.map((a, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-700">
                      <span>• Syahriyah {BULAN_NAMES[a.bulan - 1]} {a.tahun}</span>
                      <span className="font-mono font-medium">{formatRupiah(a.nominal)}</span>
                    </div>
                  ))}
                  {receipt.additionalFees && receipt.additionalFees.length > 0 && (
                    <div className="pt-1.5 border-t border-dashed border-slate-200 space-y-1">
                      {receipt.additionalFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700">
                          <span>• {fee.nama}</span>
                          <span className="font-mono font-medium">{formatRupiah(fee.nominal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center text-slate-700">
                  <span>• Program {receipt.kilatanProgram} {receipt.periodeTahun}</span>
                  <span className="font-mono font-medium">{formatRupiah(receipt.nominalTotal)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="py-3 border-b-2 border-slate-900 flex justify-between items-center font-bold">
              <span className="uppercase text-slate-900">Total Diterima:</span>
              <span className={`font-mono text-base ${accentTextClass}`}>{formatRupiah(receipt.nominalTotal)}</span>
            </div>

            {/* Verification QR Code & Signatures */}
            <div className="pt-3 flex items-center justify-between gap-2">
              {settings.tampilkanQRCodeKuitansi !== false ? (
                <div className="text-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Verifikasi" className="w-16 h-16 mx-auto border border-slate-200 p-0.5 rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400">
                      <QrIcon className="w-6 h-6" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-500 block mt-1">Scan Verifikasi</span>
                </div>
              ) : <div></div>}

              <div className="text-right text-[10px] space-y-0.5">
                <p className="text-slate-500">Pare, {formatDateIndo(receipt.tanggalTransaksi)}</p>
                <p className="font-semibold text-slate-700">Bendahara Pondok,</p>
                <div className="h-7"></div>
                <p className="font-bold underline text-slate-900">{settings.bendaharaUtama}</p>
              </div>
            </div>

            {/* Footer Note */}
            {settings.tampilkanCatatanKuitansi !== false && (
              <div className="mt-3 pt-2 border-t border-dotted border-slate-300 text-center text-[9px] text-slate-500 whitespace-pre-line">
                <p>{settings.catatanKuitansiFootnote || "Bukti pembayaran sah secara komputerisasi SimKas Pondok."}</p>
                {receipt.lastPrintAt && (
                  <p className="text-[8px] text-slate-400 mt-0.5 font-mono">
                    Terakhir dicetak: {formatDateTimeIndo(receipt.lastPrintAt)}
                  </p>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Tombol Salin Teks Kuitansi */}
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks Kuitansi'}</span>
            </button>

            {/* Tombol Batalkan Transaksi (Admin only) */}
            {currentUser.role === 'admin' && !isBatal && onOpenCancelModal && (
              <button
                onClick={() => onOpenCancelModal(receipt)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Batalkan Transaksi</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {/* Print Button */}
            {!isBatal ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isCetakUlang ? 'Cetak Ulang Kuitansi' : 'Cetak Kuitansi'}</span>
              </button>
            ) : (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                Kuitansi Batal (Tidak Dapat Dicetak)
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
