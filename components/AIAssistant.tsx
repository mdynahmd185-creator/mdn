
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, WifiOff, CheckCircle2, Loader2 } from 'lucide-react';
import { AppData, InvoiceType, PaymentMethod, InvoiceItem, VoucherType } from '../types';
import { getAIAssistance, controlTools } from '../services/geminiService';

interface Message { role: 'user' | 'ai'; content: string; isAction?: boolean; }
interface AIAssistantProps {
  data: AppData;
  isGuest?: boolean;
  actions: {
    addInventoryItem: (item: any) => void;
    updateInventoryItem: (item: any) => void;
    deleteInventoryItem: (id: string) => void;
    addPerson: (type: 'customer' | 'supplier', person: any) => void;
    linkPeople: (customerId: string, supplierId: string) => void;
    unlinkPeople: (personId: string, type: 'customer' | 'supplier') => void;
    settleAccounts: (customerId: string, supplierId: string) => void;
    addInvoice: (invoice: any) => void;
    addVoucher: (voucher: any) => void;
  };
}

const AIAssistant: React.FC<AIAssistantProps> = ({ data, actions, isGuest }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'مرحباً! أنا المحاسب الذكي. كيف يمكنني مساعدتك في استعراض حساباتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleToolCall = (fc: any) => {
    if (isGuest) return "عذراً، لا يمكنني تنفيذ هذه العملية في وضع الزائر (للقراءة فقط).";
    
    try {
      switch (fc.name) {
        case 'add_invoice':
          const isSale = fc.args.type === 'SALE';
          const person = (isSale ? data.customers : data.suppliers).find(p => p.name.includes(fc.args.personName));
          if (!person) return `عذراً، لم أجد الطرف المعني باسم ${fc.args.personName}`;

          const invoiceItems: InvoiceItem[] = [];
          let total = 0;
          for (const itemArg of fc.args.items) {
            const product = data.inventory.find(p => p.name.includes(itemArg.itemName));
            if (product) {
              const price = isSale ? product.salePrice : product.purchasePrice;
              const lineTotal = price * itemArg.quantity;
              total += lineTotal;
              invoiceItems.push({ id: Math.random().toString(36).substr(2, 9), itemId: product.id, name: product.name, quantity: itemArg.quantity, unitPrice: price, total: lineTotal });
            }
          }
          if (invoiceItems.length === 0) return "لم أتمكن من العثور على الأصناف المطلوبة.";

          actions.addInvoice({
            date: new Date().toISOString().split('T')[0],
            type: fc.args.type as InvoiceType,
            personId: person.id,
            items: invoiceItems,
            subtotal: total,
            discount: 0,
            total,
            paymentMethod: (fc.args.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
            notes: "تم الإنشاء بواسطة المساعد الذكي",
            currency: data.settings.currency
          });
          return `تم إنشاء فاتورة لـ "${person.name}" بقيمة إجمالية ${total.toLocaleString()}.`;

        default: return "عملية غير معروفة.";
      }
    } catch (e) { return "حدث خطأ أثناء تنفيذ العملية."; }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    try {
      const response = await getAIAssistance(userMsg, data);
      if (response) {
        let aiText = response.text || '';
        const calls = (response as any).candidates?.[0]?.content?.parts.filter((p: any) => p.functionCall);
        if (calls?.length > 0) {
          for (const part of calls) {
            const result = handleToolCall(part.functionCall);
            aiText += `\n\n📢 ${result}`;
          }
        }
        setMessages(prev => [...prev, { role: 'ai', content: aiText, isAction: calls?.length > 0 }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'عذراً، حدث خطأ في معالجة طلبك.' }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 h-32 flex items-center justify-between">
          <h2 className="text-2xl font-black text-indigo-950 dark:text-white">المساعد الذكي <Sparkles className="inline text-primary" /></h2>
          <Bot className="w-10 h-10 text-primary" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-slate-100 text-indigo-900 font-bold' : 'bg-primary text-white shadow-lg font-bold'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs animate-pulse text-slate-400">جاري المعالجة...</div>}
      </div>
      <div className="p-6 border-t border-slate-100 flex gap-4">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 px-6 py-4 rounded-xl bg-slate-50 outline-none font-bold text-indigo-950" placeholder={isGuest ? "اسأل عن أي معلومة في الحسابات..." : "اطلب إنشاء فاتورة أو جرد المخزون..."} />
        <button onClick={handleSend} className="p-4 bg-primary text-white rounded-xl"><Send className="w-6 h-6 rotate-180" /></button>
      </div>
    </div>
  );
};

export default AIAssistant;
