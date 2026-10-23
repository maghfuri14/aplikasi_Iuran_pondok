import React from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Sidebar';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Sparkles, 
  BookMarked, 
  FileText, 
  HelpCircle,
  PlusCircle
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, setIsQuickPaymentOpen } = useApp();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'bendahara', 'sekretaris'] },
    { id: 'santri' as NavTab, label: 'Santri', icon: Users, roles: ['admin', 'sekretaris'] },
    { id: 'syahriyah' as NavTab, label: 'Syahriyah', icon: CalendarCheck, roles: ['admin', 'bendahara'] },
    { id: 'kilatan' as NavTab, label: 'Kilatan', icon: Sparkles, roles: ['admin', 'bendahara'] },
    { id: 'kas' as NavTab, label: 'Kas', icon: BookMarked, roles: ['admin', 'bendahara'] },
    { id: 'laporan' as NavTab, label: 'Laporan', icon: FileText, roles: ['admin', 'bendahara'] },
    { id: 'manual_book' as NavTab, label: 'Panduan', icon: HelpCircle, roles: ['admin', 'bendahara', 'sekretaris'] },
  ];

  const visible = navItems.filter(i => i.roles.includes(currentUser.role));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
      {visible.slice(0, 4).map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </button>
        );
      })}

      {currentUser.role !== 'sekretaris' && (
        <button
          onClick={() => setIsQuickPaymentOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 text-emerald-600 dark:text-emerald-400"
          title="Catat Transaksi"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium mt-0.5 text-slate-700 dark:text-slate-200">Bayar</span>
        </button>
      )}

      {visible.slice(4).map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
