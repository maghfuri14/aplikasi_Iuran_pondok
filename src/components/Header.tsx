import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  Moon, 
  Sun, 
  ShieldCheck, 
  Wallet, 
  BookOpen, 
  BellRing,
  Building2,
  Calendar
} from 'lucide-react';
import { formatDateIndo } from '../utils/formatters';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    switchUser, 
    darkMode, 
    setDarkMode, 
    cashSummary, 
    settings 
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                  SimKas Pondok
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  v9.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {settings.namaPondok} Pare, Kediri
              </p>
            </div>
          </div>

          {/* Right Action Tools & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Date Widget (Desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formatDateIndo(todayStr)}</span>
            </div>

            {/* Pending Approvals Alert Badge (Admin / Bendahara) */}
            {currentUser.role !== 'sekretaris' && cashSummary.pendingKeluarCount > 0 && (
              <div 
                title={`${cashSummary.pendingKeluarCount} pengeluaran menunggu persetujuan Admin`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-medium animate-pulse"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Persetujuan:</span>
                <span className="font-bold">{cashSummary.pendingKeluarCount}</span>
              </div>
            )}

            {/* Role Switcher Toolbar */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-2 hidden sm:inline uppercase tracking-wider">
                Role:
              </span>
              <button
                onClick={() => switchUser('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Beralih ke Admin / Kepala Pondok"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => switchUser('bendahara')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentUser.role === 'bendahara'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Beralih ke Bendahara Pondok"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Bendahara</span>
              </button>

              <button
                onClick={() => switchUser('sekretaris')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentUser.role === 'sekretaris'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Beralih ke Sekretaris Pondok (Data Santri)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sekretaris</span>
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
