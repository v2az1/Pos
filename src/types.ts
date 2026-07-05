export interface User {
  id: string;
  username: string;
  passwordHash: string; // MD5/SHA256 client-side emulated or plaintext for offline simple security
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryId: string;
  brand: string;
  description: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice: number;
  quantity: number;
  minStock: number;
  unit: string; // e.g. Pcs, Kg, Ltr, Box
  supplierId: string;
  image?: string; // base64 or URL
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  cnic: string;
  openingBalance: number;
  currentBalance: number; // Positive means outer owe to us, or debit/credit tracker
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  currentBalance: number; // Positive/Negative tracker
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  invoiceNo: string;
  date: string;
  grandTotal: number;
  tax: number;
  discount: number;
  notes: string;
  items: PurchaseItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // individual item discount percentage or amount
  priceType: 'retail' | 'wholesale';
}

export interface HoldCart {
  id: string;
  customerId: string;
  items: CartItem[];
  notes: string;
  date: string;
  title: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string;
  date: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Mixed' | 'Credit';
  paymentDetails?: string;
  receivedAmount: number;
  changeAmount: number;
  notes: string;
  items: SaleItem[];
  status: 'Completed' | 'Returned';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Electricity' | 'Internet' | 'Salary' | 'Miscellaneous';
  date: string;
  notes: string;
}

export interface LedgerEntry {
  id: string;
  accountType: 'customer' | 'supplier' | 'cash';
  accountId: string; // customerId, supplierId, or 'cash_register'
  type: 'debit' | 'credit'; // debit increases asset, credit decreases, depending on perspective
  amount: number;
  balance: number;
  date: string;
  description: string;
}

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  logo: string; // base64
  taxRate: number; // e.g. 17 for 17%
  currency: string; // e.g. Rs. or $
  receiptFooter: string;
  invoicePrefix: string;
  theme: 'light' | 'dark';
  language?: 'en' | 'ur';
}

export interface BackupInfo {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'manual' | 'auto';
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  date: string;
}
