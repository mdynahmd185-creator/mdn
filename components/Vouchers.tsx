
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search, ReceiptText, Wallet, ArrowUpRight, ArrowDownLeft, Printer, X, FileDown, UserCheck, ShieldCheck, Share2, Coins, Globe, Phone, MapPin, Loader2, Sparkles, ImageIcon, Edit3, ChevronDown, User, Trash2, MoreVertical } from 'lucide-react';
import { AppData, Voucher, VoucherType } from '../types';

interface VouchersProps {
  data: AppData;
  onAdd: (voucher: Omit<Voucher, 'id' | 'number'>) => void;
  onUpdate: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  isGuest?: boolean;
}

const Vouchers: React.FC<VouchersProps> = ({ data, onAdd, onUpdate, onDeleteVoucher, isGuest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [type, setType] = useState<VoucherType>(VoucherType.RECEIPT);
  
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const systemCurrency = data.settings.currency || 'ر.س';
  const [selectedCurrency, setSelectedCurrency] = useState(systemCurrency);
  const voucherRef = useRef<HTMLDivElement>(null);

  const currencies = [
    { label: 'ريال سعودي', value: 'ر.س' },
    { label: 'ريال يمني', value: 'ر.ي' },
    { label: 'دولار أمريكي', value: '$' },
  ];

  useEffect(() => {
    if (editingVoucher) {
      setType(editingVoucher.type);
      setSelectedPersonId(editingVoucher.personId);
      setAmount(editingVoucher.amount.toString());
      setNotes(editingVoucher.notes || '');
      setSelectedCurrency(editingVoucher.currency || systemCurrency);
      
      const person = [...data.customers, ...data.suppliers].find(p => p.id === editingVoucher.personId);
      setPersonSearch(person?.name || '');
    }
  }, [editingVoucher, systemCurrency, data.customers, data.suppliers]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMenuId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amount) return;

    const voucherData = {
      date: editingVoucher ? editingVoucher.date : new Date().toISOString().split('T')[0],
      type,
      personId: selectedPersonId,
      amount: Number(amount),
      paymentMethod: editingVoucher?.paymentMethod || 'نقدي',
      notes,
      currency: selectedCurrency
    };

    if (editingVoucher) {
      onUpdate({ ...voucherData, id: editingVoucher.id, number: editingVoucher.number });
    } else {
      onAdd(voucherData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setSelectedPersonId('');
    setPersonSearch('');
    setAmount('');
    setNotes('');
    setSelectedCurrency(systemCurrency);
  };

  const handleDownloadPDF = () => {
    if (!voucherRef.current || !viewingVoucher) return;
    const opt = { margin: 10, filename: `voucher-${viewingVoucher.number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    (window as any).html2pdf().from(voucherRef.current).set(opt).save();
  };

  const filteredPeople = useMemo(() => {
    const list = type === VoucherType.RECEIPT ? data.customers : data.suppliers;
    return list.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase()));
  }, [data.customers, data.suppliers, type, personSearch]);

  const selectedPersonName = useMemo(() => {
    const person = [...data.customers, ...data.suppliers].find(p => p.id === selectedPersonId);
    return person?.name || '';
  }, [data.customers, data.suppliers, selectedPersonId]);

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`هل أنت متأكد من حذف السند رقم ${number}؟ سيتم عكس تأثيره على أرصدة الحسابات.`)) {
      onDeleteVoucher(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-700 dark:bg-slate-800 rounded-[2.5rem] border border-slate-600 dark:border-slate-700 p-8 flex flex-col lg:flex-row items-center gap-6 overflow-hidden relative shadow-sm print:hidden">
        <div className="flex-1 space-y-4 text-center lg:text-right z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><Coins className="w-3 h-3" /> إدارة السيولة</div>
          <h1 className="text-3xl font-black tracking-tight text-white">سندات <span className="text-emerald-500">القبض والصرف</span></h1>
          <p className="text-slate-300 dark:text-slate-400 text-sm font-bold max-w-md mx-auto lg:mx-0">وثق التدفقات النقدية بدقة متناهية من خلال أرصدة العملاء والموردين.</p>
        </div>
      </div>

      <div className="flex items-center justify-between print:hidden gap-4">
        <h2 className="text-2xl font-bold text-slate-100">سجل العمليات</h2>
        {!isGuest && (
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl shadow-lg font-bold active:scale-95 transition-transform"><Plus className="w-5 h-5" /> سند جديد</button>
        )}
      </div>

      <div className="bg-slate-700 dark:bg-slate-800 rounded-3xl border border-slate-600 dark:border-slate-700 shadow-sm overflow-hidden print:hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-800 dark:bg-slate-700/50">
              <tr className="text-slate-200">
                <th className="px-6 py-4 font-bold text-sm">رقم السند</th>
                <th className="px-6 py-4 font-bold text-sm">التاريخ</th>
                <th className="px-6 py-4 font-bold text-sm">النوع</th>
                <th className="px-6 py-4 font-bold text-sm">الطرف الآخر</th>
                <th className="px-6 py-4 font-bold text-sm">المبلغ</th>
                <th className="px-6 py-4 font-bold text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600 dark:divide-slate-700">
              {data.vouchers.map((v) => {
                const person = [...data.customers, ...data.suppliers].find(p => p.id === v.personId);
                return (
                  <tr key={v.id} className="hover:bg-slate-600 dark:hover:bg-slate-700 text-slate-100 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{v.number}</td>
                    <td className="px-6 py-4 text-sm font-bold">{v.date}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${v.type === VoucherType.RECEIPT ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>{v.type === VoucherType.RECEIPT ? 'قبض' : 'صرف'}</span></td>
                    <td className="px-6 py-4 font-black">{person?.name || '---'}</td>
                    <td className="px-6 py-4 font-black">{v.amount.toLocaleString()} {v.currency || systemCurrency}</td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === v.id ? null : v.id);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-90"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeMenuId === v.id && (
                        <div 
                          className="absolute left-6 top-1/2 -translate-y-1/2 z-[100] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            onClick={() => { setViewingVoucher(v); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-primary hover:bg-slate-800 transition-colors"
                          >
                            <Printer className="w-4 h-4" /> عرض وطباعة
                          </button>
                          {!isGuest && (
                            <>
                              <button 
                                onClick={() => { setEditingVoucher(v); setIsModalOpen(true); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-amber-500 hover:bg-slate-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" /> تعديل البيانات
                              </button>
                              <button 
                                onClick={() => { handleDelete(v.id, v.number); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-500 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> حذف المستند
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewingVoucher && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:static print:bg-slate-100">
          <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none printable-content">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between print:hidden">
              <h3 className="text-xl font-bold">معاينة السند</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="bg-accent text-white px-5 py-2.5 rounded-2xl font-bold active:scale-95 transition-transform"><FileDown className="w-4 h-4" /> تحميل PDF</button>
                <button onClick={() => window.print()} className="bg-primary text-white px-5 py-2.5 rounded-2xl font-bold active:scale-95 transition-transform"><Printer className="w-4 h-4" /> طباعة</button>
                <button onClick={() => setViewingVoucher(null)} className="p-2 hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div ref={voucherRef} className="relative p-14 space-y-12 bg-slate-900 text-slate-100 print:bg-white print:text-indigo-950 text-right" dir="rtl">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.03] print:opacity-[0.05] z-0">
                <span className="text-[12rem] font-black -rotate-45 uppercase tracking-[2rem] whitespace-nowrap">LEDGERPRO</span>
              </div>

              <div className="relative z-10 flex justify-between items-center border-b-8 border-primary pb-8">
                <div className="flex items-center gap-4">
                   {data.settings.logoUrl && <div className="w-16 h-16 bg-slate-800 print:bg-slate-50 rounded-xl p-2 border border-slate-700 print:border-slate-100"><img src={data.settings.logoUrl} className="w-full h-full object-contain" /></div>}
                   <div><h1 className="text-3xl font-black text-primary uppercase">{data.settings.shopName}</h1><p className="text-slate-500 font-bold text-sm">{data.settings.shopNameEn}</p></div>
                </div>
                <div className="text-left"><p className="text-sm font-black text-slate-500 uppercase">رقم المستند / NO</p><p className="text-4xl font-black font-mono text-slate-200 print:text-indigo-900">#{viewingVoucher.number}</p></div>
              </div>

              <div className="relative z-10 text-center"><span className="bg-slate-800 print:bg-slate-100 px-12 py-3 rounded-[2rem] font-black text-2xl uppercase shadow-sm">{viewingVoucher.type === VoucherType.RECEIPT ? 'سند قبض' : 'سند صرف'}</span></div>
              
              <div className="relative z-10 space-y-10 text-xl font-bold">
                <div className="border-b-2 border-slate-800 print:border-slate-100 pb-4 flex justify-between">
                  <span>التاريخ / Date:</span>
                  <span>{viewingVoucher.date}</span>
                </div>
                <div className="border-b-2 border-slate-800 print:border-slate-100 pb-4 flex justify-between">
                  <span>{viewingVoucher.type === VoucherType.RECEIPT ? 'استلمنا من' : 'صرفنا إلى'}:</span>
                  <span className="text-primary text-2xl font-black">
                    {[...data.customers, ...data.suppliers].find(p => p.id === viewingVoucher.personId)?.name || '---'}
                  </span>
                </div>
                <div className="border-b-2 border-slate-800 print:border-slate-100 pb-4 flex justify-between">
                  <span>المبلغ / Amount:</span>
                  <span className="text-primary font-black">{viewingVoucher.amount.toLocaleString()} {viewingVoucher.currency || systemCurrency}</span>
                </div>
                <div className="border-b-2 border-slate-800 print:border-slate-100 pb-4 flex justify-between text-indigo-900">
                  <span>وذلك عن / Remarks:</span>
                  <span>{viewingVoucher.notes || 'تسوية مالية'}</span>
                </div>
              </div>

              <div className="relative z-10 pt-20 flex justify-between text-center">
                <div className="w-48 border-t-2 border-slate-800 print:border-slate-100 pt-2">
                  <p className="text-sm font-black">توقيع المستلم</p>
                </div>
                <div className="w-48 border-t-2 border-slate-800 print:border-slate-100 pt-2">
                  <p className="text-sm font-black">توقيع المدير / الختم</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && !isGuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingVoucher ? 'تعديل السند' : 'إنشاء سند مالي'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-slate-700 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-xl">
                <button onClick={() => setType(VoucherType.RECEIPT)} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${type === VoucherType.RECEIPT ? 'bg-slate-800 text-primary' : 'text-slate-500'}`}>قبض</button>
                <button onClick={() => setType(VoucherType.PAYMENT)} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${type === VoucherType.PAYMENT ? 'bg-slate-800 text-rose-500' : 'text-slate-500'}`}>صرف</button>
              </div>
              
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الطرف المعني (بحث)</label>
                <div 
                  onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                  className="w-full px-5 py-3 rounded-xl bg-slate-900 font-bold text-white flex items-center justify-between cursor-pointer border border-transparent hover:border-primary/50"
                >
                  <span className={selectedPersonId ? "text-white" : "text-slate-500"}>
                    {selectedPersonName || "اختر الاسم..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isPersonDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isPersonDropdownOpen && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col max-h-64">
                    <div className="p-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ابحث بالاسم..." 
                        className="bg-transparent border-none outline-none text-sm font-bold text-white w-full"
                        value={personSearch}
                        onChange={(e) => setPersonSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {filteredPeople.length > 0 ? filteredPeople.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedPersonId(p.id);
                            setIsPersonDropdownOpen(false);
                          }}
                          className={`p-3 rounded-lg cursor-pointer font-bold text-xs transition-colors flex items-center gap-3 ${selectedPersonId === p.id ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                        >
                          <User className="w-4 h-4" />
                          {p.name}
                        </div>
                      )) : (
                        <div className="p-4 text-center text-slate-500 text-xs font-bold">لا توجد نتائج</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase mr-2">العملة</label>
                  <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-900 border-none font-bold text-white outline-none focus:ring-2 focus:ring-primary/50">
                    {currencies.map(c => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase mr-2">المبلغ</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-5 py-3 rounded-xl bg-slate-900 border-none text-xl font-black text-white outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">البيان</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="التفاصيل..." className="w-full px-5 py-3 rounded-xl bg-slate-900 border-none text-white resize-none h-24 font-bold outline-none focus:ring-2 focus:ring-primary/50"></textarea>
              </div>
              <button onClick={handleSubmit} disabled={!amount || !selectedPersonId} className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg disabled:opacity-30 active:scale-95 transition-transform mt-4">
                {editingVoucher ? 'تحديث السند' : 'تأكيد السند'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
