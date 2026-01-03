
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Printer, FileDown, X, LayoutGrid, ImageIcon, ClipboardCheck, Tag, Barcode, Layers, ArrowDownUp, AlertTriangle } from 'lucide-react';
import { AppData, InventoryItem } from '../types';

interface InventoryProps {
  data: AppData;
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  isGuest?: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ data, onAdd, onUpdate, onDelete, isGuest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const systemCurrency = data.settings.currency || 'ر.س';

  const filteredItems = useMemo(() => {
    return data.inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.inventory, searchTerm]);

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    if (isGuest) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      salePrice: Number(formData.get('salePrice')),
      quantity: Number(formData.get('quantity')),
      minStockLevel: Number(formData.get('minStockLevel')),
    };

    if (editingItem) {
      onUpdate({ ...itemData, id: editingItem.id });
    } else {
      onAdd(itemData);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    const opt = {
      margin: 10,
      filename: `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    (window as any).html2pdf().from(printRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، SKU، أو الفئة..." 
              className="w-full pr-12 pl-4 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3.5 rounded-2xl font-black transition-all"
          >
            <Printer className="w-5 h-5" /> تقرير الجرد
          </button>
          {!isGuest && (
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> إضافة صنف
            </button>
          )}
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md border border-slate-700 rounded-[2rem] p-6 hover:border-primary/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Layers className="w-6 h-6" />
                </div>
                {!isGuest && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) onDelete(item.id); }}
                      className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
                <h3 className="text-lg font-black text-white truncate">{item.name}</h3>
                <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">سعر البيع</span>
                  <span className="text-sm font-black text-white">{item.salePrice.toLocaleString()} {systemCurrency}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50">
                  <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">الكمية</span>
                  <span className={`text-sm font-black ${item.quantity <= item.minStockLevel ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {item.quantity} {item.quantity <= item.minStockLevel && <AlertTriangle className="inline w-3 h-3 ml-1 mb-1" />}
                  </span>
                </div>
              </div>

              {item.quantity <= item.minStockLevel && (
                <div className="bg-rose-500/10 text-rose-500 text-[10px] font-black p-2 rounded-xl text-center mb-2 animate-pulse">
                  تنبيه: الكمية منخفضة جداً!
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-700">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
            <Search className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-black text-slate-400">لم يتم العثور على أي أصناف</h3>
          <p className="text-slate-500 font-bold mt-2">ابدأ بإضافة أول صنف لمخزنك الآن.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && !isGuest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-800 w-full max-w-2xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Plus className="text-primary" />
                {editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">اسم الصنف</label>
                  <input name="name" defaultValue={editingItem?.name} required placeholder="مثلاً: لابتوب ديل XPS" className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">رقم الصنف (SKU)</label>
                  <input name="sku" defaultValue={editingItem?.sku} required placeholder="SKU-001" className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-white uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الفئة / التصنيف</label>
                  <input name="category" defaultValue={editingItem?.category} required placeholder="إلكترونيات، أثاث..." className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">حد إعادة الطلب</label>
                  <input type="number" name="minStockLevel" defaultValue={editingItem?.minStockLevel || 5} required className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-700">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">سعر الشراء</label>
                  <input type="number" step="0.01" name="purchasePrice" defaultValue={editingItem?.purchasePrice} required className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">سعر البيع</label>
                  <input type="number" step="0.01" name="salePrice" defaultValue={editingItem?.salePrice} required className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الكمية الحالية</label>
                  <input type="number" name="quantity" defaultValue={editingItem?.quantity} required className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/50 font-bold text-white" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-700 text-white rounded-2xl font-black hover:bg-slate-600 transition-colors">إلغاء</button>
                <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Preview/Print Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-indigo-950 w-full max-w-5xl max-h-[95vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black flex items-center gap-2"><ClipboardCheck className="text-primary" /> معاينة تقرير الجرد</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  <FileDown className="w-4 h-4" /> تحميل PDF
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  <Printer className="w-4 h-4" /> طباعة
                </button>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div ref={printRef} className="p-12 space-y-10 overflow-y-auto bg-white printable-content text-indigo-950">
              <div className="flex justify-between items-start border-b-4 border-primary pb-8">
                <div className="flex gap-6 items-center">
                   {data.settings.logoUrl && <img src={data.settings.logoUrl} className="w-24 h-24 object-contain" />}
                   <div>
                    <h1 className="text-4xl font-black text-indigo-950 uppercase leading-none">{data.settings.shopName}</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">{data.settings.shopNameEn}</p>
                    <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">العنوان: {data.settings.address}</p>
                   </div>
                </div>
                <div className="text-right">
                  <div className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xl mb-4">تقرير جرد المخزون</div>
                  <p className="text-xs font-black text-slate-400">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 font-black text-sm">SKU</th>
                    <th className="p-4 font-black text-sm">اسم الصنف</th>
                    <th className="p-4 font-black text-sm">الفئة</th>
                    <th className="p-4 font-black text-sm text-center">الكمية</th>
                    <th className="p-4 font-black text-sm text-left">القيمة المقدرة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-sm">{item.sku}</td>
                      <td className="p-4 font-black">{item.name}</td>
                      <td className="p-4 text-indigo-900/60 font-bold">{item.category}</td>
                      <td className="p-4 text-center font-black">{item.quantity}</td>
                      <td className="p-4 text-left font-black text-primary">{(item.quantity * item.salePrice).toLocaleString()} {systemCurrency}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-900">
                    <td colSpan={3} className="p-6 font-black text-lg">إجمالي قيمة المخزون (سعر البيع):</td>
                    <td colSpan={2} className="p-6 text-left font-black text-3xl text-primary">
                      {data.inventory.reduce((acc, curr) => acc + (curr.quantity * curr.salePrice), 0).toLocaleString()} {systemCurrency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
