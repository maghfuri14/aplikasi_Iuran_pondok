import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Sparkles, 
  BookMarked, 
  FileText, 
  Settings as SettingsIcon, 
  HelpCircle,
  PlusCircle,
  Shield,
  CircleDot
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'santri' 
  | 'syahriyah' 
  | 'kilatan' 
  | 'kas' 
  | 'laporan' 
  | 'manual_book' 
  | 'pengaturan';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, setIsQuickPaymentOpen, cashSummary } = useApp();

  // Menu items filtering by role (PRD Section 3.2)
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'bendahara', 'sekretaris']
    },
    {
      id: 'santri' as NavTab,
      label: 'Data Santri',
      icon: Users,
      roles: ['admin', 'sekretaris'] // Bendahara does not manage santri directly
    },
    {
      id: 'syahriyah' as NavTab,
      label: 'Syahriyah (Bulanan)',
      icon: CalendarCheck,
      roles: ['admin', 'bendahara']
    },
    {
      id: 'kilatan' as NavTab,
      label: 'Iuran Kilatan',
      icon: Sparkles,
      roles: ['admin', 'bendahara']
    },
    {
      id: 'kas' as NavTab,
      label: 'Buku Kas & Jurnal',
      icon: BookMarked,
      roles: ['admin', 'bendahara'],
      badge: cashSummary.pendingKeluarCount > 0 ? cashSummary.pendingKeluarCount : undefined
    },
    {
      id: 'laporan' as NavTab,
      label: 'Laporan & Ekspor',
      icon: FileText,
      roles: ['admin', 'bendahara']
    },
    {
      id: 'manual_book' as NavTab,
      label: 'Manual Book',
      icon: HelpCircle,
      roles: ['admin', 'bendahara', 'sekretaris']
    },
    {
      id: 'pengaturan' as NavTab,
      label: 'Pengaturan',
      icon: SettingsIcon,
      roles: ['admin'] // Admin only
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const roleBadgeColor = {
    admin: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    bendahara: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    sekretaris: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
  }[currentUser.role];

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        
        {/* Quick Transaction Action Button (Admin & Bendahara only) */}
        {currentUser.role !== 'sekretaris' && (
          <button
            onClick={() => setIsQuickPaymentOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Catat Transaksi</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & LAN Offline indicator */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <CircleDot className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>LAN Offline Ready • No Cloud Dependency</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs uppercase">
              {currentUser.username.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-slate-400" />
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
