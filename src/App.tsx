/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastContainer } from './components/ToastContainer';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentModal } from './components/PaymentModal';
import { CancelModal } from './components/CancelModal';
import { SantriDetailModal } from './components/SantriDetailModal';
import { DashboardView } from './views/DashboardView';
import { SantriView } from './views/SantriView';
import { SyahriyahView } from './views/SyahriyahView';
import { KilatanView } from './views/KilatanView';
import { BukuKasView } from './views/BukuKasView';
import { LaporanView } from './views/LaporanView';
import { ManualBookView } from './views/ManualBookView';
import { PengaturanView } from './views/PengaturanView';
import { PaymentTransaction, KilatanProgram } from './types';

const MainAppContent: React.FC = () => {
  const { 
    currentUser, 
    activeReceipt, 
    setActiveReceipt,
    isQuickPaymentOpen,
    setIsQuickPaymentOpen,
    quickPaymentSantriId,
    setQuickPaymentSantriId,
    selectedSantriDetail,
    setSelectedSantriDetail,
    santriList
  } = useApp();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [cancelingTransaction, setCancelingTransaction] = useState<PaymentTransaction | null>(null);

  // Custom state for PaymentModal initial options
  const [paymentInitialTab, setPaymentInitialTab] = useState<'syahriyah' | 'kilatan'>('syahriyah');
  const [paymentInitialProgram, setPaymentInitialProgram] = useState<KilatanProgram>('Maulid');

  const [paymentInitialMonth, setPaymentInitialMonth] = useState<number | undefined>();
  const [paymentInitialYear, setPaymentInitialYear] = useState<number | undefined>();

  // Role access guardian: if currentTab is restricted for this role, bounce to dashboard
  useEffect(() => {
    if (currentUser.role === 'sekretaris') {
      if (['syahriyah', 'kilatan', 'kas', 'laporan', 'pengaturan'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else if (currentUser.role === 'bendahara') {
      if (['santri', 'pengaturan'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser.role, currentTab]);

  // Global Keyboard Shortcuts (PRD Section 15.3 & Manual Book):
  // '/' to focus search input, 'Escape' to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cancelingTransaction) {
          setCancelingTransaction(null);
        } else if (activeReceipt) {
          setActiveReceipt(null);
        } else if (isQuickPaymentOpen) {
          setIsQuickPaymentOpen(false);
          setQuickPaymentSantriId(undefined);
          setPaymentInitialMonth(undefined);
          setPaymentInitialYear(undefined);
        } else if (selectedSantriDetail) {
          setSelectedSantriDetail(null);
        }
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelingTransaction, activeReceipt, isQuickPaymentOpen, selectedSantriDetail]);

  const handleOpenPayment = (
    santriId?: string, 
    tab: 'syahriyah' | 'kilatan' = 'syahriyah', 
    prog: KilatanProgram = 'Maulid',
    month?: number,
    year?: number
  ) => {
    setQuickPaymentSantriId(santriId);
    setPaymentInitialTab(tab);
    setPaymentInitialProgram(prog);
    setPaymentInitialMonth(month);
    setPaymentInitialYear(year);
    setIsQuickPaymentOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      
      {/* Top Header */}
      <Header />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView 
              setCurrentTab={setCurrentTab}
              onOpenQuickPayment={() => handleOpenPayment(undefined, 'syahriyah')}
            />
          )}

          {currentTab === 'santri' && <SantriView />}

          {currentTab === 'syahriyah' && (
            <SyahriyahView 
              onOpenPaymentModal={(id, m, y) => handleOpenPayment(id, 'syahriyah', 'Maulid', m, y)}
            />
          )}

          {currentTab === 'kilatan' && (
            <KilatanView 
              onOpenPaymentModal={(id, prog) => handleOpenPayment(id, 'kilatan', prog)}
            />
          )}

          {currentTab === 'kas' && <BukuKasView />}

          {currentTab === 'laporan' && <LaporanView />}

          {currentTab === 'manual_book' && <ManualBookView />}

          {currentTab === 'pengaturan' && <PengaturanView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* GLOBAL MODAL 1: Kuitansi Preview, QR Code & Dual Printer */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onOpenCancelModal={(tx) => {
          setActiveReceipt(null);
          setCancelingTransaction(tx);
        }}
      />

      {/* GLOBAL MODAL 2: Catat Pembayaran (Syahriyah / Kilatan) */}
      <PaymentModal
        isOpen={isQuickPaymentOpen}
        onClose={() => {
          setIsQuickPaymentOpen(false);
          setQuickPaymentSantriId(undefined);
          setPaymentInitialMonth(undefined);
          setPaymentInitialYear(undefined);
        }}
        initialSantriId={quickPaymentSantriId}
        initialTab={paymentInitialTab}
        initialProgram={paymentInitialProgram}
        initialMonth={paymentInitialMonth}
        initialYear={paymentInitialYear}
      />

      {/* GLOBAL MODAL 3: Pembatalan Transaksi (Immutable Reason >= 10 chars) */}
      <CancelModal
        transaction={cancelingTransaction}
        onClose={() => setCancelingTransaction(null)}
        onSuccess={() => {
          setCancelingTransaction(null);
        }}
      />

      {/* GLOBAL MODAL 4: Detail Santri 👁️ */}
      <SantriDetailModal
        santri={selectedSantriDetail}
        onClose={() => setSelectedSantriDetail(null)}
        onPaySyahriyah={(id) => handleOpenPayment(id, 'syahriyah')}
        onPayKilatan={(id) => handleOpenPayment(id, 'kilatan')}
        onExitSantri={(s) => {
          // If user triggers exit from detail modal, switch to santri tab
          setCurrentTab('santri');
        }}
        onReactivateSantri={(s) => {
          setCurrentTab('santri');
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
