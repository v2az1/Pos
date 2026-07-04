export type LanguageType = 'en' | 'ur';

export interface TranslationDictionary {
  dashboard: string;
  pos: string;
  products: string;
  sales: string;
  expenses: string;
  ledgers: string;
  reports: string;
  backups: string;
  settings: string;
  about: string;
  close_station: string;
  active_station: string;
  low_stock_warn: string;
  status: string;
  loading: string;
  invoice: string;
  date: string;
  customer: string;
  cashier_station: string;
  product_name: string;
  qty: string;
  price: string;
  total: string;
  subtotal: string;
  sales_tax: string;
  discount: string;
  discount_deduction: string;
  grand_total: string;
  paid_channels: string;
  received_amount: string;
  change_return: string;
  remarks: string;
  thank_you: string;
  walk_in: string;
  pos_offline: string;
  digital_invoice: string;
  thermal_58mm: string;
  thermal_80mm: string;
  standard_a4: string;
  close_receipt: string;
  save_bill: string;
  text_file: string;
  image_file: string;
  offline_device_friendly: string;
  print_thermal: string;
  close_receipt_view: string;
  search_barcodes: string;
  all_categories: string;
  retail: string;
  wholesale: string;
  out_of_stock: string;
  items_in_cart: string;
  clear_all: string;
  account_client: string;
  quick_add: string;
  hold_bill: string;
  hold_carts: string;
  tax_rate: string;
  payment_method: string;
  amount_received: string;
  change_due: string;
  order_remarks: string;
  checkout_order: string;
  hold_cart_title: string;
  hold_cart_desc: string;
  cancel: string;
  hold: string;
  software_parameters: string;
  configure_receipt: string;
  shop_branding: string;
  shop_title: string;
  shop_phone: string;
  physical_address: string;
  currency_symbol: string;
  invoice_prefix: string;
  default_tax: string;
  display_theme: string;
  receipt_footer: string;
  save_branding: string;
  language: string;
  select_language: string;
  english: string;
  urdu: string;
}

