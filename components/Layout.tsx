
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Mic, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Bell,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Settings as SettingsIcon,
  WifiOff,
  CloudCheck,
  ArrowRight,
  Eye
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  isGuest?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onBack, 
  canGoBack, 
  isGuest,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Swipe logic refs
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 70;

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', shortLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: 'inventory', label: 'المخزون', shortLabel: 'المخزون', icon: Package },
    { id: 'sales-invoices', label: 'فواتير المبيعات', shortLabel: 'المبيعات', icon: ShoppingBag },
    { id: 'purchase-invoices', label: 'فواتير المشتريات', shortLabel: 'المشتريات', icon: ShoppingCart },
    { id: 'vouchers', label: 'السندات', shortLabel: 'السندات', icon: ReceiptText },
    { id: 'customers', label: 'العملاء', shortLabel: 'العملاء', icon: Users },
    { id: 'suppliers', label: 'الموردين', shortLabel: 'الموردين', icon: Truck },
    { id: 'ai', label: 'المساعد الذكي', shortLabel: 'اسأل AI', icon: Mic },
    { id: 'settings', label: 'الإعدادات', shortLabel: 'الإعدادات', icon: SettingsIcon },
  ];

  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-800 text-slate-100'}`}>
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-[70] w-72 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-slate-800 border-l border-slate-700'}
          shadow-2xl lg:shadow-none pt-safe
        `}>
          <div className="p-8 flex justify-between items-center">
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">
              LedgerPro
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-4 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300
                  ${activeTab === item.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/40 scale-[1.02]' 
                    : 'hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-400'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-bounce' : ''}`} />
                <span className="font-bold text-base">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className={`
            flex items-center justify-between px-6 h-20 pt-safe shrink-0
            ${isDarkMode ? 'bg-slate-900/90' : 'bg-slate-800/90'} backdrop-blur-xl
            border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-700'} z-50
          `}>
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-3 rounded-2xl bg-slate-700 dark:bg-slate-800 text-slate-300 active:scale-90 transition-transform"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {canGoBack && (
                <button 
                  onClick={onBack}
                  className="p-3 rounded-2xl bg-slate-700 dark:bg-slate-800 text-slate-300 active:scale-90 transition-transform border border-slate-600 dark:border-slate-700"
                  title="رجوع"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              )}

              <div className="hidden lg:block">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">LedgerPro Intelligent System</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">{menuItems.find(i => i.id === activeTab)?.label}</h2>
                  {!isOnline && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-500/30">
                      <WifiOff className="w-3 h-3" />
                      أوفلاين
                    </span>
                  )}
                  {isGuest && (
                    <span className="flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black border border-primary/30">
                      <Eye className="w-3 h-3" />
                      وضع العرض فقط
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                {isOnline ? <CloudCheck className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {isOnline ? 'متصل بالسحابة' : 'وضع العمل المحلي'}
                </span>
              </div>
              
              <button className="p-3 rounded-2xl bg-slate-700 dark:bg-slate-800 relative text-slate-400 group">
                <Bell className="w-5 h-5 animate-bell-ring" />
                <span className="absolute top-3 left-3 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-700 dark:border-slate-800"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-2xl bg-slate-700 dark:bg-slate-800 transition-all active:rotate-45"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-300" />}
              </button>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[2px]">
                <div className="w-full h-full rounded-2xl bg-slate-800 dark:bg-slate-900 flex items-center justify-center font-bold text-sm text-white">
                  {isGuest ? 'G' : 'L'}
                </div>
              </div>
            </div>
          </header>

          <main 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32 lg:pb-8 scroll-smooth overscroll-contain"
          >
            {isGuest && (
              <div className="max-w-7xl mx-auto mb-4 bg-primary/10 border border-primary/20 p-4 rounded-2xl text-primary text-center font-bold text-sm">
                مرحباً! أنت الآن في وضع الزائر. يمكنك استعراض جميع البيانات والتقارير ولكن لا يمكنك التعديل عليها.
              </div>
            )}
            <div className="max-w-7xl mx-auto page-transition">
              {children}
            </div>
          </main>

          <nav className={`
            lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pt-3 pb-safe
            ${isDarkMode ? 'bg-slate-900/95 border-t border-slate-800' : 'bg-slate-800/95 border-t border-slate-700'}
            backdrop-blur-2xl flex justify-around items-center rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
          `}>
            {menuItems.filter(item => ['dashboard', 'inventory', 'sales-invoices', 'vouchers', 'ai', 'settings'].includes(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex flex-col items-center gap-1 min-w-[50px] transition-all duration-300
                  ${activeTab === item.id ? 'text-primary scale-110' : 'text-slate-400'}
                  active:scale-95
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-300
                  ${activeTab === item.id ? 'bg-primary/10 animate-nav-pop' : 'bg-transparent'}
                `}>
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                </div>
                <span className={`text-[9px] font-black ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {item.shortLabel}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Layout;
