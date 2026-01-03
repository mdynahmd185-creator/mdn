
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Search, User, Users, Phone, MapPin, Mail, CreditCard, Printer, FileText, X, FileDown, Share2, ShieldCheck, Globe, Loader2, Sparkles, Info, Link, Unlink, ArrowRightLeft, Landmark, ReceiptText, Edit3, CheckCircle2, Calculator } from 'lucide-react';
import { AppData, Person, InvoiceType, VoucherType } from '../types';

// Added isGuest property to PeopleProps to resolve TS error in App.tsx
interface PeopleProps {
  data: AppData;
  type: 'customer' | 'supplier';
  onAdd: (type: 'customer' | 'supplier', person: Omit<Person, 'id' | 'balance'>) => void;
  onUpdate: (type: 'customer' | 'supplier', person: Person) => void;
  onLink: (customerId: string, supplierId: string) => void;
  onUnlink: (personId: string, type: 'customer' | 'supplier') => void;
  onSettle: (customerId: string, supplierId: string) => void;
  isGuest?: boolean;
}

// Added isGuest to the component props destructuring
const People: React.FC<PeopleProps> = ({ data, type, onAdd, onUpdate, onLink, onUnlink, onSettle, isGuest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<Person | null>(null);
  const [selectedForStatement, setSelectedForStatement] = useState<Person | null>(null);
  const currency = data.settings.currency || 'ر.س';
  
  const list = type === 'customer' ? data.customers : data.suppliers;
  const others = type === 'customer' ? data.suppliers : data.customers;
  
  const filteredList = list.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  const linkedPersonForStatement = useMemo(() => {
    if (!selectedForStatement?.linkedPersonId) return null;
    return others.find(o => o.id === selectedForStatement.linkedPersonId);
  }, [selectedForStatement, others]);

  const statementHistory = useMemo(() => {
    if (!selectedForStatement) return [];
    
    // تحديد جميع المعرفات المطلوب جلب حركاتها (الحالي + المرتبط إن وجد)
    const ids = [selectedForStatement.id];
    if (selectedForStatement.linkedPersonId) {
      ids.push(selectedForStatement.linkedPersonId);
    }

    const invoices = data.invoices.filter(inv => ids.includes(inv.personId));
    const vouchers = data.vouchers.filter(v => ids.includes(v.personId));
    
    const history = [
      ...invoices.map(inv => {
        // التحقق هل الفاتورة تخص العميل أم المورد
        const isCustomer = data.customers.some(c => c.id === inv.personId);
        const personName = isCustomer 
          ? data.customers.find(c => c.id === inv.personId)?.name 
          : data.suppliers.find(s => s.id === inv.personId)?.name;

        return { 
          id: inv.id, 
          date: inv.date, 
          desc: `${inv.type === InvoiceType.SALE ? 'فاتورة مبيعات' : 'فاتورة مشتريات'} #${inv.number} (${personName})`,
          // محاسبياً: مبيعات العميل مدين، مشتريات المورد دائن (بالنسبة لنا)
          debit: inv.type === InvoiceType.SALE ? inv.total : 0,
          credit: inv.type === InvoiceType.PURCHASE ? inv.total : 0
        };
      }),
      ...vouchers.map(v => {
        const isCustomer = data.customers.some(c => c.id === v.personId);
        const personName = isCustomer 
          ? data.customers.find(c => c.id === v.personId)?.name 
          : data.suppliers.find(s => s.id === v.personId)?.name;

        return {
          id: v.id,
          date: v.date,
          desc: `${v.notes || (v.type === VoucherType.RECEIPT ? 'سند قبض' : 'سند صرف')} (${personName})`,
          // محاسبياً: سند الصرف مدين (يقلل التزامنا أو يزيد مديونيتهم)، سند القبض دائن
          debit: v.type === VoucherType.PAYMENT ? v.amount : 0,
          credit: v.type === VoucherType.RECEIPT ? v.amount : 0
        };
      })
    ];

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedForStatement, data.invoices, data.vouchers, data.customers, data.suppliers]);

  const statementSummary = useMemo(() => {
    const sums = statementHistory.reduce((acc, curr) => ({
      debit: acc.debit + curr.debit,
      credit: acc.credit + curr.credit
    }), { debit: 0, credit: 0 });

    const netBalance = sums.debit - sums.credit;

    return { ...sums, netBalance };
  }, [statementHistory]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isGuest) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const personData = { 
      name: formData.get('name') as string, 
      phone: formData.get('phone') as string, 
      email: (formData.get('email') as string) || '', 
      address: (formData.get('address') as string) || ''
    };

    if (editingPerson) {
      onUpdate(type, { ...editingPerson, ...personData });
    } else {
      onAdd(type, personData);
    }
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleLink = (otherId: string) => {
    if (isGuest) return;
    if (isLinkModalOpen) {
      const customerId = type === 'customer' ? isLinkModalOpen.id : otherId;
      const supplierId = type === 'customer' ? otherId : isLinkModalOpen.id;
      onLink(customerId, supplierId);
      setIsLinkModalOpen(null);
    }
  };

  const handleSettle = (person: Person) => {
    if (isGuest) return;
    if (!person.linkedPersonId) return;
    const customerId = type === 'customer' ? person.id : person.linkedPersonId;
    const supplierId = type === 'customer' ? person.linkedPersonId : person.id;
    onSettle(customerId, supplierId);
  };

  const handleDownloadPDF = () => {
    if (!statementRef.current || !selectedForStatement) return;
    const opt = { 
      margin: 10, 
      filename: `statement-${selectedForStatement.name}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    (window as any).html2pdf().from(statementRef.current).set(opt).save();
  };

  const statementRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-700 dark:bg-slate-800 rounded-[2.5rem] border border-slate-600 dark:border-slate-700 p-8 flex flex-col lg:flex-row items-center gap-6 overflow-hidden relative shadow-sm">
        <div className="flex-1 space-y-4 text-center lg:text-right z-10">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Users className="w-3 h-3" />
            إدارة العلاقات والشركاء
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            قائمة <span className="text-primary">{type === 'customer' ? 'العملاء' : 'الموردين'}</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-slate-700 dark:bg-slate-800 p-4 rounded-2xl border border-slate-600 dark:border-slate-700 shadow-sm flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو رقم الهاتف..." 
            className="flex-1 bg-transparent border-none text-white outline-none font-bold" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        {/* Added isGuest check for adding a person button */}
        {!isGuest && (
          <button 
            onClick={() => { setEditingPerson(null); setIsModalOpen(true); }} 
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl shadow-lg shadow-primary/20 font-black active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> إضافة {type === 'customer' ? 'عميل' : 'مورد'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map((person) => {
          const linkedPerson = others.find(o => o.id === person.linkedPersonId);
          const netFinancialBalance = linkedPerson 
            ? (person.balance - linkedPerson.balance)
            : person.balance;

          return (
            <div key={person.id} className="bg-slate-700 dark:bg-slate-800 rounded-[2rem] border border-slate-600 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black bg-slate-800 text-primary border border-slate-600">
                    {person.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white group-hover:text-primary transition-colors">{person.name}</h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                      <Phone className="w-3 h-3" /> {person.phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  {/* Added isGuest check for editing a person button */}
                  {!isGuest && (
                    <button 
                      onClick={() => { setEditingPerson(person); setIsModalOpen(true); }} 
                      className="p-2 bg-slate-800 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      title="تعديل البيانات"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedForStatement(person)} 
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all"
                    title="كشف حساب موحد"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  {/* Added isGuest check for linking accounts */}
                  {!isGuest && (
                    person.linkedPersonId ? (
                      <button 
                        onClick={() => onUnlink(person.id, type)} 
                        className="p-2 bg-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        title="فك الارتباط"
                      >
                        <Unlink className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsLinkModalOpen(person)} 
                        className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                        title="ربط حساب"
                      >
                        <Link className="w-5 h-5" />
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                {linkedPerson && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">خيارات المقاصة:</span>
                      </div>
                      {/* Added isGuest check for settlement button */}
                      {!isGuest && (
                        <button 
                          onClick={() => handleSettle(person)}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black active:scale-90 transition-transform shadow-lg shadow-emerald-500/20"
                        >
                          تسوية المقاصة
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-emerald-500/10 pt-2 mt-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">رصيد الحساب المنفرد</span>
                      <span className="text-xs font-black font-mono text-slate-300">
                        {person.balance.toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-4 rounded-2xl bg-slate-800 dark:bg-slate-900 flex items-center justify-between font-bold border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-widest">
                    <CreditCard className="w-4 h-4" /> {linkedPerson ? 'الرصيد الصافي' : 'رصيد الحساب'}
                  </div>
                  <span className={`font-black text-lg font-mono ${netFinancialBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Math.abs(netFinancialBalance).toLocaleString()} <span className="text-[10px]">{currency}</span>
                    {linkedPerson && (
                       <span className="text-[8px] mr-1 opacity-60">({netFinancialBalance >= 0 ? 'مدين' : 'دائن'})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && !isGuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-[2.5rem] p-10 animate-in zoom-in-95 shadow-2xl border border-slate-700">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black">{editingPerson ? 'تعديل البيانات' : `إضافة ${type === 'customer' ? 'عميل' : 'مورد'}`}</h3>
               <button onClick={() => { setIsModalOpen(false); setEditingPerson(null); }} className="p-2 hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
             </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
                <input name="name" defaultValue={editingPerson?.name} required className="w-full px-6 py-4 rounded-2xl bg-slate-900 border-none text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">رقم الجوال</label>
                <input name="phone" defaultValue={editingPerson?.phone} required className="w-full px-6 py-4 rounded-2xl bg-slate-900 border-none text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">العنوان</label>
                <input name="address" defaultValue={editingPerson?.address} className="w-full px-6 py-4 rounded-2xl bg-slate-900 border-none text-white font-bold" />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4">
                {editingPerson ? 'تحديث البيانات' : 'تأكيد الإضافة'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {isLinkModalOpen && !isGuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-slate-700 bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black">ربط حساب: {isLinkModalOpen.name}</h3>
                <button onClick={() => setIsLinkModalOpen(null)} className="p-2 hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <p className="text-xs text-slate-400 font-bold">اختر {type === 'customer' ? 'مورد' : 'عميل'} لربطه بهذا الحساب لإجراء المقاصة.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {others.length > 0 ? others.map(other => (
                <button 
                  key={other.id}
                  onClick={() => handleLink(other.id)}
                  disabled={!!other.linkedPersonId}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${other.linkedPersonId ? 'bg-slate-900 opacity-50 border-slate-800' : 'bg-slate-900 hover:bg-slate-700 border-slate-700'}`}
                >
                  <div className="text-right">
                    <p className="font-bold text-white">{other.name}</p>
                    <p className="text-[10px] text-slate-500">{other.phone}</p>
                  </div>
                  {other.linkedPersonId ? <span className="text-[10px] text-rose-500 font-bold">مرتبط مسبقاً</span> : <Plus className="w-5 h-5 text-primary" />}
                </button>
              )) : (
                <div className="p-10 text-center text-slate-500 font-bold">لا يوجد {type === 'customer' ? 'موردين' : 'عملاء'} متاحين.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedForStatement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-indigo-950 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black flex items-center gap-2"><ReceiptText className="text-primary" /> {selectedForStatement.linkedPersonId ? 'كشف حساب موحد (مقاصة)' : 'كشف حساب تفصيلي'}</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="bg-accent text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2">
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => setSelectedForStatement(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div ref={statementRef} className="flex-1 overflow-y-auto p-12 space-y-10 bg-white printable-content text-right" dir="rtl">
              <div className="flex justify-between items-start border-b-4 border-primary pb-8">
                <div>
                   <h1 className="text-4xl font-black text-indigo-950 uppercase leading-none mb-2">{data.settings.shopName}</h1>
                   <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{data.settings.shopNameEn}</p>
                   <div className="mt-6 space-y-1">
                      <p className="text-sm font-black text-indigo-900">كشف حساب: <span className="text-primary">{selectedForStatement.name}</span></p>
                      {linkedPersonForStatement && (
                        <p className="text-[10px] text-slate-500 font-bold">يتضمن حركات الطرف المرتبط: <span className="text-emerald-600">{linkedPersonForStatement.name}</span></p>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
                   </div>
                </div>
                {data.settings.logoUrl && <img src={data.settings.logoUrl} className="w-24 h-24 object-contain" />}
              </div>

              <div className={`grid ${linkedPersonForStatement ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الحركات (مدين)</p>
                  <p className="text-xl font-black text-rose-500">{statementSummary.debit.toLocaleString()} <span className="text-[10px]">{currency}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الحركات (دائن)</p>
                  <p className="text-xl font-black text-emerald-500">{statementSummary.credit.toLocaleString()} <span className="text-[10px]">{currency}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الرصيد الصافي</p>
                  <p className="text-xl font-black text-indigo-950">
                    {Math.abs(statementSummary.netBalance).toLocaleString()} <span className="text-[10px]">{currency}</span>
                    <span className="text-[8px] block opacity-70 mt-1">({statementSummary.netBalance >= 0 ? 'مدين' : 'دائن'})</span>
                  </p>
                </div>
                {linkedPersonForStatement && (
                  <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-primary uppercase mb-1">حالة المركز المالي</p>
                    <p className="text-xs font-black text-indigo-900">
                      {statementSummary.netBalance > 0 ? 'مطالبة مالية من الطرفين' : 'التزام مالي للطرفين'}
                    </p>
                  </div>
                )}
              </div>

              {linkedPersonForStatement && (
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-3">
                  <Info className="w-4 h-4 text-primary" />
                  ملاحظة: هذا التقرير يدمج حركات الحسابين لإظهار المركز المالي الحقيقي (صافي المقاصة).
                </div>
              )}

              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-4 font-black text-xs">التاريخ</th>
                    <th className="p-4 font-black text-xs">البيان / التفاصيل (اسم الحساب)</th>
                    <th className="p-4 font-black text-xs text-center">مدين (+)</th>
                    <th className="p-4 font-black text-xs text-center">دائن (-)</th>
                    <th className="p-4 font-black text-xs text-left">الرصيد الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementHistory.map((row, idx) => {
                    const runningBalance = statementHistory
                      .slice(idx)
                      .reduce((sum, r) => {
                        return sum + (r.debit - r.credit);
                      }, 0);
                      
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-500">{row.date}</td>
                        <td className="p-4 font-black text-indigo-900">{row.desc}</td>
                        <td className="p-4 text-center font-black text-rose-500">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                        <td className="p-4 text-center font-black text-emerald-500">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                        <td className="p-4 text-left font-black text-indigo-950">{runningBalance.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default People;