export const translations: Record<LanguageType, TranslationDictionary> = {
  en: {
    // Navigation / Sidebar
    dashboard: "Dashboard Overview",
    pos: "POS Terminal Invoicing",
    products: "Product Catalog",
    sales: "Sales Records Archive",
    expenses: "Expense Tracker",
    ledgers: "Financial Ledgers",
    reports: "Analytical Reports",
    backups: "Offline Backups",
    settings: "Store Parameters",
    about: "About & Developer",
    close_station: "Close Station",
    active_station: "STATION ACTIVE (OFFLINE)",
    low_stock_warn: "{count} Products are Out/Low Stock!",
    
    // Header
    status: "Status",
    loading: "Loading...",
    
    // Invoice / Receipt
    invoice: "Invoice",
    date: "Date",
    customer: "Customer",
    cashier_station: "Cashier Station",
    product_name: "Product Name",
    qty: "Qty",
    price: "Price",
    total: "Total",
    subtotal: "Subtotal",
    sales_tax: "Sales Tax",
    discount: "Discount",
    discount_deduction: "Discount Deduction",
    grand_total: "GRAND TOTAL",
    paid_channels: "Paid Channels",
    received_amount: "Received Amount",
    change_return: "Change Return Balance",
    remarks: "Remarks",
    thank_you: "Thank you for shopping",
    walk_in: "Walk-In",
    pos_offline: "POS built completely offline for MS Windows Systems.",
    digital_invoice: "Digital Invoice Print Station",
    thermal_58mm: "Thermal 58mm",
    thermal_80mm: "Thermal 80mm",
    standard_a4: "Standard A4 Sheet",
    close_receipt: "Close Receipt",
    save_bill: "Save Bill / Invoice to folder",
    text_file: "Text (.txt)",
    image_file: "Image (.png)",
    offline_device_friendly: "Offline Device Friendly: Instantly saves the invoice file directly to your downloads / tablet local folders.",
    print_thermal: "Print Thermal Voucher/A4",
    close_receipt_view: "Close Station Receipt View",
    
    // POS Terminal
    search_barcodes: "Search barcodes or write product name...",
    all_categories: "All Categories",
    retail: "Retail",
    wholesale: "Wholesale",
    out_of_stock: "Out of Stock",
    items_in_cart: "Items in Cart",
    clear_all: "Clear All",
    account_client: "Account Client",
    quick_add: "+ Quick Add",
    hold_bill: "Hold Bill",
    hold_carts: "Hold Carts",
    tax_rate: "Tax Rate",
    payment_method: "Payment Method",
    amount_received: "Amount Received",
    change_due: "Change Due",
    order_remarks: "Order Remarks / Ledger Notes",
    checkout_order: "Checkout & Save Order",
    hold_cart_title: "Hold Cart Title",
    hold_cart_desc: "Park this sale to retrieve it later",
    cancel: "Cancel",
    hold: "Hold",
    
    // Settings
    software_parameters: "Software Station Parameters",
    configure_receipt: "Configure receipt printout details, custom currency markers, and local credentials security.",
    shop_branding: "Shop Branding Details",
    shop_title: "SHOP DISPLAY TITLE *",
    shop_phone: "SHOP TELEPHONE LINE *",
    physical_address: "PHYSICAL LOCATION ADDRESS *",
    currency_symbol: "CURRENCY SYMBOL",
    invoice_prefix: "INVOICE NO PREFIX",
    default_tax: "DEFAULT TAX RATE %",
    display_theme: "DISPLAY INTERFACE THEME",
    receipt_footer: "RECEIPT FOOTER MESSAGE",
    save_branding: "Save Shop Branding Settings",
    language: "STATION LANGUAGE",
    select_language: "Select Station Language",
    english: "English (UK/US)",
    urdu: "اردو (Urdu)",
  },
  ur: {
    // Navigation / Sidebar
    dashboard: "ڈیش بورڈ جائزہ",
    pos: "پی او ایس ٹرمینل انوائسنگ",
    products: "پروڈکٹس کیٹلاگ",
    sales: "سیلز ریکارڈ آرکائیو",
    expenses: "اخراجات ٹریکر",
    ledgers: "مالیاتی لیجرز کھاتہ",
    reports: "تجزیاتی رپورٹس",
    backups: "آف لائن بیک اپ",
    settings: "اسٹور سیٹنگز",
    about: "سافٹ ویئر کے بارے میں",
    close_station: "اسٹیشن بند کریں",
    active_station: "اسٹیشن فعال ہے (آف لائن)",
    low_stock_warn: "{count} پروڈکٹس کا اسٹاک کم ہے!",
    
    // Header
    status: "حیثیت",
    loading: "لوڈ ہو رہا ہے...",
    
    // Invoice / Receipt
    invoice: "رسید / انوائس",
    date: "تاریخ",
    customer: "گاہک",
    cashier_station: "کیشیئر اسٹیشن",
    product_name: "اشیاء کا نام",
    qty: "تعداد",
    price: "قیمت",
    total: "کل رقم",
    subtotal: "ذیلی ٹوٹل",
    sales_tax: "سیلز ٹیکس",
    discount: "رعایت",
    discount_deduction: "رعایت کٹوتی",
    grand_total: "میزان کل (ٹوٹل)",
    paid_channels: "ادائیگی کا طریقہ",
    received_amount: "وصول شدہ رقم",
    change_return: "بقایا واپس",
    remarks: "تفصیل",
    thank_you: "خریداری کا بہت بہت شکریہ",
    walk_in: "عام گاہک",
    pos_offline: "آف لائن پی او ایس سسٹم - مائیکروسافٹ ونڈوز کے لیے۔",
    digital_invoice: "ڈیجیٹل انوائس پرنٹ اسٹیشن",
    thermal_58mm: "تھرمل 58 ملی میٹر",
    thermal_80mm: "تھرمل 80 ملی میٹر",
    standard_a4: "معیاری A4 شیٹ",
    close_receipt: "انوائس بند کریں",
    save_bill: "بل / انوائس فائل محفوظ کریں",
    text_file: "ٹیکسٹ فائل (.txt)",
    image_file: "تصویر فائل (.png)",
    offline_device_friendly: "آف لائن ڈیوائس فرینڈلی: بل کو فوری طور پر اپنے ڈاؤن لوڈز یا ٹیبلٹ فولڈر میں محفوظ کریں۔",
    print_thermal: "انوائس پرنٹ کریں",
    close_receipt_view: "انوائس ویو بند کریں",
    
    // POS Terminal
    search_barcodes: "بار کوڈ اسکین کریں یا نام لکھیں...",
    all_categories: "تمام کیٹیگریز",
    retail: "پرچون (Retail)",
    wholesale: "تھوک (Wholesale)",
    out_of_stock: "اسٹاک ختم",
    items_in_cart: "کارٹ میں موجود اشیاء",
    clear_all: "سب صاف کریں",
    account_client: "گاہک / کھاتہ دار",
    quick_add: "+ نیا رجسٹر کریں",
    hold_bill: "بل ہولڈ کریں",
    hold_carts: "ہولڈ کارٹس",
    tax_rate: "ٹیکس کی شرح %",
    payment_method: "ادائیگی کا ذریعہ",
    amount_received: "وصول شدہ رقم",
    change_due: "بقایا رقم (واپسی)",
    order_remarks: "آرڈر ریمارکس / لیجر نوٹس",
    checkout_order: "بل مکمل کریں اور محفوظ کریں",
    hold_cart_title: "ہولڈ کارٹ کا عنوان",
    hold_cart_desc: "بعد میں بل بنانے کے لیے اسے محفوظ کریں",
    cancel: "کینسل",
    hold: "محفوظ کریں",
    
    // Settings
    software_parameters: "سافٹ ویئر سیٹنگز پیرامیٹرز",
    configure_receipt: "رسید کی تفصیلات، اپنی مرضی کی کرنسی، اور پاس ورڈ وغیرہ کی سیٹنگز یہاں تبدیل کریں۔",
    shop_branding: "دکان کی برانڈنگ کی تفصیلات",
    shop_title: "دکان کا نام *",
    shop_phone: "دکان کا فون نمبر *",
    physical_address: "دکان کا پتہ *",
    currency_symbol: "کرنسی کا نشان",
    invoice_prefix: "انوائس کا سابقہ (Prefix)",
    default_tax: "ڈیفالٹ ٹیکس شرح %",
    display_theme: "انٹرفیس تھیم تبدیل کریں",
    receipt_footer: "رسید کے نیچے کا پیغام (Footer)",
    save_branding: "برانڈنگ سیٹنگز محفوظ کریں",
    language: "اسٹیشن کی زبان",
    select_language: "سافٹ ویئر کی زبان منتخب کریں",
    english: "انگلش (English)",
    urdu: "اردو (Urdu)",
  }
};
