
import React, { useState, useRef } from 'react';
import { Store, Image as ImageIcon, Phone, Globe, MapPin, Save, ShieldCheck, Coins, CheckCircle2, Lock, Eye, EyeOff, Database, FileUp, FileDown, CalendarClock, Trash2, AlertTriangle, PlusCircle, Share2, Copy, Link as LinkIcon } from 'lucide-react';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: SettingsType) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onClear: () => void;
  isGuest?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onExport, onImport, onClear, isGuest }) => {
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mainCurrencies = [
    { label: 'ريال يمني', value: 'ر.ي' },
    { label: 'ريال سعودي', value: 'ر.س' },
    { label: 'دولار أمريكي', value: '$' },
  ];

  const backupIntervals = [
    { label: 'معطل', value: 'off' },
    { label: 'كل 12 ساعة', value: '12h' },
    { label: 'كل يوم', value: 'daily' },
    { label: 'كل أسبوع', value: 'weekly' },
    { label: 'كل شهر', value: 'monthly' },
    { label: 'كل سنة', value: 'yearly' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    if (isGuest) return;
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isGuest) return;
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImport(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const copyGuestLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('guest', 'true');
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      {/* قسم المشاركة والوصول - جديد */}
      <div className="bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-slate-700 bg-gradient-to-l from-indigo-500/10 to-transparent">
          <h2 className="text-2xl font-black flex items-center gap-3 text-white">
            المشاركة والوصول السريع
            <Share2 className="w-6 h-6 text-indigo-400" />
          </h2>
          <p className="text-slate-400 text-sm font-bold">شارك بياناتك مع الآخرين بأمان (للعرض فقط)</p>
        </div>
        <div className="p-8 lg:p-12">
          <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-700 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Eye className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h4 className="font-black text-lg text-white">رابط "وضع الزائر"</h4>
              <p className="text-xs text-slate-500 font-bold mt-1">
                هذا الرابط يسمح لأصدقائك أو شركائك برؤية كافة الحسابات والتقارير ولكن <span className="text-rose-400 underline">يمنعهم تماماً</span> من إضافة أو تعديل أي بيانات.
              </p>
            </div>
            <button 
              onClick={copyGuestLink}
              className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'}`}
            >
              {copied ? (
                <><CheckCircle2 className="w-5 h-5" /> تم النسخ!</>
              ) : (
                <><Copy className="w-5 h-5" /> نسخ رابط العرض</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* المنشأة والإعدادات العامة */}
      <div className="bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-slate-700 bg-gradient-to-l from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                إعدادات المنشأة
                <Store className="w-6 h-6 text-primary" />
              </h2>
              <p className="text-slate-400 text-sm font-bold">تخصيص الهوية البصرية والبيانات المالية</p>
            </div>
            {isSaved && (
              <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black animate-bounce">
                <ShieldCheck className="w-4 h-4" />
                تم الحفظ
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">اسم المحل (بالعربي)</label>
              <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} disabled={isGuest} className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold shadow-sm text-white disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Shop Name (English)</label>
              <input type="text" name="shopNameEn" value={formData.shopNameEn} onChange={handleChange} disabled={isGuest} dir="ltr" className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold shadow-sm text-white text-right disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">العملة الافتراضية</label>
              <div className="flex gap-3">
                <select name="currency" value={formData.currency} onChange={handleChange} disabled={isGuest} className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold shadow-sm text-white disabled:opacity-50">
                  {mainCurrencies.map(c => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                  {!mainCurrencies.some(c => c.value === formData.currency) && formData.currency && (
                    <option value={formData.currency}>{formData.currency} (عملة مخصصة)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                عملة مخصصة <PlusCircle className="w-3 h-3 text-primary" />
              </label>
              <input 
                type="text" 
                name="currency" 
                placeholder="أدخل رمز العملة (مثلاً: AED)" 
                value={formData.currency} 
                onChange={handleChange} 
                disabled={isGuest}
                className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold shadow-sm text-white disabled:opacity-50" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase">رابط الشعار (URL)</label>
              <div className="flex gap-3">
                <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} disabled={isGuest} className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold shadow-sm text-white text-sm disabled:opacity-50" />
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-slate-700" />}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-700">
            <h3 className="text-lg font-black flex items-center gap-3 text-white mb-6">
              <Lock className="w-5 h-5 text-primary" />
              حماية التطبيق
            </h3>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-100">تفعيل كلمة المرور</p>
                  <p className="text-xs text-slate-500">منع الوصول غير المصرح به للبيانات المالية</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isPasswordEnabled" checked={formData.isPasswordEnabled} onChange={handleChange} disabled={isGuest} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.isPasswordEnabled && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} disabled={isGuest} className="w-full px-6 py-4 rounded-2xl bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary font-bold text-white tracking-widest disabled:opacity-50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isGuest && (
            <button type="submit" className="w-full bg-primary text-white py-6 rounded-[1.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"><Save className="w-6 h-6" /> حفظ كافة الإعدادات</button>
          )}
        </form>
      </div>

      {/* إدارة البيانات (النسخ والاحتفاظ) */}
      <div className="bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-slate-700 bg-gradient-to-l from-emerald-500/10 to-transparent">
          <h2 className="text-2xl font-black flex items-center gap-3 text-white">
            إدارة البيانات والنسخ الاحتياطي
            <Database className="w-6 h-6 text-emerald-500" />
          </h2>
          <p className="text-slate-400 text-sm font-bold">حافظ على أمان بياناتك من الضياع</p>
        </div>

        <div className="p-8 lg:p-12 space-y-8">
          <div className="flex flex-col gap-6">
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-700 flex flex-col md:flex-row items-center text-center md:text-right gap-6 group hover:border-emerald-500/50 transition-colors w-full">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <FileDown className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-lg text-white">تصدير نسخة احتياطية</h4>
                <p className="text-xs text-slate-500 font-bold mt-1">تحميل ملف بكافة البيانات الحالية (المخزون، الفواتير، الحسابات)</p>
              </div>
              <button onClick={onExport} className="w-full md:w-auto bg-emerald-500/10 text-emerald-500 px-8 py-4 rounded-xl font-black hover:bg-emerald-500 hover:text-white transition-all">تحميل النسخة الآن</button>
            </div>

            {!isGuest && (
              <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-700 flex flex-col md:flex-row items-center text-center md:text-right gap-6 group hover:border-primary/50 transition-colors w-full">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <FileDown className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-lg text-white">استعادة من ملف</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">رفع ملف نسخة احتياطية سابقة لاستبدال البيانات الحالية</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto bg-primary/10 text-primary px-8 py-4 rounded-xl font-black hover:bg-primary hover:text-white transition-all">اختيار ملف الاستعادة</button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarClock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-bold text-slate-100">النسخ الاحتياطي التلقائي</p>
                    <p className="text-xs text-slate-500">تذكير دوري لتحميل نسخة من بياناتك</p>
                  </div>
                </div>
                <select name="autoBackupInterval" value={formData.autoBackupInterval} onChange={handleChange} disabled={isGuest} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white outline-none disabled:opacity-50">
                  {backupIntervals.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
             </div>
          </div>

          {!isGuest && (
            <div className="pt-8 border-t border-slate-700">
              <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center md:text-right">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-tight">منطقة الخطر: حذف كافة البيانات</h4>
                    <p className="text-xs text-rose-500/60 font-bold mt-1">هذا الإجراء سيقوم بتصفير كافة السجلات ولا يمكن التراجع عنه أبداً.</p>
                  </div>
                </div>
                <button onClick={onClear} className="w-full md:w-auto bg-rose-500 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-5 h-5" /> مسح كافة البيانات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
