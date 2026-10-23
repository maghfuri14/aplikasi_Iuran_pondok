import React from 'react';
import { useApp } from '../context/AppContext';
import { Santri, PaymentTransaction } from '../types';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Eye,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { formatRupiah, formatDateIndo, BULAN_NAMES } from '../utils/formatters';

interface SantriDetailModalProps {
  santri: Santri | null;
  onClose: () => void;
  onPaySyahriyah?: (santriId: string) => void;
  onPayKilatan?: (santriId: string) => void;
  onExitSantri?: (santri: Santri) => void;
  onReactivateSantri?: (santri: Santri) => void;
}

export const SantriDetailModal: React.FC<SantriDetailModalProps> = ({
  santri,
  onClose,
  onPaySyahriyah,
  onPayKilatan,
  onExitSantri,
  onReactivateSantri
}) => {
  const { 
    currentUser, 
    transactions, 
    calculateSantriTunggakan, 
    setActiveReceipt 
  } = useApp();

  if (!santri) return null;

  const tunggakanInfo = calculateSantriTunggakan(santri.id);
  const santriTransactions = transactions.filter(t => t.santriId === santri.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {santri.nama}
                </h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                  santri.status === 'Aktif'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    : santri.status === 'Tidak Aktif'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300'
                }`}>
                  {santri.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                NIS: {santri.nis} • Santri {santri.kategori} ({santri.gender === 'L' ? 'Putra' : 'Putri'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Santri Data Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Masuk: <strong className="text-slate-900 dark:text-white">{formatDateIndo(santri.tanggalMasuk)}</strong></span>
              </div>
              {santri.tanggalKeluar && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar: <strong>{formatDateIndo(santri.tanggalKeluar)}</strong> (Bulan keluar: {santri.perlakuanBulanKeluar || 'penuh'})</span>
                </div>
              )}
              {santri.tanggalAktifKembali && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Aktif Kembali: <strong>{formatDateIndo(santri.tanggalAktifKembali)}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat: <strong className="text-slate-900 dark:text-white">{santri.alamat || '-'}</strong></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Wali: <strong className="text-slate-900 dark:text-white">{santri.namaWali}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Kontak: <strong className="text-slate-900 dark:text-white font-mono">{santri.kontakWali}</strong></span>
              </div>
            </div>
          </div>

          {/* Tunggakan Status Card */}
          {santri.kategori !== 'Kilatan' && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Status Tunggakan Syahriyah ({new Date().getFullYear()})</span>
                </h4>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  tunggakanInfo.totalTunggakan > 0
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {tunggakanInfo.totalTunggakan > 0 
                    ? `Tunggakan: ${formatRupiah(tunggakanInfo.totalTunggakan)}` 
                    : 'Tidak Ada Tunggakan'}
                </span>
              </div>

              {tunggakanInfo.bulanTunggakan.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tunggakanInfo.bulanTunggakan.map((item, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-mono"
                    >
                      {BULAN_NAMES[item.bulan - 1]} ({formatRupiah(item.sisa)})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seluruh iuran Syahriyah hingga bulan berjalan sudah lunas.
                </p>
              )}
            </div>
          )}

          {/* Payment History List */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Riwayat Pembayaran ({santriTransactions.length})
            </h4>

            {santriTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada transaksi pembayaran yang dicatat untuk santri ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80">
                {santriTransactions.map(tx => {
                  const isBatal = tx.status === 'Batal';
                  return (
                    <div 
                      key={tx.id} 
                      className={`p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isBatal ? 'opacity-60 bg-rose-50/20' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {tx.nomorKuitansi}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            isBatal 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDateIndo(tx.tanggalTransaksi)} • {tx.jenisIuran} {tx.kilatanProgram ? `(${tx.kilatanProgram})` : ''} • {tx.metode}
                        </p>
                        {isBatal && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                            Alasan batal: {tx.alasanBatal}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatRupiah(tx.nominalTotal)}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            setActiveReceipt(tx);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Lihat Kuitansi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            {/* Quick action: Exit / Reactivate */}
            {santri.status === 'Aktif' && onExitSantri && (
              <button
                onClick={() => {
                  onClose();
                  onExitSantri(santri);
                }}
                className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100"
              >
                Catat Tanggal Keluar
              </button>
            )}

            {santri.status === 'Tidak Aktif' && currentUser.role === 'admin' && onReactivateSantri && (
              <button
                onClick={() => {
                  onClose();
                  onReactivateSantri(santri);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl hover:bg-emerald-100"
              >
                Aktifkan Kembali Santri
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role !== 'sekretaris' && (
              <>
                {santri.kategori !== 'Kilatan' && onPaySyahriyah && (
                  <button
                    onClick={() => {
                      onClose();
                      onPaySyahriyah(santri.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar Syahriyah</span>
                  </button>
                )}

                {onPayKilatan && (
                  <button
                    onClick={() => {
                      onClose();
                      onPayKilatan(santri.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bayar Kilatan</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
