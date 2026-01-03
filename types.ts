
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT'
}

export enum InvoiceType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE'
}

export enum VoucherType {
  RECEIPT = 'RECEIPT', // سند قبض
  PAYMENT = 'PAYMENT'   // سند صرف
}

export interface InventoryItem {
  id: string;
  sku: string; // رقم الصنف
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel: number;
  currency?: string;
  imageUrl?: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number; 
  linkedPersonId?: string; // لربط العميل بمورد والعكس
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  type: InvoiceType;
  personId: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  currency?: string;
}

export interface Voucher {
  id: string;
  number: string;
  date: string;
  type: VoucherType;
  personId: string; // العميل أو المورد
  amount: number;
  paymentMethod: string;
  notes: string;
  currency?: string;
}

export interface Settings {
  shopName: string;
  shopNameEn: string;
  logoUrl: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  isPasswordEnabled: boolean;
  password?: string;
  autoBackupInterval: 'off' | '12h' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastBackupTimestamp?: number;
}

export interface AppData {
  inventory: InventoryItem[];
  customers: Person[];
  suppliers: Person[];
  invoices: Invoice[];
  vouchers: Voucher[];
  settings: Settings;
}
