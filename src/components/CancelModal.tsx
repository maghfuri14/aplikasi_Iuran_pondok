import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentTransaction } from '../types';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface CancelModalProps {
  transaction: PaymentTransaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({ 
  transaction, 
  onClose,
  onSuccess 
}) => {
  const { cancelPayment, showToast } = useApp();
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;

  const charCount = alasan.trim().length;
  const isValid = charCount >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      showToast('Gagal: Alasan pembatalan minimal 10 karakter.', 'error');
      return;
    }

    setLoading(true);
    const res = cancelPayment(transaction.id, alasan);
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/60 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header with Red Warning */}
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base">
              Batalkan Transaksi Pembayaran
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Peringatan Pembatalan Permanen (Immutable)</span>
            </div>
            <p>
              Nomor kuitansi <span className="font-mono font-bold">{transaction.nomorKuitansi}</span> tidak akan dapat dipakai ulang. Kas Masuk terkait akan dibatalkan, dan status iuran santri akan dihitung ulang secara otomatis.
            </p>
          </div>

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p><span className="font-medium text-slate-900 dark:text-white">Santri:</span> {transaction.santriNama} ({transaction.santriNis})</p>
            <p><span className="font-medium text-slate-900 dark:text-white">Jenis Iuran:</span> {transaction.jenisIuran} {transaction.kilatanProgram ? `(${transaction.kilatanProgram})` : ''}</p>
            <p><span className="font-medium text-slate-900 dark:text-white">Total:</span> Rp {transaction.nominalTotal.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Alasan Pembatalan <span className="text-rose-500">*</span>
              </label>
              <span className={`font-mono text-[11px] ${charCount < 10 ? 'text-rose-500 font-bold' : 'text-emerald-500'}`}>
                {charCount}/10 karakter minimal
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Terjadi salah input nominal iuran oleh petugas kasir..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            {charCount > 0 && charCount < 10 && (
              <p className="text-[11px] text-rose-500">
                Alasan masih kurang {10 - charCount} karakter lagi.
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                isValid && !loading
                  ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-rose-600/20 cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Memproses...' : 'Konfirmasi Batalkan'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
