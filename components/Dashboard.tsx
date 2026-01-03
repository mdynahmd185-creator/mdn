
import React, { useRef, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Wallet, ArrowUpRight, Activity, Sparkles, Printer, X, Landmark, Coins, Monitor, Cpu, Smartphone, Watch, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { AppData, InvoiceType } from '../types';

interface DashboardProps {
  data: AppData;
  onExport?: () => void;
  onImport?: (data: string) => void;
  isGuest?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onExport, onImport, isGuest }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const systemCurrency = data.settings.currency || 'ر.س';
  const [selectedCurrency, setSelectedCurrency] = useState(systemCurrency);

  const filteredInvoices = useMemo(() => {
    return data.invoices.filter(i => (i.currency || systemCurrency) === selectedCurrency);
  }, [data.invoices, selectedCurrency, systemCurrency]);

  const totalSales = useMemo(() => 
    filteredInvoices.filter(i => i.type === InvoiceType.SALE).reduce((acc, i) => acc + i.total, 0), 
  [filteredInvoices]);

  const totalPurchases = useMemo(() => 
    filteredInvoices.filter(i => i.type === InvoiceType.PURCHASE).reduce((acc, i) => acc + i.total, 0), 
  [filteredInvoices]);
  
  const realProfit = useMemo(() => {
    return filteredInvoices
      .filter(inv => inv.type === InvoiceType.SALE)
      .reduce((acc, inv) => {
        const costOfInvoice = inv.items.reduce((itemAcc, item) => {
          const invItem = data.inventory.find(i => i.id === item.itemId);
          return itemAcc + ((invItem?.purchasePrice || 0) * item.quantity);
        }, 0);
        return acc + (inv.total - costOfInvoice);
      }, 0);
  }, [filteredInvoices, data.inventory]);

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ${selectedCurrency}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { label: 'إجمالي المشتريات', value: `${totalPurchases.toLocaleString()} ${selectedCurrency}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
    { label: 'الربح التشغيلي', value: `${realProfit.toLocaleString()} ${selectedCurrency}`, icon: Activity, color: 'text-accent', bg: 'bg-accent/20' },
    { label: 'تنبيهات المخزون', value: data.inventory.filter(item => item.quantity <= item.minStockLevel).length.toString(), icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/20' },
  ];

  const copyGuestLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('guest', 'true');
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const salesData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      name: date,
      مبيعات: filteredInvoices
        .filter(inv => inv.date === date && inv.type === InvoiceType.SALE)
        .reduce((sum, inv) => sum + inv.total, 0),
      مشتريات: filteredInvoices
        .filter(inv => inv.date === date && inv.type === InvoiceType.PURCHASE)
        .reduce((sum, inv) => sum + inv.total, 0),
    }));
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 relative min-h-screen pb-20">
      <div className="relative z-10 space-y-6">
        
        {/* Welcome and Share Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-8 rounded-[2.5rem] border border-primary/20 overflow-hidden relative">
            <div className="relative z-10">
              <h1 className="text-3xl font-black text-white mb-2">
                مرحباً بك في ليدجر برو <span className="inline-block animate-hand-hero">👋</span>
              </h1>
              <p className="text-slate-300 font-bold max-w-lg">إليك ملخص سريع لأداء منشأتك المالي اليوم. يمكنك التبديل بين العملات لعرض التقارير المخصصة.</p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                  {['ر.ي', 'ر.س', '$'].map(curr => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${selectedCurrency === curr ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> تم التحديث الآن
                </div>
              </div>
            </div>
            <Cpu className="absolute -left-10 -bottom-10 w-64 h-64 text-primary/5 rotate-12" />
          </div>

          {/* Share Card - NEW */}
          {!isGuest && (
            <div className="bg-slate-800/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                <Share2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">شارك التطبيق</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">شارك بياناتك مع أصدقائك (للعرض فقط) دون الخوف من التعديل.</p>
              </div>
              <button 
                onClick={copyGuestLink}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'}`}
              >
                {copied ? <><CheckCircle2 className="w-5 h-5" /> تم نسخ رابط العرض</> : <><Copy className="w-5 h-5" /> نسخ رابط الزوار</>}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-700/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-600 dark:border-slate-700 hover:scale-[1.02] transition-transform cursor-default">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} overflow-hidden relative flex items-center justify-center min-w-[48px] min-h-[48px]`}>
                  {idx === 1 ? (
                    <div className="relative flex items-center justify-center">
                      <stat.icon className="w-6 h-6 animate-wallet-pop relative z-10" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-emerald-400 rounded-sm animate-money-dispense opacity-0 z-0"></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-emerald-300 rounded-full animate-money-dispense opacity-0 z-0 [animation-delay:0.5s]"></div>
                    </div>
                  ) : idx === 3 ? (
                    <div className="relative flex items-center justify-center">
                      <stat.icon className="w-6 h-6 animate-box-bounce relative z-10" />
                      <Smartphone className="absolute w-4 h-4 animate-pop-phone text-rose-400 z-0" />
                      <Monitor className="absolute w-4 h-4 animate-pop-monitor text-rose-400 z-0" />
                      <Watch className="absolute w-4 h-4 animate-pop-watch text-rose-400 z-0" />
                    </div>
                  ) : (
                    <stat.icon className={`w-6 h-6 ${idx === 0 ? 'animate-stretch-y' : ''}`} />
                  )}
                </div>
                <ArrowUpRight className={`w-4 h-4 text-slate-500`} />
              </div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-700/40 dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-600 dark:border-slate-700">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-primary" />
                تحليل المبيعات والمشتريات (7 أيام)
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-black">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> مبيعات</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> مشتريات</div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ fontWeight: '900' }}
                  />
                  <Area type="monotone" dataKey="مبيعات" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="مشتريات" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-700/40 dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-600 dark:border-slate-700">
             <h3 className="text-lg font-black flex items-center gap-2 text-white mb-8">
               <Landmark className="w-5 h-5 text-accent" />
               توزيع العمليات
             </h3>
             <div className="h-[250px] relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={[
                        { name: 'مبيعات', value: totalSales },
                        { name: 'مشتريات', value: totalPurchases }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-500 uppercase">المجموع</span>
                  <span className="text-xl font-black text-white">{(totalSales + totalPurchases).toLocaleString()}</span>
               </div>
             </div>
             <div className="mt-6 space-y-3">
               <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary"></div><span className="text-xs font-bold">المبيعات</span></div>
                 <span className="text-xs font-black">{totalSales > 0 ? ((totalSales/(totalSales+totalPurchases))*100).toFixed(0) : 0}%</span>
               </div>
               <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent"></div><span className="text-xs font-bold">المشتريات</span></div>
                 <span className="text-xs font-black">{totalPurchases > 0 ? ((totalPurchases/(totalSales+totalPurchases))*100).toFixed(0) : 0}%</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
