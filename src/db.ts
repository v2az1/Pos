import { 
  User, Product, Category, Customer, Supplier, 
  Sale, Purchase, Expense, LedgerEntry, ShopSettings, 
  BackupInfo, ActivityLog, HoldCart 
} from './types';

// Let's declare default mock data in case the user loads for the first time
const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Groceries', description: 'Daily household food items' },
  { id: 'cat-2', name: 'Beverages', description: 'Soft drinks, juices, soda, water' },
  { id: 'cat-3', name: 'Electronics', description: 'Mobile chargers, batteries, cords' },
  { id: 'cat-4', name: 'Cosmetics', description: 'Skins creams, soaps, face wash' },
  { id: 'cat-5', name: 'Medicines', description: 'Over-the-counter painkillers and vitamins' },
];

const defaultSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Metro Distributors', phone: '0300-1234567', address: 'Plot 45-C, Sector G, Karachi', email: 'metro@distributors.com', currentBalance: -15000 },
  { id: 'sup-2', name: 'Unilever Local Corp', phone: '0321-9876543', address: 'Industrial Area Phase II, Lahore', email: 'unilever@sales.com', currentBalance: 0 },
  { id: 'sup-3', name: 'Pak Pharma Suppliers', phone: '0333-5556667', address: 'Medical Row, Rawalpindi', email: 'pakpharma@gmail.com', currentBalance: 4000 },
];

const defaultCustomers: Customer[] = [
  { id: 'cust-1', name: 'Walk-In Customer', phone: '0000-0000000', address: 'N/A', email: 'walkin@pos.com', cnic: '00000-0000000-0', openingBalance: 0, currentBalance: 0 },
  { id: 'cust-2', name: 'Kamran Shahzad', phone: '0312-3456789', address: 'DHA Phase 5, Karachi', email: 'kamran_shah@hotmail.com', cnic: '42101-1234567-3', openingBalance: 2000, currentBalance: 2500 },
  { id: 'cust-3', name: 'Ayesha Rahman', phone: '0345-4443322', address: 'Gulshan-e-Iqbal, Block 4, Karachi', email: 'ayesharahman@outlook.com', cnic: '42201-9876543-2', openingBalance: 0, currentBalance: -1200 },
  { id: 'cust-4', name: 'Zahid Mehmood', phone: '0322-7778899', address: 'Model Town, Block C, Lahore', email: 'zahid_m@gmail.com', cnic: '35202-1112223-1', openingBalance: 1500, currentBalance: 3500 },
];

const defaultProducts: Product[] = [
  { id: 'prod-1', name: 'Coca Cola 1.5 Litre', barcode: '5449000000996', sku: 'BEV-COKE-1.5', categoryId: 'cat-2', brand: 'Coca Cola', description: '1.5L PET bottle carbonated drink', costPrice: 110, salePrice: 150, wholesalePrice: 135, quantity: 45, minStock: 15, unit: 'Pcs', supplierId: 'sup-2', createdAt: '2026-06-01T12:00:00Z' },
  { id: 'prod-2', name: 'Sunsilk Black Shine Shampoo 200ml', barcode: '8901030753023', sku: 'COS-SUNS-200', categoryId: 'cat-4', brand: 'Sunsilk', description: 'Hair wash 200ml black shine active', costPrice: 280, salePrice: 380, wholesalePrice: 340, quantity: 24, minStock: 8, unit: 'Pcs', supplierId: 'sup-2', createdAt: '2026-06-01T12:05:00Z' },
  { id: 'prod-3', name: 'Knorr Noodles Chatpatta 1-Pack', barcode: '8964000100782', sku: 'GRO-KNOR-CHT', categoryId: 'cat-1', brand: 'Knorr', description: 'Instant wheat noodles chatpatta flavor', costPrice: 40, salePrice: 60, wholesalePrice: 52, quantity: 120, minStock: 25, unit: 'Pcs', supplierId: 'sup-1', createdAt: '2026-06-02T12:10:00Z' },
  { id: 'prod-4', name: 'Panadol Extend 665mg 100-Tabs', barcode: '5011019003301', sku: 'MED-PANA-EXT', categoryId: 'cat-5', brand: 'GSK', description: 'Paracetamol sustained release pain reliever', costPrice: 450, salePrice: 580, wholesalePrice: 520, quantity: 4, minStock: 10, unit: 'Box', supplierId: 'sup-3', createdAt: '2026-06-02T12:15:00Z' },
  { id: 'prod-5', name: 'Sensodyne Rapid Action Paste 70g', barcode: '5011019001123', sku: 'COS-SENS-70G', categoryId: 'cat-4', brand: 'Sensodyne', description: 'Sensivity relief toothpaste 70g', costPrice: 210, salePrice: 290, wholesalePrice: 260, quantity: 18, minStock: 5, unit: 'Pcs', supplierId: 'sup-3', createdAt: '2026-06-03T09:00:00Z' },
  { id: 'prod-6', name: 'National Chili Garlic Sauce 300g', barcode: '8964000122111', sku: 'GRO-NATL-CGS', categoryId: 'cat-1', brand: 'National Foods', description: 'Spicy dipping chili garlic sauce squeezy pack', costPrice: 160, salePrice: 210, wholesalePrice: 190, quantity: 38, minStock: 12, unit: 'Pcs', supplierId: 'sup-1', createdAt: '2026-06-03T10:00:00Z' },
  { id: 'prod-7', name: 'USB Charger Adapter 20W Type-C', barcode: '6971234567011', sku: 'ELE-CHG-20W', categoryId: 'cat-3', brand: 'Anker', description: 'Fast charging Wall charger White', costPrice: 850, salePrice: 1450, wholesalePrice: 1200, quantity: 15, minStock: 3, unit: 'Pcs', supplierId: 'sup-1', createdAt: '2026-06-04T11:00:00Z' },
];

