
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Truck, Printer, FileDown, X, Filter, Trash2, Globe, Phone, MapPin, Share2, Sparkles, Loader2, ImageIcon, Edit3, ChevronDown, User, MoreVertical, AlignRight } from 'lucide-react';
import { AppData, InvoiceType, PaymentMethod, InvoiceItem, Invoice } from '../types';

interface InvoicesProps {
  data: AppData;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'number'>) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  initialType?: InvoiceType;
  isGuest?: boolean;
}

const Invoices: React.FC<InvoicesProps> = ({ data, onAddInvoice, onUpdateInvoice, onDeleteInvoice, initialType, isGuest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const systemCurrency = data.settings.currency || 'ر.س';

  const [invoiceType, setInvoiceType] = useState<InvoiceType>(initialType || InvoiceType.SALE);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedCurrency, setSelectedCurrency] = useState(systemCurrency);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.total, 0);
  const calculateTotal = () => Math.max(0, calculateSubtotal() - discount);

  const currencies = [
    { label: 'ريال سعودي', value: 'ر.س' },
    { label: 'ريال يمني', value: 'ر.ي' },
    { label: 'دولار أمريكي', value: '$' },
  ];

  useEffect(() => {
    if (editingInvoice) {
      setInvoiceType(editingInvoice.type);
      setSelectedPersonId(editingInvoice.personId);
      setPaymentMethod(editingInvoice.paymentMethod);
      setSelectedCurrency(editingInvoice.currency || systemCurrency);
      setItems(editingInvoice.items);
      setDiscount(editingInvoice.discount);
      setInvoiceNotes(editingInvoice.notes || '');
      
      const person = [...data.customers, ...data.suppliers].find(p => p.id === editingInvoice.personId);
      setPersonSearch(person?.name || '');
    }
  }, [editingInvoice, systemCurrency, data.customers, data.suppliers]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMenuId]);

  const resetForm = () => {
    setEditingInvoice(null);
    setItems([]);
    setSelectedPersonId('');
    setPersonSearch('');
    setInvoiceNotes('');
    setDiscount(0);
    setSelectedCurrency(systemCurrency);
  };

  const addItem = (itemId: string) => {
    const inventoryItem = data.inventory.find(i => i.id === itemId);
    if (!inventoryItem) return;
    const existing = items.find(i => i.itemId === itemId);
    if (existing) {
      setItems(items.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      const price = invoiceType === InvoiceType.SALE ? inventoryItem.salePrice : inventoryItem.purchasePrice;
      setItems([...items, { id: Date.now().toString(), itemId, name: inventoryItem.name, quantity: 1, unitPrice: price, total: price }]);
    }
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates, total: (updates.quantity || i.quantity) * (updates.unitPrice || i.unitPrice) } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !selectedPersonId) return;

    const invoiceData = {
      date: editingInvoice ? editingInvoice.date : new Date().toISOString().split('T')[0],
      type: invoiceType,
      personId: selectedPersonId,
      items,
      subtotal: calculateSubtotal(),
      discount,
      total: calculateTotal(),
      paymentMethod,
      notes: invoiceNotes,
      currency: selectedCurrency
    };

    if (editingInvoice) {
      onUpdateInvoice({ ...invoiceData, id: editingInvoice.id, number: editingInvoice.number });
    } else {
      onAddInvoice(invoiceData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !viewingInvoice) return;
    const opt = { margin: 10, filename: `invoice-${viewingInvoice.number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    (window as any).html2pdf().from(invoiceRef.current).set(opt).save();
  };

  const filteredPeople = useMemo(() => {
    const list = invoiceType === InvoiceType.SALE ? data.customers : data.suppliers;
    return list.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase()));
  }, [data.customers, data.suppliers, invoiceType, personSearch]);

  const selectedPersonName = useMemo(() => {
    const person = [...data.customers, ...data.suppliers].find(p => p.id === selectedPersonId);
    return person?.name || '';
  }, [data.customers, data.suppliers, selectedPersonId]);

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة رقم ${number}؟ سيتم عكس تأثيرها على المخزون والأرصدة.`)) {
      onDeleteInvoice(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden gap-4">
        <h2 className="text-2xl font-bold text-slate-100">{initialType === InvoiceType.SALE ? 'فواتير المبيعات' : 'فواتير المشتريات'}</h2>
        {!isGuest && (
          <button onClick={() => { resetForm(); setInvoiceType(initialType || InvoiceType.SALE); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 rounded-xl shadow-lg font-bold transition-transform active:scale-95 flex items-center gap-2">
            <Plus className="w-5 h-5" /> إنشاء فاتورة
          </button>
        )}
      </div>

      <div className="bg-slate-700 dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-600 dark:border-slate-700 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-800 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-200">رقم الفاتورة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-200">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-200">الطرف الآخر</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-200">الإجمالي</th>
                <th className="px-6 py-4 text-sm font-bold text-center text-slate-200">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600 dark:divide-slate-700">
              {data.invoices.filter(i => !initialType || i.type === initialType).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-600 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{inv.number}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-300">{inv.date}</td>
                  <td className="px-6 py-4 font-black text-slate-100">{inv.type === InvoiceType.SALE ? data.customers.find(c => c.id === inv.personId)?.name : data.suppliers.find(s => s.id === inv.personId)?.name}</td>
                  <td className="px-6 py-4 font-black text-slate-100">{inv.total.toLocaleString()} {inv.currency || systemCurrency}</td>
                  <td className="px-6 py-4 text-center relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === inv.id ? null : inv.id);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenuId === inv.id && (
                      <div 
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-[100] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => { setViewingInvoice(inv); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-primary hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" /> عرض وطباعة
                        </button>
                        {!isGuest && (
                          <>
                            <button 
                              onClick={() => { setEditingInvoice(inv); setIsModalOpen(true); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-amber-500 hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" /> تعديل البيانات
                            </button>
                            <button 
                              onClick={() => { handleDelete(inv.id, inv.number); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-500 hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> حذف الفاتورة
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 text-slate-100 w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col printable-content">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between print:hidden">
              <h3 className="text-xl font-bold">معاينة الفاتورة</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="bg-accent text-white px-4 py-2 rounded-xl font-bold">PDF</button>
                <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-xl font-bold">طباعة</button>
                <button onClick={() => setViewingInvoice(null)} className="p-2 hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div ref={invoiceRef} className="relative p-12 space-y-8 bg-slate-900 text-slate-100 print:bg-white print:text-indigo-950 text-right" dir="rtl">
              <div className="flex justify-between items-start border-b-4 border-primary pb-8">
                <div className="flex gap-6 items-center">
                   {data.settings.logoUrl && <img src={data.settings.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />}
                   <div>
                    <h1 className="text-3xl font-black text-primary mb-1">{data.settings.shopName}</h1>
                    <p className="text-slate-500 font-bold text-xs">{data.settings.shopNameEn}</p>
                   </div>
                </div>
                <div className="text-left">
                  <div className="bg-primary text-white px-6 py-2 rounded-xl font-black text-xl mb-2">{viewingInvoice.type === InvoiceType.SALE ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}</div>
                  <div className="font-mono text-2xl font-black">#{viewingInvoice.number}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-800 print:border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">مقدمة إلى / TO:</p>
                  <p className="text-2xl font-black text-primary">
                    {viewingInvoice.type === InvoiceType.SALE 
                      ? data.customers.find(c => c.id === viewingInvoice.personId)?.name 
                      : data.suppliers.find(s => s.id === viewingInvoice.personId)?.name}
                  </p>
                  <p className="text-sm font-bold text-slate-400 mt-1">
                    {viewingInvoice.type === InvoiceType.SALE 
                      ? data.customers.find(c => c.id === viewingInvoice.personId)?.phone 
                      : data.suppliers.find(s => s.id === viewingInvoice.personId)?.phone}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">التاريخ / DATE:</p>
                  <p className="text-lg font-black">{viewingInvoice.date}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 mb-1">طريقة الدفع / PAYMENT:</p>
                  <p className="text-sm font-bold">{viewingInvoice.paymentMethod === PaymentMethod.CASH ? 'نقدي' : 'آجل'}</p>
                </div>
              </div>

              <table className="w-full text-right border-2 border-slate-800 print:border-slate-200">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-4">الصنف</th>
                    <th className="p-4 text-center">الكمية</th>
                    <th className="p-4 text-center">سعر الوحدة</th>
                    <th className="p-4 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 print:border-slate-100">
                      <td className="p-4 font-black">{item.name}</td>
                      <td className="p-4 text-center">{item.quantity}</td>
                      <td className="p-4 text-center">{item.unitPrice.toLocaleString()}</td>
                      <td className="p-4 text-left font-black">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="p-6 bg-slate-800/50 print:bg-slate-50 rounded-2xl border border-slate-700 print:border-slate-200">
                   <h4 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                     <AlignRight className="w-4 h-4" /> الملاحظات والبيان / Notes
                   </h4>
                   <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold text-slate-300 print:text-indigo-950">
                     {viewingInvoice.notes || 'لا توجد ملاحظات إضافية.'}
                   </p>
                </div>
                <div className="flex justify-end items-start">
                  <div className="w-full space-y-4 bg-slate-800 print:bg-slate-50 p-8 rounded-[2rem] border border-slate-700 print:border-slate-200">
                    <div className="flex justify-between text-slate-400"><span>الإجمالي الفرعي:</span><span>{viewingInvoice.subtotal.toLocaleString()}</span></div>
                    {viewingInvoice.discount > 0 && <div className="flex justify-between text-rose-500"><span>الخصم:</span><span>-{viewingInvoice.discount.toLocaleString()}</span></div>}
                    <div className="flex justify-between font-black text-3xl text-primary pt-4 border-t border-slate-700 print:border-slate-200"><span>المجموع:</span><span>{viewingInvoice.total.toLocaleString()} {viewingInvoice.currency || systemCurrency}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && !isGuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 text-slate-100 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingInvoice ? 'تعديل فاتورة' : 'إنشاء فاتورة'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-slate-700 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative">
                  <label className="block text-xs font-black text-slate-500 mb-2">الطرف الآخر (بحث)</label>
                  <div 
                    onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-900 font-bold text-white flex items-center justify-between cursor-pointer border border-transparent hover:border-primary/50"
                  >
                    <span className={selectedPersonId ? "text-white" : "text-slate-500"}>
                      {selectedPersonName || "اختر الاسم..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isPersonDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isPersonDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[80] overflow-hidden flex flex-col max-h-64">
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
                            className={`p-3 rounded-xl cursor-pointer font-bold text-sm transition-colors flex items-center gap-3 ${selectedPersonId === p.id ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-300'}`}
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

                <div><label className="block text-xs font-black text-slate-500 mb-2">طريقة الدفع</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-5 py-4 rounded-2xl bg-slate-900 font-bold text-white outline-none focus:ring-2 focus:ring-primary/50"><option value={PaymentMethod.CASH}>نقدي</option><option value={PaymentMethod.CREDIT}>آجل</option></select></div>
                
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">العملة</label>
                  <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-900 font-bold text-white outline-none focus:ring-2 focus:ring-primary/50">
                    {currencies.map(c => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                  </select>
                </div>

                <div><label className="block text-xs font-black text-slate-500 mb-2">إضافة صنف</label><select onChange={(e) => { if(e.target.value) addItem(e.target.value); e.target.value = ''; }} className="w-full px-5 py-4 rounded-2xl bg-primary text-white font-black cursor-pointer"><option value="">+ اختر صنفاً</option>{data.inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                   <label className="block text-xs font-black text-slate-500 mb-2">البيان / ملاحظات الفاتورة</label>
                   <textarea 
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    placeholder="أدخل أي ملاحظات أو تفاصيل إضافية هنا..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-900 font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
                   />
                </div>
                <div className="flex items-end pb-4">
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl w-full">
                    <p className="text-[10px] font-black text-primary uppercase mb-1">تلميح ذكي</p>
                    <p className="text-[9px] font-bold text-slate-400 leading-tight">سيتم حفظ هذا البيان وعرضه في كشف الحساب وعند طباعة الفاتورة.</p>
                  </div>
                </div>
              </div>

              <table className="w-full text-right bg-slate-900 rounded-2xl">
                <thead><tr className="border-b border-slate-800"><th className="p-4">الصنف</th><th className="p-4 text-center">الكمية</th><th className="p-4 text-left">الإجمالي</th><th></th></tr></thead>
                <tbody>{items.map(item => (<tr key={item.id} className="border-b border-slate-800"><td className="p-4 font-black">{item.name}</td><td className="p-4 text-center"><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-16 bg-slate-800 text-center rounded outline-none border border-slate-700 focus:border-primary" /></td><td className="p-4 text-left font-black">{item.total.toLocaleString()}</td><td className="p-4"><button onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4 text-rose-500 hover:scale-110 transition-transform" /></button></td></tr>))}</tbody>
              </table>
              <div className="bg-slate-900 p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center border border-slate-700 gap-4">
                <div className="space-y-1">
                  <p className="text-slate-400 text-sm">الإجمالي الفرعي: {calculateSubtotal().toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">خصم:</span>
                    <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 bg-slate-800 rounded px-2 py-1 text-sm font-bold text-rose-400 outline-none border border-slate-700" />
                  </div>
                  <div className="text-3xl font-black">المجموع النهائي: <span className="text-primary">{calculateTotal().toLocaleString()} {selectedCurrency}</span></div>
                </div>
                <button onClick={handleSubmit} disabled={items.length === 0 || !selectedPersonId} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg w-full md:w-auto active:scale-95 transition-transform disabled:opacity-50">
                  {editingInvoice ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
