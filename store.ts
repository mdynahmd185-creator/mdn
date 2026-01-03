
import { useState, useEffect } from 'react';
import { AppData, InventoryItem, Person, Invoice, InvoiceType, PaymentMethod, Voucher, VoucherType, Settings } from './types';

const STORAGE_KEY = 'smart_accountant_data';
const BACKUP_KEY = 'ledgerpro_auto_snapshot';

const defaultSettings: Settings = {
  shopName: 'ليدجر برو - المحاسب الذكي',
  shopNameEn: 'LedgerPro',
  logoUrl: 'https://i.ibb.co/Ld89H48f/ledgerpro-logo.png',
  phone: '+966 50 000 0000',
  website: 'www.ledgerpro.ai',
  address: 'الرياض، المملكة العربية السعودية',
  currency: 'ر.س',
  isPasswordEnabled: false,
  password: '',
  autoBackupInterval: 'daily',
  lastBackupTimestamp: Date.now()
};

const initialData: AppData = {
  inventory: [],
  customers: [],
  suppliers: [],
  invoices: [],
  vouchers: [],
  settings: defaultSettings
};

export const useStore = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialData,
          ...parsed,
          settings: { ...defaultSettings, ...(parsed.settings || {}) }
        };
      } catch (e) {
        return initialData;
      }
    }
    return initialData;
  });

  // تحديث البيانات وحفظ نسخة احتياطية تلقائية
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // حفظ نسخة "لقطة" دائمة كنسخة احتياطية
    if (data.inventory.length > 0 || data.invoices.length > 0 || data.vouchers.length > 0) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
    }
  }, [data]);

  const updateSettings = (newSettings: Settings) => {
    setData(prev => ({ ...prev, settings: newSettings }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `ledgerpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.inventory && parsed.settings) {
        setData(parsed);
        alert('تمت استعادة البيانات بنجاح!');
        window.location.reload();
      }
    } catch (e) { alert('خطأ في استيراد البيانات.'); }
  };

  const restoreFromAutoBackup = () => {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        setData(parsed);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const clearData = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة البيانات؟')) {
      localStorage.removeItem(STORAGE_KEY);
      // لا نحذف BACKUP_KEY هنا لنسمح بالاستعادة إذا لزم الأمر
      setData(initialData);
      window.location.reload();
    }
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setData(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
  };

  const updateInventoryItem = (updated: InventoryItem) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === updated.id ? updated : i)
    }));
  };

  const deleteInventoryItem = (id: string) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id)
    }));
  };

  const addPerson = (type: 'customer' | 'supplier', person: Omit<Person, 'id' | 'balance'>) => {
    const newPerson = { ...person, id: Date.now().toString(), balance: 0 };
    setData(prev => ({
      ...prev,
      [type === 'customer' ? 'customers' : 'suppliers']: [...prev[type === 'customer' ? 'customers' : 'suppliers'], newPerson]
    }));
  };

  const updatePerson = (type: 'customer' | 'supplier', updated: Person) => {
    const key = type === 'customer' ? 'customers' : 'suppliers';
    setData(prev => ({
      ...prev,
      [key]: prev[key].map(p => p.id === updated.id ? updated : p)
    }));
  };

  const linkPeople = (customerId: string, supplierId: string) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === customerId ? { ...c, linkedPersonId: supplierId } : c),
      suppliers: prev.suppliers.map(s => s.id === supplierId ? { ...s, linkedPersonId: customerId } : s)
    }));
  };

  const unlinkPeople = (personId: string, type: 'customer' | 'supplier') => {
    const person = (type === 'customer' ? data.customers : data.suppliers).find(p => p.id === personId);
    if (!person?.linkedPersonId) return;
    const linkedId = person.linkedPersonId;
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => (c.id === personId || c.id === linkedId) ? { ...c, linkedPersonId: undefined } : c),
      suppliers: prev.suppliers.map(s => (s.id === personId || s.id === linkedId) ? { ...s, linkedPersonId: undefined } : s)
    }));
  };

  const settleAccounts = (customerId: string, supplierId: string) => {
    setData(prev => {
      const customer = prev.customers.find(c => c.id === customerId);
      const supplier = prev.suppliers.find(s => s.id === supplierId);
      if (!customer || !supplier) return prev;

      const settlementAmount = Math.min(customer.balance, supplier.balance);
      if (settlementAmount <= 0) return prev;

      const today = new Date().toISOString().split('T')[0];
      const baseId = Date.now().toString();

      const voucher1: Voucher = { 
        id: baseId + '1', 
        number: `REC-${prev.vouchers.length + 5001}`, 
        date: today, 
        type: VoucherType.RECEIPT, 
        personId: customerId, 
        amount: settlementAmount, 
        paymentMethod: 'مقاصة', 
        notes: `تسوية مقاصة مع المورد: ${supplier.name}`,
        currency: prev.settings.currency
      };
      
      const voucher2: Voucher = { 
        id: baseId + '2', 
        number: `PAY-${prev.vouchers.length + 5002}`, 
        date: today, 
        type: VoucherType.PAYMENT, 
        personId: supplierId, 
        amount: settlementAmount, 
        paymentMethod: 'مقاصة', 
        notes: `تسوية مقاصة مع العميل: ${customer.name}`,
        currency: prev.settings.currency
      };

      return {
        ...prev,
        vouchers: [...prev.vouchers, voucher1, voucher2],
        customers: prev.customers.map(c => c.id === customerId ? { ...c, balance: c.balance - settlementAmount } : c),
        suppliers: prev.suppliers.map(s => s.id === supplierId ? { ...s, balance: s.balance - settlementAmount } : s)
      };
    });
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'number'>) => {
    setData(prev => {
      const newInvoice: Invoice = { 
        ...invoiceData, 
        id: Date.now().toString(), 
        number: `INV-${prev.invoices.length + 1001}` 
      };

      const updatedInventory = prev.inventory.map(item => {
        const invItem = newInvoice.items.find(ii => ii.itemId === item.id);
        if (invItem) {
          const qtyChange = newInvoice.type === InvoiceType.SALE ? -invItem.quantity : invItem.quantity;
          return { ...item, quantity: item.quantity + qtyChange };
        }
        return item;
      });

      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];

      if (newInvoice.paymentMethod === PaymentMethod.CREDIT) {
        if (newInvoice.type === InvoiceType.SALE) {
          updatedCustomers = updatedCustomers.map(c => 
            c.id === newInvoice.personId ? { ...c, balance: c.balance + newInvoice.total } : c
          );
        } else {
          updatedSuppliers = updatedSuppliers.map(s => 
            s.id === newInvoice.personId ? { ...s, balance: s.balance + newInvoice.total } : s
          );
        }
      }

      return { 
        ...prev, 
        invoices: [...prev.invoices, newInvoice],
        inventory: updatedInventory, 
        customers: updatedCustomers, 
        suppliers: updatedSuppliers 
      };
    });
  };

  const updateInvoice = (updated: Invoice) => {
    const old = data.invoices.find(i => i.id === updated.id);
    if (!old) return;

    setData(prev => {
      let stageInventory = prev.inventory.map(item => {
        const invItem = old.items.find(ii => ii.itemId === item.id);
        if (invItem) {
          const qtyChange = old.type === InvoiceType.SALE ? invItem.quantity : -invItem.quantity;
          return { ...item, quantity: item.quantity + qtyChange };
        }
        return item;
      });

      let stageCustomers = [...prev.customers];
      let stageSuppliers = [...prev.suppliers];
      if (old.paymentMethod === PaymentMethod.CREDIT) {
        if (old.type === InvoiceType.SALE) {
          stageCustomers = stageCustomers.map(c => c.id === old.personId ? { ...c, balance: c.balance - old.total } : c);
        } else {
          stageSuppliers = stageSuppliers.map(s => s.id === old.personId ? { ...s, balance: s.balance - old.total } : s);
        }
      }

      const finalInventory = stageInventory.map(item => {
        const invItem = updated.items.find(ii => ii.itemId === item.id);
        if (invItem) {
          const qtyChange = updated.type === InvoiceType.SALE ? -invItem.quantity : invItem.quantity;
          return { ...item, quantity: item.quantity + qtyChange };
        }
        return item;
      });

      if (updated.paymentMethod === PaymentMethod.CREDIT) {
        if (updated.type === InvoiceType.SALE) {
          stageCustomers = stageCustomers.map(c => c.id === updated.personId ? { ...c, balance: c.balance + updated.total } : c);
        } else {
          stageSuppliers = stageSuppliers.map(s => s.id === updated.personId ? { ...s, balance: s.balance + updated.total } : s);
        }
      }

      return {
        ...prev,
        invoices: prev.invoices.map(i => i.id === updated.id ? updated : i),
        inventory: finalInventory,
        customers: stageCustomers,
        suppliers: stageSuppliers
      };
    });
  };

  const deleteInvoice = (id: string) => {
    const inv = data.invoices.find(i => i.id === id);
    if (!inv) return;

    setData(prev => {
      const updatedInventory = prev.inventory.map(item => {
        const invItem = inv.items.find(ii => ii.itemId === item.id);
        if (invItem) {
          const qtyChange = inv.type === InvoiceType.SALE ? invItem.quantity : -invItem.quantity;
          return { ...item, quantity: item.quantity + qtyChange };
        }
        return item;
      });

      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];

      if (inv.paymentMethod === PaymentMethod.CREDIT) {
        if (inv.type === InvoiceType.SALE) {
          updatedCustomers = updatedCustomers.map(c => 
            c.id === inv.personId ? { ...c, balance: c.balance - inv.total } : c
          );
        } else {
          updatedSuppliers = updatedSuppliers.map(s => 
            s.id === inv.personId ? { ...s, balance: s.balance - inv.total } : s
          );
        }
      }

      return {
        ...prev,
        invoices: prev.invoices.filter(i => i.id !== id),
        inventory: updatedInventory,
        customers: updatedCustomers,
        suppliers: updatedSuppliers
      };
    });
  };

  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'number'>) => {
    setData(prev => {
      const newVoucher: Voucher = { 
        ...voucherData, 
        id: Date.now().toString(), 
        number: `${voucherData.type === VoucherType.RECEIPT ? 'REC' : 'PAY'}-${prev.vouchers.length + 5001}` 
      };

      const isCustomer = prev.customers.some(c => c.id === voucherData.personId);
      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];

      if (isCustomer) {
        updatedCustomers = updatedCustomers.map(c => 
          c.id === voucherData.personId ? { ...c, balance: c.balance - voucherData.amount } : c
        );
      } else {
        updatedSuppliers = updatedSuppliers.map(s => 
          s.id === voucherData.personId ? { ...s, balance: s.balance - voucherData.amount } : s
        );
      }

      return {
        ...prev,
        vouchers: [...prev.vouchers, newVoucher],
        customers: updatedCustomers,
        suppliers: updatedSuppliers
      };
    });
  };

  const updateVoucher = (updated: Voucher) => {
    const old = data.vouchers.find(v => v.id === updated.id);
    if (!old) return;

    setData(prev => {
      const isCustomer = prev.customers.some(c => c.id === updated.personId);
      let stageCustomers = [...prev.customers];
      let stageSuppliers = [...prev.suppliers];

      if (isCustomer) {
        stageCustomers = stageCustomers.map(c => c.id === old.personId ? { ...c, balance: c.balance + old.amount } : c);
      } else {
        stageSuppliers = stageSuppliers.map(s => s.id === old.personId ? { ...s, balance: s.balance + old.amount } : s);
      }

      if (isCustomer) {
        stageCustomers = stageCustomers.map(c => c.id === updated.personId ? { ...c, balance: c.balance - updated.amount } : c);
      } else {
        stageSuppliers = stageSuppliers.map(s => s.id === updated.personId ? { ...s, balance: s.balance - updated.amount } : s);
      }

      return {
        ...prev,
        vouchers: prev.vouchers.map(v => v.id === updated.id ? updated : v),
        customers: stageCustomers,
        suppliers: stageSuppliers
      };
    });
  };

  const deleteVoucher = (id: string) => {
    const v = data.vouchers.find(voucher => voucher.id === id);
    if (!v) return;

    setData(prev => {
      const isCustomer = prev.customers.some(c => c.id === v.personId);
      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];

      if (isCustomer) {
        updatedCustomers = updatedCustomers.map(c => 
          c.id === v.personId ? { ...c, balance: c.balance + v.amount } : c
        );
      } else {
        updatedSuppliers = updatedSuppliers.map(s => 
          s.id === v.personId ? { ...s, balance: s.balance + v.amount } : s
        );
      }

      return {
        ...prev,
        vouchers: prev.vouchers.filter(item => item.id !== id),
        customers: updatedCustomers,
        suppliers: updatedSuppliers
      };
    });
  };

  return {
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
    restoreFromAutoBackup,
    clearData
  };
};
