import React, { useState } from 'react';
import { 
  CircleDollarSign, ArrowUpRight, ArrowDownRight, Search, Landmark,
  Users, UserPlus, CreditCard, Plus, Phone, MapPin, Mail, X, Notebook, Sparkles, Trash2
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { Customer, LedgerEntry } from '../types';
import { translations } from '../lib/translations';

interface LedgersProps {
  db: DBState;
  onSaveDB?: (newDb: DBState) => void;
}

export default function Ledgers({ db, onSaveDB }: LedgersProps) {
  const { ledgers, customers, settings } = db;
  const currency = settings.currency;
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];

  const [activeTab, setActiveTab] = useState<'cash' | 'customers'>('cash');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCNIC, setNewCustCNIC] = useState('');
  const [newCustOpeningBal, setNewCustOpeningBal] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Calculate dynamic Cash Register stats
  const cashLedgerList = ledgers.filter(l => l.accountType === 'cash');
  const cashIn = cashLedgerList.filter(l => l.type === 'debit').reduce((sum, l) => sum + l.amount, 0);
  const cashOut = cashLedgerList.filter(l => l.type === 'credit').reduce((sum, l) => sum + l.amount, 0);
  const currentCashInRegister = cashIn - cashOut;

  // Filter list
  const activeLedgers = cashLedgerList.filter(l => {
    if (search.trim()) {
      return l.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.cnic && c.cnic.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  // Handle Add New Customer
  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Please enter a customer name.');
      return;
    }

    const openingBal = parseFloat(newCustOpeningBal) || 0;
    const newId = `cust-${Date.now()}`;

    const newCustomer: Customer = {
      id: newId,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'N/A',
      address: newCustAddress.trim() || 'N/A',
      email: newCustEmail.trim() || 'N/A',
      cnic: newCustCNIC.trim() || 'N/A',
      openingBalance: openingBal,
      currentBalance: openingBal
    };

    const updatedCustomers = [...customers, newCustomer];

    // Create an opening ledger entry if there's a non-zero opening balance
    let updatedLedgers = [...ledgers];
    if (openingBal !== 0) {
      const newLedger: LedgerEntry = {
        id: `ldg-${Date.now()}`,
        accountType: 'customer',
        accountId: newId,
        type: openingBal > 0 ? 'debit' : 'credit',
        amount: Math.abs(openingBal),
        balance: openingBal,
        date: new Date().toISOString(),
        description: `Opening ledger balance for customer ${newCustName.trim()}`
      };
      updatedLedgers.push(newLedger);
    }

    if (onSaveDB) {
      onSaveDB({
        ...db,
        customers: updatedCustomers,
        ledgers: updatedLedgers
      });
      addLog('Customer Add', `Registered new account customer: "${newCustName.trim()}"`);
    }

    // Reset Form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustEmail('');
    setNewCustCNIC('');
    setNewCustOpeningBal('');
    setShowAddCustomerModal(false);
  };

  // Handle Delete Customer
  const handleDeleteCustomer = (customer: Customer) => {
    if (customer.id === 'cust-1') {
      alert('The System Walk-In Customer profile cannot be deleted.');
      return;
    }
    setCustomerToDelete(customer);
  };

  const executeDeleteCustomer = () => {
    if (!customerToDelete) return;

    const updatedCustomers = customers.filter(c => c.id !== customerToDelete.id);
    
    if (onSaveDB) {
      onSaveDB({
        ...db,
        customers: updatedCustomers
      });
      addLog('Customer Delete', `Deleted customer profile: "${customerToDelete.name}"`);
    }

    setCustomerToDelete(null);
  };

  // Handle Customer Payment Receive
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    // Deduct from customer's current balance
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomerForPayment.id) {
        return {
          ...c,
          currentBalance: c.currentBalance - amount
        };
      }
      return c;
    });

    const timestamp = new Date().toISOString();
    const remarks = paymentRemarks.trim() || `Credit payment from ${selectedCustomerForPayment.name}`;

    // Create Ledger Entry for Customer Balance decrease (credit payment decreases client's debit balance)
    const customerLedgerEntry: LedgerEntry = {
      id: `ldg-cust-pay-${Date.now()}`,
      accountType: 'customer',
      accountId: selectedCustomerForPayment.id,
      type: 'credit',
      amount: amount,
      balance: selectedCustomerForPayment.currentBalance - amount,
      date: timestamp,
      description: remarks
    };

    // Create Ledger Entry for Cash Register Drawer increase (cash received increases cash debit assets)
    const cashLedgerEntry: LedgerEntry = {
      id: `ldg-cash-rec-${Date.now()}`,
      accountType: 'cash',
      accountId: 'cash_register',
      type: 'debit',
      amount: amount,
      balance: currentCashInRegister + amount,
      date: timestamp,
      description: `Cash received: ${remarks}`
    };

    const updatedLedgers = [...ledgers, customerLedgerEntry, cashLedgerEntry];

    if (onSaveDB) {
      onSaveDB({
        ...db,
        customers: updatedCustomers,
        ledgers: updatedLedgers
      });
      addLog('Customer Payment', `Logged ledger payment: Received ${currency} ${amount} from "${selectedCustomerForPayment.name}"`);
    }

    setPaymentAmount('');
    setPaymentRemarks('');
    setSelectedCustomerForPayment(null);
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight font-sans">{t.ledgers_n_directories}</h1>
          <p className="text-sm text-slate-400">{currentLang === 'ur' ? 'کیش رجسٹر اور گاہکوں کے ادھار کھاتوں کی تفصیلات یہاں دیکھیں' : 'Track operating cash drawer registries and customer accounts credit balances.'}</p>
        </div>
        
        {activeTab === 'customers' && (
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all duration-150 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.add_customer}</span>
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-250 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('cash'); setSearch(''); }}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cash'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CircleDollarSign className="w-4 h-4" />
          <span>{currentLang === 'ur' ? `کیش رجسٹر کھاتہ (${currency}${currentCashInRegister.toLocaleString()})` : `Cash Drawer Registry (${currency}${currentCashInRegister.toLocaleString()})`}</span>
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setSearch(''); }}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{currentLang === 'ur' ? `گاہکوں کا لیجر (${customers.length})` : `Customer Accounts Ledger (${customers.length})`}</span>
        </button>
      </div>

      {/* CASH DRAWER REGISTRY VIEW */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {/* Cash register statistics card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> {currentLang === 'ur' ? 'کیش آمدنی (Inflow)' : 'Cash register Inflows'}</span>
              <div className="text-xl font-black text-emerald-500">{currency} {cashIn.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">{currentLang === 'ur' ? 'کل فروخت اور موصولہ ادھار ادائیگیاں' : 'Voucher checkouts & manual ledger entries'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ArrowDownRight className="w-4 h-4 text-rose-500" /> {currentLang === 'ur' ? 'کیش اخراجات (Outflow)' : 'Cash register Outflows'}</span>
              <div className="text-xl font-black text-rose-500">{currency} {cashOut.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">{currentLang === 'ur' ? 'اسٹور کے اخراجات اور پے آؤٹس' : 'Logged store and utility expenses'}</p>
            </div>

            <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-150/10">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><CircleDollarSign className="w-4.5 h-4.5 text-indigo-500" /> {currentLang === 'ur' ? 'کیش رجسٹر بیلنس' : 'Net Operating Cash On Hand'}</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-white">{currency} {currentCashInRegister.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">{currentLang === 'ur' ? 'کیش دراز میں موجود کل نقد رقم' : 'Physical liquid assets operating inside register drawer'}</p>
            </div>
          </div>

          {/* Search line */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder={currentLang === 'ur' ? 'کیش رجسٹر کھاتہ میں تلاش کریں...' : 'Filter entries in cash ledger journal...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none rounded-xl"
              />
            </div>
          </div>

          {/* Ledger Journal rows */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-4">{t.date_time}</th>
                    <th className="px-5 py-4">{currentLang === 'ur' ? 'کھاتہ کی قسم' : 'Account Target'}</th>
                    <th className="px-5 py-4">{currentLang === 'ur' ? 'تفصیل' : 'Details Description Remarks'}</th>
                    <th className="px-5 py-4 text-center">{t.status_lbl}</th>
                    <th className="px-5 py-4 text-right">{currentLang === 'ur' ? 'رقم' : 'Debit / Credit Value'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-705/35">
                  {activeLedgers.length > 0 ? (
                    activeLedgers.map((l, index) => (
                      <tr key={l.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {new Date(l.date).toLocaleDateString()} {new Date(l.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                          Cash Drawer
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 italic max-w-72 truncate">
                          {l.description}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${l.type === 'debit' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-955/20'}`}>
                            {l.type === 'debit' ? 'Debit (+)' : 'Credit (-)'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right font-black">
                          <span className={l.type === 'debit' ? "text-emerald-500" : "text-rose-500"}>
                            {l.type === 'debit' ? '+' : '-'} {currency} {l.amount.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400">
                        <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No entries logged in cash ledger database page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER ACCOUNTS LEDGER VIEW */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Quick instructions alert */}
          <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl flex items-start gap-3">
            <Notebook className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold mb-0.5">{currentLang === 'ur' ? 'ادھار کریڈٹ ٹریکنگ کا طریقہ کار' : 'Credit Tracking Mechanism'}</p>
              <p>{currentLang === 'ur' ? 'گاہک چیک آؤٹ کے دوران ادھار (کریڈٹ) پر اشیاء خرید سکتے ہیں۔ نادہندہ واجب الادا رقوم خود بخود ان کے کھاتے میں شامل ہو جاتی ہیں۔ آپ یہاں ان سے ادائیگیاں وصول کر کے کھاتہ صاف کر سکتے ہیں۔' : 'Customers listed below can purchase products on Credit during Checkout. Any unpaid balances are added to their card ledger. You can receive partial or full payments from clients here to clear their ledger sheets.'}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder={currentLang === 'ur' ? 'گاہک کا نام، فون نمبر یا ای میل تلاش کریں...' : 'Search registered customers by name, phone, CNIC or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none rounded-xl"
              />
            </div>
          </div>

          {/* Customer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => {
                const isWalkIn = cust.id === 'cust-1';
                const hasBalance = cust.currentBalance > 0;
                
                return (
                  <div 
                    key={cust.id} 
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition gap-4"
                  >
                    <div className="space-y-3">
                      {/* Name badge */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">{cust.name}</h3>
                          <span className="text-[9px] text-slate-400 font-mono tracking-wider">{cust.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            isWalkIn 
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' 
                              : hasBalance 
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400' 
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-400'
                          }`}>
                            {isWalkIn ? (currentLang === 'ur' ? 'عام گاہک (سسٹم)' : 'System Walk-in') : hasBalance ? (currentLang === 'ur' ? 'بقایا واجب الادا رقم' : 'Has Outstanding Credit') : (currentLang === 'ur' ? 'کھاتہ صاف ہے' : 'Balance Settled')}
                          </span>
                          {!isWalkIn && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(cust)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition shrink-0"
                              title={currentLang === 'ur' ? 'گاہک کا پروفائل حذف کریں' : 'Delete Customer Profile'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Contact items */}
                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-705/30 pt-3">
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{cust.phone}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{cust.address}</span></div>
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{cust.email}</span></div>
                        {cust.cnic && cust.cnic !== 'N/A' && (
                          <div className="flex items-center gap-2 text-[10px] bg-slate-50 dark:bg-slate-900 p-1 px-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono mt-1 w-fit">
                            <span className="text-slate-400">CNIC:</span> <span className="text-slate-600 dark:text-slate-300">{cust.cnic}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary card bottom */}
                    <div className="border-t border-slate-100 dark:border-slate-750 pt-3 flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{currentLang === 'ur' ? 'کل واجب الادا (ادھار)' : 'Debit Ledger Balance'}</span>
                        <span className={`text-base font-black ${hasBalance ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {currency} {cust.currentBalance.toLocaleString()}
                        </span>
                      </div>

                      {!isWalkIn && (
                        <button
                          onClick={() => {
                            setSelectedCustomerForPayment(cust);
                            setShowPaymentModal(true);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold py-1.5 px-3 rounded-lg transition flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/40"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{currentLang === 'ur' ? 'ادائیگی وصول کریں' : 'Receive Payment'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {currentLang === 'ur' ? 'کوئی مطابقت رکھنے والا گاہک نہیں ملا۔' : 'No matching customers found. Register new customers using the top button.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                  {currentLang === 'ur' ? 'نیا گاہک رجسٹر کریں' : 'Register New Customer'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleRegisterCustomer} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentLang === 'ur' ? 'پورا نام / کاروباری نام' : 'Full Name / Business Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentLang === 'ur' ? 'مثال کے طور پر: احمد ہول سیلرز' : 'e.g. Al-Madina Wholesale Distributors'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {currentLang === 'ur' ? 'فون نمبر' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {currentLang === 'ur' ? 'شناختی کارڈ نمبر (CNIC)' : 'CNIC Identifier'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 42101-1234567-1"
                    value={newCustCNIC}
                    onChange={(e) => setNewCustCNIC(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentLang === 'ur' ? 'ای میل ایڈریس' : 'Email Address'}
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@domain.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentLang === 'ur' ? 'پتہ کی تفصیلات' : 'Physical Address Details'}
                </label>
                <textarea
                  rows={2}
                  placeholder={currentLang === 'ur' ? 'مثال کے طور پر: دکان نمبر 24، مین بازار، کراچی' : 'e.g. Shop # 24, Main Wholesale Market, Karachi'}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {currentLang === 'ur' ? `ابتدائی لیجر بیلنس (${currency})` : `Initial Ledger Balance (${currency})`}
                  </label>
                  <span className="text-[9px] text-indigo-500 font-bold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> {currentLang === 'ur' ? 'لیجر ادھار بقایا' : 'Ledger Debt'}
                  </span>
                </div>
                <input
                  type="number"
                  placeholder={currentLang === 'ur' ? 'مثال: 5000 (اگر پہلے سے رقم واجب الادا ہو)' : 'e.g. 5000 (if they already owe money)'}
                  value={newCustOpeningBal}
                  onChange={(e) => setNewCustOpeningBal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                />
                <p className="text-[9.5px] text-slate-404 leading-tight">
                  {currentLang === 'ur' ? 'اگر اس گاہک کا پہلے سے کوئی بقایا ہے تو رقم درج کریں۔ نقد گاہک کے لیے 0 لکھیں۔' : 'Enter positive numbers if this customer has a balance to pay off. Use 0 for cash-only Walk-In setups.'}
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  {currentLang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {currentLang === 'ur' ? 'گاہک رجسٹر کریں' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIVE CUSTOMER CREDIT PAYMENT */}
      {showPaymentModal && selectedCustomerForPayment && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                  {currentLang === 'ur' ? 'ادائیگی کی رسید درج کریں' : 'Log Payment Receipt'}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedCustomerForPayment(null); setShowPaymentModal(false); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleReceivePayment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {currentLang === 'ur' ? 'گاہک کا نام' : 'Customer Target'}
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{selectedCustomerForPayment.name}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                  <span className="text-slate-500">{currentLang === 'ur' ? 'بقایا ادھار:' : 'Outstanding credit:'}</span>
                  <span className="text-rose-500">{currency} {selectedCustomerForPayment.currentBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentLang === 'ur' ? `موصولہ رقم درج کریں (${currency})` : `Received Cash Payment Amount (${currency})`} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentLang === 'ur' ? 'تفصیل / ریمارکس' : 'Remarks / Receipt Memo'}
                </label>
                <input
                  type="text"
                  placeholder={currentLang === 'ur' ? 'مثال کے طور پر: بقایا کی جزوی ادائیگی' : 'e.g. Cash received by cashier to settle invoice #1034'}
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setSelectedCustomerForPayment(null); setShowPaymentModal(false); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  {currentLang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {currentLang === 'ur' ? 'وصولی درج کریں' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE CUSTOMER */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                  {currentLang === 'ur' ? 'گاہک کا پروفائل حذف کریں' : 'Delete Customer Profile'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentLang === 'ur' ? (
                    <span>کیا آپ واقعی گاہک <strong className="text-slate-800 dark:text-white">"{customerToDelete.name}"</strong> کو مستقل طور پر حذف کرنا چاہتے ہیں؟</span>
                  ) : (
                    <span>Are you sure you want to permanently delete customer <strong className="text-slate-800 dark:text-white">"{customerToDelete.name}"</strong>?</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {currentLang === 'ur' ? (
                    <span>اس عمل سے گاہک کا ریکارڈ فعال فہرست سے حذف ہو جائے گا۔ سابقہ لیجر ریکارڈز آڈٹ کے لیے محفوظ رہیں گے۔</span>
                  ) : (
                    <span>This action will remove their record from the active directory. Any historic ledger records will remain for audit purposes.</span>
                  )}
                </p>
              </div>

              {customerToDelete.currentBalance > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">
                    {currentLang === 'ur' ? '⚠️ بقایا واجب الادا رقم کا انتباہ' : '⚠️ Outstanding Balance warning'}
                  </span>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {currentLang === 'ur' ? (
                      <span>اس گاہک کا فی الحال <span className="font-black">{currency} {customerToDelete.currentBalance.toLocaleString()}</span> کا ادھار بقایا ہے۔</span>
                    ) : (
                      <span>This customer currently has an active credit ledger balance of <span className="font-black">{currency} {customerToDelete.currentBalance.toLocaleString()}</span>.</span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  {currentLang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={executeDeleteCustomer}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {currentLang === 'ur' ? 'تصدیق کریں' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
