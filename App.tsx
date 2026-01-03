
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import People from './components/People';
import Invoices from './components/Invoices';
import Vouchers from './components/Vouchers';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import { useStore } from './store';
import { InvoiceType } from './types';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

const LoginGate: React.FC<{ 
  correctPass?: string; 
  onAuthenticated: () => void;
  shopName: string;
  logoUrl: string;
}> = ({ correctPass, onAuthenticated, shopName, logoUrl }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === correctPass) { onAuthenticated(); } else { setError(true); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden relative">
        <div className="p-10 relative z-10 space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
             <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
             </div>
             <div><h1 className="text-3xl font-black text-primary">{shopName}</h1><p className="text-indigo-900/60 font-bold text-xs uppercase tracking-widest mt-1">Smart Accounting System</p></div>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-900 dark:text-slate-400 border border-slate-100 dark:border-slate-700"><Lock className="w-3 h-3" /> نظام محمي بكلمة مرور</div>
            <form onSubmit={handleLogin} className="space-y-4">
               <div className="relative">
                 <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="أدخل كلمة المرور..." className={`w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 outline-none font-bold text-center text-xl tracking-widest text-indigo-950 dark:text-white ${error ? 'border-rose-500 animate-shake' : 'border-transparent focus:border-primary/20'}`} autoFocus />
                 {error && <div className="absolute -bottom-8 inset-x-0 text-rose-500 text-[10px] font-black flex items-center justify-center gap-1"><ShieldAlert className="w-3 h-3" /> كلمة مرور خاطئة!</div>}
               </div>
               <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-transform"><LogIn className="w-5 h-5" /> فتح التطبيق</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    data, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    addPerson, 
    updatePerson,
    linkPeople, 
    unlinkPeople, 
    settleAccounts, 
    addInvoice, 
    updateInvoice,
    deleteInvoice,
    addVoucher, 
    updateVoucher, 
    deleteVoucher,
    updateSettings, 
    exportData, 
    importData, 
    clearData 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // منطق وضع الزائر
  const isGuest = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guest') === 'true';
  }, []);

  const tabOrder = [
    'dashboard', 'inventory', 'sales-invoices', 'vouchers', 'ai', 'settings'
  ];

  useEffect(() => { 
    // إذا كان وضع الزائر مفعلاً، نتخطى بوابة تسجيل الدخول
    if (!data.settings.isPasswordEnabled || isGuest) { 
      setIsAuthenticated(true); 
    } 
  }, [data.settings.isPasswordEnabled, isGuest]);

  const handleNavigate = useCallback((newTab: string) => {
    if (newTab !== activeTab) {
      setHistory(prev => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  }, [activeTab]);

  const handleNextTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
      handleNavigate(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, handleNavigate]);

  const handlePrevTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex !== -1 && currentIndex > 0) {
      handleNavigate(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, handleNavigate]);

  const handleBack = useCallback(() => {
    if (history.length > 0) {
      const prevTab = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setActiveTab(prevTab);
    }
  }, [history]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onExport={exportData} onImport={importData} isGuest={isGuest} />;
      case 'inventory': return <Inventory data={data} onAdd={addInventoryItem} onUpdate={updateInventoryItem} onDelete={deleteInventoryItem} isGuest={isGuest} />;
      case 'sales-invoices': return <Invoices data={data} onAddInvoice={addInvoice} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} initialType={InvoiceType.SALE} isGuest={isGuest} />;
      case 'purchase-invoices': return <Invoices data={data} onAddInvoice={addInvoice} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} initialType={InvoiceType.PURCHASE} isGuest={isGuest} />;
      case 'customers': return <People data={data} type="customer" onAdd={addPerson} onUpdate={updatePerson} onLink={linkPeople} onUnlink={unlinkPeople} onSettle={settleAccounts} isGuest={isGuest} />;
      case 'suppliers': return <People data={data} type="supplier" onAdd={addPerson} onUpdate={updatePerson} onLink={linkPeople} onUnlink={unlinkPeople} onSettle={settleAccounts} isGuest={isGuest} />;
      case 'vouchers': return <Vouchers data={data} onAdd={addVoucher} onUpdate={updateVoucher} onDeleteVoucher={deleteVoucher} isGuest={isGuest} />;
      case 'ai': return (
        <AIAssistant 
          data={data} 
          isGuest={isGuest}
          actions={{ 
            addInventoryItem, 
            updateInventoryItem,
            deleteInventoryItem,
            addPerson, 
            linkPeople,
            unlinkPeople,
            settleAccounts, 
            addInvoice,
            addVoucher
          }} 
        />
      );
      case 'settings': return <Settings settings={data.settings} onUpdate={updateSettings} onExport={exportData} onImport={importData} onClear={clearData} isGuest={isGuest} />;
      default: return <Dashboard data={data} onExport={exportData} onImport={importData} isGuest={isGuest} />;
    }
  };

  if (data.settings.isPasswordEnabled && !isAuthenticated && !isGuest) {
    return <LoginGate correctPass={data.settings.password} onAuthenticated={() => setIsAuthenticated(true)} shopName={data.settings.shopName} logoUrl={data.settings.logoUrl} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleNavigate} 
      onBack={handleBack} 
      canGoBack={history.length > 0}
      isGuest={isGuest}
      onSwipeLeft={handlePrevTab}
      onSwipeRight={handleNextTab}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
