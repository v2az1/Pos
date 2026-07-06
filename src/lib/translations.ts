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

  // New keys for complete translation of all features in Urdu
  today_sales: string;
  days_revenue: string;
  gross_profit: string;
  avg_margin: string;
  total_expenses: string;
  net_profit: string;
  total_catalog: string;
  low_stock: string;
  items_count: string;
  weekly_billing_flow: string;
  compare_gross_profit: string;
  gross_revenue: string;
  best_selling_products: string;
  highest_volume_retail: string;
  units_shipped: string;
  no_inventory_shipped: string;
  generate_complete_shipping_reports: string;
  critical_stock_alerts: string;
  products_nearing_depleted: string;
  all_sufficiently_stocked: string;
  local_audit_log: string;
  continuous_background_operations: string;
  audits_settings: string;
  refresh_data: string;
  pos_terminal: string;
  successful_receipts: string;
  active_flow_tracking: string;

  // Products
  product_catalog: string;
  add_new_product: string;
  edit_product: string;
  barcode_sku: string;
  product_name_lbl: string;
  category: string;
  purchase_cost: string;
  retail_price: string;
  wholesale_price: string;
  stock_quantity: string;
  minimum_alert_stock: string;
  measuring_unit: string;
  save_product: string;
  delete_product: string;
  search_products: string;
  all_cats: string;
  sku: string;
  stock: string;
  actions: string;
  no_products_found: string;

  // Sales
  sales_history: string;
  view_and_manage_sales: string;
  search_sales: string;
  invoice_no: string;
  date_time: string;
  customer_lbl: string;
  grand_total_lbl: string;
  status_lbl: string;
  refunded: string;
  completed: string;
  reprint_receipt: string;
  refund_sale: string;
  no_sales_recorded: string;

  // Expenses
  expenses_tracker: string;
  record_store_disbursements: string;
  add_expense: string;
  expense_amount: string;
  expense_date: string;
  expense_category: string;
  expense_description: string;
  save_expense: string;
  delete_expense: string;
  search_expenses: string;
  no_expenses_recorded: string;

  // Ledgers
  customer_supplier_ledgers: string;
  manage_outstanding_balances: string;
  customers_tab: string;
  suppliers_tab: string;
  add_customer: string;
  add_supplier: string;
  phone_no: string;
  cnic_no: string;
  email: string;
  address: string;
  opening_balance: string;
  save_ledger: string;
  receive_payment: string;
  pay_supplier: string;
  current_balance: string;
  balance_due: string;
  payment_history: string;
  no_ledgers_recorded: string;

  // Reports
  analytical_insights: string;
  view_profit_loss_statements: string;
  profit_loss_summary: string;
  total_sales_revenue: string;
  total_cost_of_goods: string;
  total_expenses_recorded: string;
  net_earnings: string;
  top_categories: string;
  sales_by_payment_method: string;
  export_report: string;

  // Backups
  offline_backups: string;
  backup_and_restore_data: string;
  export_db_file: string;
  import_db_file: string;
  reset_system: string;
  backup_warning: string;

  // About
  about_system: string;
  system_description: string;
  developer_profile: string;
  app_version: string;
  built_for_retail: string;

  // Missing properties from standard modules
  expense_registry: string;
  log_expenditure_payout: string;
  search_bills: string;
  date_lbl: string;
  amount_paid: string;
  ledgers_n_directories: string;
  analytical_reports: string;
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

    // Dashboard
    today_sales: "Today's Sales",
    days_revenue: "7 Days Revenue",
    gross_profit: "Gross Profit",
    avg_margin: "Avg. Margin",
    total_expenses: "Total Expenses",
    net_profit: "Net Profit",
    total_catalog: "Total Catalog",
    low_stock: "Low Stock",
    items_count: "{count} Items",
    weekly_billing_flow: "Weekly Billing Flow",
    compare_gross_profit: "Comparing gross billing against profit vectors",
    gross_revenue: "Gross Revenue",
    best_selling_products: "Best Selling Products",
    highest_volume_retail: "Highest volume retail items (Last 30 days)",
    units_shipped: "{count} units shipped",
    no_inventory_shipped: "No inventory shipped yet!",
    generate_complete_shipping_reports: "Generate Complete Shipping Reports →",
    critical_stock_alerts: "Critical Stock Alerts",
    products_nearing_depleted: "Products nearing depleted quantities",
    all_sufficiently_stocked: "All products are sufficiently stocked. Great!",
    local_audit_log: "Local Audit Log",
    continuous_background_operations: "Continuous background operations logged locally",
    audits_settings: "Audits Settings",
    refresh_data: "Refresh Data",
    pos_terminal: "POS Terminal",
    successful_receipts: "{count} successful receipts",
    active_flow_tracking: "Active flow tracking",

    // Products
    product_catalog: "Product Catalog",
    add_new_product: "Add New Product",
    edit_product: "Edit Product",
    barcode_sku: "Barcode / SKU",
    product_name_lbl: "Product Name",
    category: "Category",
    purchase_cost: "Purchase Cost",
    retail_price: "Retail Price",
    wholesale_price: "Wholesale Price",
    stock_quantity: "Stock Quantity",
    minimum_alert_stock: "Minimum Alert Stock",
    measuring_unit: "Measuring Unit",
    save_product: "Save Product",
    delete_product: "Delete Product",
    search_products: "Search products catalog...",
    all_cats: "All Categories",
    sku: "SKU",
    stock: "Stock",
    actions: "Actions",
    no_products_found: "No products matched your search parameters.",

    // Sales
    sales_history: "Sales Records Archive",
    view_and_manage_sales: "View, audit, reprint, and refund completed store orders.",
    search_sales: "Search invoices or customer names...",
    invoice_no: "Invoice No",
    date_time: "Date & Time",
    customer_lbl: "Customer / Account",
    grand_total_lbl: "Grand Total",
    status_lbl: "Status",
    refunded: "Refunded",
    completed: "Completed",
    reprint_receipt: "Reprint Receipt",
    refund_sale: "Refund Sale",
    no_sales_recorded: "No sales records stored in offline database.",

    // Expenses
    expenses_tracker: "Expense Tracker",
    record_store_disbursements: "Record store disbursements, rent, salaries, utilities, and raw materials.",
    add_expense: "Add Store Expense",
    expense_amount: "Expense Amount",
    expense_date: "Expense Date",
    expense_category: "Expense Category",
    expense_description: "Expense Description / Notes",
    save_expense: "Save Expense Record",
    delete_expense: "Delete Record",
    search_expenses: "Search expenses...",
    no_expenses_recorded: "No store expenses recorded for this station session.",

    // Ledgers
    customer_supplier_ledgers: "Customer & Supplier Ledgers",
    manage_outstanding_balances: "Manage outstanding balances, credits, and paybacks.",
    customers_tab: "Clients / Customers (Creditors)",
    suppliers_tab: "Suppliers / Vendors (Debtors)",
    add_customer: "Register New Customer Card",
    add_supplier: "Register New Supplier Card",
    phone_no: "Telephone / Phone",
    cnic_no: "CNIC / National Identity",
    email: "Email Address",
    address: "Postal / Store Address",
    opening_balance: "Opening Ledger Balance",
    save_ledger: "Save Account Ledger Card",
    receive_payment: "Receive Payment",
    pay_supplier: "Pay Supplier",
    current_balance: "Current Balance",
    balance_due: "Balance Due",
    payment_history: "Payment History Logs",
    no_ledgers_recorded: "No clients or supply agents found on this ledger index.",

    // Reports
    analytical_insights: "Analytical Reports & Analytics",
    view_profit_loss_statements: "View profit & loss statements, revenue aggregation, and payment methods.",
    profit_loss_summary: "Profit & Loss Summary Statement",
    total_sales_revenue: "Total Sales Revenue",
    total_cost_of_goods: "Total Cost of Goods Sold",
    total_expenses_recorded: "Total Expenses",
    net_earnings: "Net Profit / Earnings",
    top_categories: "Top Categories Contribution",
    sales_by_payment_method: "Sales Revenue by Payment Channel",
    export_report: "Export Statement Report",

    // Backups
    offline_backups: "Offline Backups & Maintenance",
    backup_and_restore_data: "Backup and restore your local SQLite database image directly.",
    export_db_file: "Export Offline Database Backup (.json)",
    import_db_file: "Import Offline Database Backup (.json)",
    reset_system: "Emergency Hard Reset POS",
    backup_warning: "Warning: Resetting will completely erase your local database.",

    // About
    about_system: "About Software & Developer Profile",
    system_description: "Enterprise-grade Offline Point-of-Sale software built for extreme responsiveness.",
    developer_profile: "Senior Core Architect Profile",
    app_version: "Software App Version: 2.1.0 LTS",
    built_for_retail: "Engineered specifically for MS Windows, Android, and tablets.",

    // Missing properties from standard modules
    expense_registry: "Expense Registry & Accounts",
    log_expenditure_payout: "Log store disbursements, salaries, utilities, and raw materials.",
    search_bills: "Search bills or filter expenses...",
    date_lbl: "Date",
    amount_paid: "Amount Paid",
    ledgers_n_directories: "Ledgers & Directories",
    analytical_reports: "Analytical Reports",
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
    cancel: "منسوخ کریں",
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

    // Dashboard
    today_sales: "آج کی فروخت (سیلز)",
    days_revenue: "7 دنوں کی کل آمدنی",
    gross_profit: "مجموعی منافع",
    avg_margin: "اوسط منافع %",
    total_expenses: "کل اخراجات",
    net_profit: "خالص منافع",
    total_catalog: "کل پروڈکٹس کی تعداد",
    low_stock: "کم اسٹاک اشیاء",
    items_count: "{count} اشیاء",
    weekly_billing_flow: "ہفتہ وار بلنگ اور فروخت کا بہاؤ",
    compare_gross_profit: "مجموعی فروخت کا منافع کے ساتھ موازنہ",
    gross_revenue: "مجموعی آمدنی",
    best_selling_products: "سب سے زیادہ فروخت ہونے والی اشیاء",
    highest_volume_retail: "سب سے زیادہ فروخت ہونے والی اشیاء کی تفصیل (آخری 30 دن)",
    units_shipped: "{count} یونٹ فروخت ہوئے",
    no_inventory_shipped: "ابھی تک کوئی سیلز ریکارڈ موجود نہیں!",
    generate_complete_shipping_reports: "مکمل سیلز اور شپنگ رپورٹس بنائیں ←",
    critical_stock_alerts: "کم اسٹاک وارننگز",
    products_nearing_depleted: "وہ اشیاء جن کا اسٹاک ختم ہونے والا ہے",
    all_sufficiently_stocked: "ماشاءاللہ! تمام اشیاء کا کافی اسٹاک موجود ہے۔",
    local_audit_log: "سسٹم آڈٹ لاگ",
    continuous_background_operations: "سسٹم کی سرگرمیاں اور لاگز کی تفصیلات",
    audits_settings: "لاگ سیٹنگز",
    refresh_data: "ڈیٹا اپڈیٹ کریں",
    pos_terminal: "پی او ایس ٹرمینل",
    successful_receipts: "{count} کامیاب بلز",
    active_flow_tracking: "سرگرمیاں ٹریکر فعال ہے",

    // Products
    product_catalog: "پروڈکٹس کیٹلاگ",
    add_new_product: "نئی پروڈکٹ شامل کریں",
    edit_product: "پروڈکٹ ایڈٹ کریں",
    barcode_sku: "بارکوڈ / ایس کیو یو (SKU)",
    product_name_lbl: "پروڈکٹ کا نام",
    category: "کیٹیگری (Category)",
    purchase_cost: "خریداری کی قیمت (لاگت)",
    retail_price: "پرچون فروخت قیمت (Retail)",
    wholesale_price: "تھوک فروخت قیمت (Wholesale)",
    stock_quantity: "موجودہ اسٹاک کی تعداد",
    minimum_alert_stock: "کم از کم اسٹاک الرٹ",
    measuring_unit: "پیمائش کا یونٹ (مثلاً کلو، پیکٹ)",
    save_product: "پروڈکٹ محفوظ کریں",
    delete_product: "پروڈکٹ حذف کریں",
    search_products: "پروڈکٹس تلاش کریں...",
    all_cats: "تمام کیٹیگریز",
    sku: "ایس کیو یو",
    stock: "اسٹاک",
    actions: "طریقہ کار",
    no_products_found: "آپ کی تلاش کے مطابق کوئی پروڈکٹ نہیں ملی۔",

    // Sales
    sales_history: "سیلز ریکارڈ آرکائیو",
    view_and_manage_sales: "تمام مکمل بلز دیکھیں، رسید دوبارہ پرنٹ کریں اور ریفنڈ کریں۔",
    search_sales: "انوائس نمبر یا گاہک کا نام تلاش کریں...",
    invoice_no: "انوائس نمبر",
    date_time: "تاریخ اور وقت",
    customer_lbl: "گاہک / کھاتہ",
    grand_total_lbl: "کل رقم (ٹوٹل)",
    status_lbl: "حیثیت",
    refunded: "واپس شدہ (Refunded)",
    completed: "مکمل شدہ (Completed)",
    reprint_receipt: "رسید پرنٹ کریں",
    refund_sale: "بل ریفنڈ کریں",
    no_sales_recorded: "ڈیٹا بیس میں ابھی تک کوئی سیلز ریکارڈ محفوظ نہیں ہے۔",

    // Expenses
    expenses_tracker: "اخراجات ٹریکر",
    record_store_disbursements: "دکان کے اخراجات، کرایہ، تنخواہیں، بل اور دیگر اخراجات درج کریں۔",
    add_expense: "نیا خرچہ درج کریں",
    expense_amount: "خرچہ کی رقم",
    expense_date: "خرچہ کی تاریخ",
    expense_category: "خرچہ کی کیٹیگری",
    expense_description: "تفصیل / ریمارکس",
    save_expense: "خرچہ محفوظ کریں",
    delete_expense: "حذف کریں",
    search_expenses: "اخراجات تلاش کریں...",
    no_expenses_recorded: "اس سیشن کے دوران کوئی اخراجات درج نہیں کیے گئے۔",

    // Ledgers
    customer_supplier_ledgers: "گاہک اور سپلائر کھاتہ (لیجر)",
    manage_outstanding_balances: "گاہکوں کے ادھار کھاتوں اور سپلائرز کے واجب الادا رقوم کا انتظام کریں۔",
    customers_tab: "گاہک ادھار کھاتہ (کریڈٹ)",
    suppliers_tab: "سپلائرز واجب الادا کھاتہ (ڈیبٹ)",
    add_customer: "نیا گاہک رجسٹر کریں",
    add_supplier: "نیا سپلائر رجسٹر کریں",
    phone_no: "فون نمبر",
    cnic_no: "شناختی کارڈ نمبر (CNIC)",
    email: "ای میل ایڈریس",
    address: "پتہ",
    opening_balance: "کھاتہ شروع کرنے کا بیلنس",
    save_ledger: "کھاتہ دار محفوظ کریں",
    receive_payment: "رقم وصول کریں",
    pay_supplier: "ادائیگی کریں",
    current_balance: "موجودہ بیلنس",
    balance_due: "بقایا واجب الادا رقم",
    payment_history: "ادائیگیوں کی ہسٹری",
    no_ledgers_recorded: "اس کھاتہ میں کوئی نام درج نہیں ہے۔",

    // Reports
    analytical_insights: "تجزیاتی رپورٹس اور اسٹیٹمنٹ",
    view_profit_loss_statements: "کل فروخت، لاگت، اخراجات اور خالص منافع کی رپورٹس دیکھیں۔",
    profit_loss_summary: "مجموعی نفع و نقصان کی رپورٹ",
    total_sales_revenue: "کل فروخت (آمدنی)",
    total_cost_of_goods: "کل لاگت (COGS)",
    total_expenses_recorded: "کل اخراجات",
    net_earnings: "خالص منافع (بچت)",
    top_categories: "مقبول کیٹیگریز کی شراکت",
    sales_by_payment_method: "ادائیگی کے طریقوں کے مطابق آمدنی",
    export_report: "رپورٹ ایکسپورٹ کریں",

    // Backups
    offline_backups: "ڈیٹا بیک اپ اور بحالی",
    backup_and_restore_data: "اپنے آف لائن ڈیٹا کو محفوظ رکھیں اور بیک اپ فائل بنائیں۔",
    export_db_file: "بیک اپ فائل بنائیں (.json)",
    import_db_file: "بیک اپ فائل سے ڈیٹا بحال کریں (.json)",
    reset_system: "سسٹم ری سیٹ کریں (تمام ڈیٹا صاف کریں)",
    backup_warning: "خبردار: سسٹم ری سیٹ کرنے سے آپ کا تمام ڈیٹا مستقل طور پر حذف ہو جائے گا۔",

    // About
    about_system: "سافٹ ویئر کی معلومات اور پروفائل",
    system_description: "انتہائی تیز رفتار اور محفوظ آف لائن پوائنٹ آف سیل سافٹ ویئر۔",
    developer_profile: "سافٹ ویئر ڈویلپر کی تفصیلات",
    app_version: "سافٹ ویئر ورژن: 2.1.0 LTS",
    built_for_retail: "یہ سافٹ ویئر ونڈوز، اینڈرائیڈ اور ٹیبلٹ کے لیے تیار کیا گیا ہے۔",

    // Missing properties from standard modules
    expense_registry: "اخراجات کا ریکارڈ اور کھاتہ دار",
    log_expenditure_payout: "دکان کے اخراجات، تنخواہیں، بل اور دیگر ادائیگیوں کا لاگ۔",
    search_bills: "اخراجات یا بلز تلاش کریں...",
    date_lbl: "تاریخ",
    amount_paid: "ادا شدہ رقم",
    ledgers_n_directories: "لیجر اور ڈائریکٹریز",
    analytical_reports: "تجزیاتی رپورٹس",
  }
};