const defaultExpenses: Expense[] = [
  { id: 'exp-1', title: 'June Shop Rent Payment', amount: 35000, category: 'Rent', date: '2026-06-05', notes: 'Paid to landlord Mr. Ahmed' },
  { id: 'exp-2', title: 'KElectric Bill May', amount: 18200, category: 'Electricity', date: '2026-06-10', notes: 'Paid online via bank' },
  { id: 'exp-3', title: 'Nayatel Internet Charges', amount: 3500, category: 'Internet', date: '2026-06-12', notes: 'Unlimited shop fiber line' },
];

// Helper to generate past dates
const getDateDaysAgo = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Create comprehensive sales history for past 7 days to seed the graphs!
const defaultSales: Sale[] = [
  {
    id: 'sale-1',
    invoiceNo: 'INV-2026-00001',
    customerId: 'cust-1',
    date: getDateDaysAgo(6) + 'T11:30:00Z',
    subtotal: 350,
    tax: 17.5,
    discount: 0,
    grandTotal: 367.5,
    paymentMethod: 'Cash',
    receivedAmount: 500,
    changeAmount: 132.5,
    notes: 'Urgent sale',
    items: [
      { productId: 'prod-1', name: 'Coca Cola 1.5 Litre', quantity: 1, salePrice: 150, costPrice: 110, total: 150 },
      { productId: 'prod-6', name: 'National Chili Garlic Sauce 300g', quantity: 1, salePrice: 210, costPrice: 160, total: 210 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-2',
    invoiceNo: 'INV-2026-00002',
    customerId: 'cust-2',
    date: getDateDaysAgo(5) + 'T14:45:00Z',
    subtotal: 1040,
    tax: 52,
    discount: 50,
    grandTotal: 1042,
    paymentMethod: 'JazzCash',
    receivedAmount: 1042,
    changeAmount: 0,
    notes: 'Paid via phone',
    items: [
      { productId: 'prod-2', name: 'Sunsilk Black Shine Shampoo 200ml', quantity: 2, salePrice: 380, costPrice: 280, total: 760 },
      { productId: 'prod-5', name: 'Sensodyne Rapid Action Paste 70g', quantity: 1, salePrice: 290, costPrice: 210, total: 290 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-3',
    invoiceNo: 'INV-2026-00003',
    customerId: 'cust-3',
    date: getDateDaysAgo(4) + 'T17:10:00Z',
    subtotal: 1450,
    tax: 72.5,
    discount: 100,
    grandTotal: 1422.5,
    paymentMethod: 'EasyPaisa',
    receivedAmount: 1500,
    changeAmount: 77.5,
    notes: 'Regular buyer',
    items: [
      { productId: 'prod-7', name: 'USB Charger Adapter 20W Type-C', quantity: 1, salePrice: 1450, costPrice: 850, total: 1450 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-4',
    invoiceNo: 'INV-2026-00004',
    customerId: 'cust-4',
    date: getDateDaysAgo(3) + 'T13:20:00Z',
    subtotal: 1220,
    tax: 61,
    discount: 0,
    grandTotal: 1281,
    paymentMethod: 'Bank Transfer',
    receivedAmount: 1281,
    changeAmount: 0,
    notes: 'Credited and cleared partially',
    items: [
      { productId: 'prod-4', name: 'Panadol Extend 665mg 100-Tabs', quantity: 2, salePrice: 580, costPrice: 450, total: 1160 },
      { productId: 'prod-3', name: 'Knorr Noodles Chatpatta 1-Pack', quantity: 1, salePrice: 60, costPrice: 40, total: 60 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-5',
    invoiceNo: 'INV-2026-00005',
    customerId: 'cust-1',
    date: getDateDaysAgo(2) + 'T18:00:00Z',
    subtotal: 780,
    tax: 39,
    discount: 20,
    grandTotal: 799,
    paymentMethod: 'Cash',
    receivedAmount: 1000,
    changeAmount: 201,
    notes: '',
    items: [
      { productId: 'prod-2', name: 'Sunsilk Black Shine Shampoo 200ml', quantity: 1, salePrice: 380, costPrice: 280, total: 380 },
      { productId: 'prod-5', name: 'Sensodyne Rapid Action Paste 70g', quantity: 1, salePrice: 290, costPrice: 210, total: 290 },
      { productId: 'prod-1', name: 'Coca Cola 1.5 Litre', quantity: 1, salePrice: 150, costPrice: 110, total: 150 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-6',
    invoiceNo: 'INV-2026-00006',
    customerId: 'cust-1',
    date: getDateDaysAgo(1) + 'T12:15:00Z',
    subtotal: 2900,
    tax: 145,
    discount: 150,
    grandTotal: 2895,
    paymentMethod: 'Card',
    receivedAmount: 2895,
    changeAmount: 0,
    notes: '',
    items: [
      { productId: 'prod-7', name: 'USB Charger Adapter 20W Type-C', quantity: 2, salePrice: 1450, costPrice: 850, total: 2900 },
    ],
    status: 'Completed',
  },
  {
    id: 'sale-7',
    invoiceNo: 'INV-2026-00007',
    customerId: 'cust-2',
    date: new Date().toISOString(), // Today!
    subtotal: 480,
    tax: 24,
    discount: 0,
    grandTotal: 504,
    paymentMethod: 'Cash',
    receivedAmount: 510,
    changeAmount: 6,
    notes: '',
    items: [
      { productId: 'prod-1', name: 'Coca Cola 1.5 Litre', quantity: 2, salePrice: 150, costPrice: 110, total: 300 },
      { productId: 'prod-3', name: 'Knorr Noodles Chatpatta 1-Pack', quantity: 3, salePrice: 60, costPrice: 40, total: 180 },
    ],
    status: 'Completed',
  },
];

const defaultPurchases: Purchase[] = [
  {
    id: 'pur-1',
    supplierId: 'sup-2',
    invoiceNo: 'BILL-10023',
    date: getDateDaysAgo(10),
    grandTotal: 15000,
    tax: 0,
    discount: 500,
    notes: 'Pre-ordered inventory for shampoo',
    items: [
      { productId: 'prod-2', name: 'Sunsilk Black Shine Shampoo 200ml', quantity: 50, costPrice: 280, total: 14000 },
      { productId: 'prod-1', name: 'Coca Cola 1.5 Litre', quantity: 15, costPrice: 110, total: 1650 },
    ],
  },
];

const defaultLedgers: LedgerEntry[] = [
  // Cash register initial balance tracking
  { id: 'ldg-1', accountType: 'cash', accountId: 'cash_register', type: 'debit', amount: 10000, balance: 10000, date: getDateDaysAgo(15), description: 'Opening Cash Float' },
  // Customer Balances
  { id: 'ldg-2', accountType: 'customer', accountId: 'cust-2', type: 'debit', amount: 2000, balance: 2000, date: getDateDaysAgo(15), description: 'Opening customer balance' },
  { id: 'ldg-3', accountType: 'customer', accountId: 'cust-3', type: 'credit', amount: 1200, balance: -1200, date: getDateDaysAgo(12), description: 'Opening prepay credit balance' },
  { id: 'ldg-4', accountType: 'customer', accountId: 'cust-4', type: 'debit', amount: 1500, balance: 1500, date: getDateDaysAgo(10), description: 'Opening customer balance' },
  // Supplier Balances
  { id: 'ldg-5', accountType: 'supplier', accountId: 'sup-1', type: 'credit', amount: 15000, balance: -15000, date: getDateDaysAgo(15), description: 'Outstanding purchase invoice' },
  { id: 'ldg-6', accountType: 'supplier', accountId: 'sup-3', type: 'debit', amount: 4000, balance: 4000, date: getDateDaysAgo(8), description: 'Prepayment for medicine box order' },
];

const defaultSettings: ShopSettings = {
  shopName: 'MashaAllah Super Mart',
  address: 'Shop # 4, Block 5, Gulshan Commercial, Karachi, Pakistan',
  phone: '021-34567890',
  logo: '', // We can use SVG in UI directly
  taxRate: 5, // 5% default
  currency: 'Rs.',
  receiptFooter: 'Thank you for shopping with us! Fresh Goods are non-refundable.',
  invoicePrefix: 'MSM',
  theme: 'light'
};

const defaultBackups: BackupInfo[] = [
  { id: 'bak-1', name: 'auto_backup_20260601.json', date: getDateDaysAgo(14) + ' 23:59:00', size: '12.4 KB', type: 'auto' },
  { id: 'bak-2', name: 'manual_pre_inventory.json', date: getDateDaysAgo(10) + ' 10:30:22', size: '14.1 KB', type: 'manual' },
  { id: 'bak-3', name: 'auto_backup_20260608.json', date: getDateDaysAgo(7) + ' 23:59:01', size: '15.8 KB', type: 'auto' },
];

const defaultActivityLogs: ActivityLog[] = [
  { id: 'log-1', action: 'System Setup', details: 'POS Local Database Initialized successfully', date: getDateDaysAgo(15) + ' 09:00:00' },
  { id: 'log-2', action: 'Bulk Import', details: 'Imported 7 initial retail products successfully', date: getDateDaysAgo(15) + ' 09:12:00' },
  { id: 'log-3', action: 'Login', details: 'Admin user logged in from local station', date: new Date().toISOString() },
];

const defaultUser: User = {
  id: 'user-admin',
  username: 'admin',
  passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // sha256 for 'admin' (or simple matching)
  lastLogin: new Date().toISOString()
};

// Database structure
export interface DBState {
  user: User;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  ledgers: LedgerEntry[];
  settings: ShopSettings;
  backups: BackupInfo[];
  holdCarts: HoldCart[];
  activityLogs: ActivityLog[];
  isLoggedIn: boolean;
}

const STORAGE_KEY = 'OFFLINE_POS_DATABASE';

export function getInitialDB(): DBState {
  return {
    user: defaultUser,
    categories: defaultCategories,
    products: defaultProducts,
    customers: defaultCustomers,
    suppliers: defaultSuppliers,
    sales: defaultSales,
    purchases: defaultPurchases,
    expenses: defaultExpenses,
    ledgers: defaultLedgers,
    settings: defaultSettings,
    backups: defaultBackups,
    holdCarts: [],
    activityLogs: defaultActivityLogs,
    isLoggedIn: false
  };
}

// Safe retrieval wrapper
export function getDB(): DBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First load, seed!
      const initial = getInitialDB();
      saveDB(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing localStorage database', e);
    // Return recovery structure
    return {
      user: defaultUser,
      categories: defaultCategories,
      products: defaultProducts,
      customers: defaultCustomers,
      suppliers: defaultSuppliers,
      sales: [],
      purchases: [],
      expenses: [],
      ledgers: [],
      settings: defaultSettings,
      backups: [],
      holdCarts: [],
      activityLogs: [],
      isLoggedIn: false
    };
  }
}

export type DBListener = (state: DBState) => void;
const listeners: DBListener[] = [];

export function subscribeDB(listener: DBListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}

function notifyDB(state: DBState) {
  listeners.forEach(l => {
    try {
      l(state);
    } catch (e) {
      console.error('Error notifying DB listener', e);
    }
  });
}

export function saveDB(state: DBState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyDB(state);
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

// Log action helper
export function addLog(action: string, details: string) {
  const db = getDB();
  const newLog: ActivityLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    action,
    details,
    date: new Date().toISOString()
  };
  db.activityLogs = [newLog, ...db.activityLogs].slice(0, 500); // limit to 500 logs
  saveDB(db);
}
