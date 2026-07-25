import React, { useState } from 'react';
import { 
  History, Search, Calendar, FileText, RefreshCcw, Printer, Info, CheckCircle2, XCircle, Bluetooth
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { Sale } from '../types';
import { translations } from '../lib/translations';
import { printReceiptViaBluetooth, getSavedPaperSize } from '../lib/bluetoothPrinter';

interface SalesManagementProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
}

export default function SalesManagement({ db, onSaveDB }: SalesManagementProps) {
  const { sales, customers, settings } = db;
  const currency = settings.currency;
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  
  // Refund ticket state
  const [activeReprintSale, setActiveReprintSale] = useState<Sale | null>(null);

  // Filter sales based on preset timelines
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
                          (customers.find(c => c.id === s.customerId)?.name || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesTime = true;
    const saleDate = new Date(s.date);
    const today = new Date();
    
    if (filterType === 'Today') {
      matchesTime = saleDate.toDateString() === today.toDateString();
    } else if (filterType === 'Week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesTime = saleDate >= oneWeekAgo;
    } else if (filterType === 'Month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      matchesTime = saleDate >= oneMonthAgo;
    }

    return matchesSearch && matchesTime;
  });

  // Perform whole-invoice refund and restock
  const handleWholeInvoiceRefund = (sale: Sale) => {
    if (sale.status === 'Returned') {
      alert("System Action Refused: This invoice has already been fully refunded.");
      return;
    }
    if (confirm(`Do you want to refund Invoice #${sale.invoiceNo}? This will RESTOCK all sold quantity and credit customer outstanding balances.`)) {
      
      // 1. Restock quantities
      const updatedProducts = db.products.map(p => {
        const soldItem = sale.items.find(itm => itm.productId === p.id);
        if (soldItem) {
          return {
            ...p,
            quantity: p.quantity + soldItem.quantity // Qty goes back up!
          };
        }
        return p;
      });

      // 2. Debit client ledger balance
      const updatedCustomers = db.customers.map(c => {
        if (c.id === sale.customerId && sale.customerId !== 'cust-1') {
          return {
            ...c,
            currentBalance: c.currentBalance - sale.grandTotal // lowers liability
          };
        }
        return c;
      });

      // 3. Mark returned
      const updatedSales = sales.map(s => {
        if (s.id === sale.id) {
          return {
            ...s,
            status: 'Returned' as const
          };
        }
        return s;
      });

      // 4. Log General cash ledger debit/offsets is appropriate
      const updatedLedgers = [...db.ledgers];
      updatedLedgers.push({
        id: 'ldg-refund-' + Date.now(),
        accountType: 'cash',
        accountId: 'cash_register',
        type: 'credit', // Cash leaves cash register to refund
        amount: sale.grandTotal,
        balance: 0,
        date: new Date().toISOString(),
        description: `Refunded Checkout Invoice #${sale.invoiceNo}`
      });

      onSaveDB({
        ...db,
        products: updatedProducts,
        customers: updatedCustomers,
        sales: updatedSales,
        ledgers: updatedLedgers
      });

      addLog('Refund Invoice', `Refunded entire billing invoice: #${sale.invoiceNo}, quantities restocked`);
      alert("Invoice marked as refunded. Stock volumes replenished successfully!");
      if (activeReprintSale?.id === sale.id) {
        setActiveReprintSale({
          ...sale,
          status: 'Returned'
        });
      }
    }
  };

  const handleBluetoothReprint = async () => {
    if (!activeReprintSale) return;
    const custName = customers.find(c => c.id === activeReprintSale.customerId)?.name || 'Walk-In Customer';
    const paperSz = await getSavedPaperSize();

    try {
      await printReceiptViaBluetooth(activeReprintSale, settings, currency, custName, paperSz);
    } catch (err: any) {
      console.error('Bluetooth reprint error:', err);
      alert(`Bluetooth print error: ${err.message || 'Printer not connected'}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.sales_history}</h1>
        <p className="text-sm text-slate-400">{t.view_and_manage_sales}</p>
      </div>

      {/* Timeline Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search_sales}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none rounded-xl"
          />
        </div>

        <div className="flex gap-2 text-xs shrink-0 font-bold text-slate-600">
          {(['All', 'Today', 'Week', 'Month'] as const).map((type) => {
            const labelMap: Record<string, string> = {
              All: currentLang === 'ur' ? 'سب' : 'All',
              Today: currentLang === 'ur' ? 'آج' : 'Today',
              Week: currentLang === 'ur' ? 'ہفتہ' : 'Week',
              Month: currentLang === 'ur' ? 'مہینہ' : 'Month'
            };
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl border transition ${filterType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
              >
                {labelMap[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid listing */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">{t.invoice_no}</th>
                <th className="px-5 py-4">{t.customer_lbl}</th>
                <th className="px-5 py-4">{t.date_time}</th>
                <th className="px-5 py-4">{t.payment_method}</th>
                <th className="px-5 py-4 text-right">{t.subtotal}</th>
                <th className="px-5 py-4 text-right">{t.grand_total_lbl}</th>
                <th className="px-5 py-4 text-center">{t.status_lbl}</th>
                <th className="px-5 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length > 0 ? (
                filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-800 dark:text-slate-100">
                      #{s.invoiceNo}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-500">
                      {s.customerId === 'cust-1' ? t.walk_in : (customers.find(c => c.id === s.customerId)?.name || t.walk_in)}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-500">
                      {s.paymentMethod === 'Cash' ? (currentLang === 'ur' ? 'نقد' : 'Cash') :
                       s.paymentMethod === 'Credit' ? (currentLang === 'ur' ? 'ادھار / کریڈٹ' : 'Credit / Pay Later') :
                       s.paymentMethod === 'Bank Transfer' ? (currentLang === 'ur' ? 'بینک ٹرانسفر' : 'Bank Transfer') :
                       s.paymentMethod === 'Mixed' ? (currentLang === 'ur' ? 'مکسڈ' : 'Mixed') : s.paymentMethod}
                    </td>

                    <td className="px-5 py-3.5 text-right text-slate-500 font-semibold">{currency} {s.subtotal.toLocaleString()}</td>

                    <td className="px-5 py-3.5 text-right font-black text-slate-850 dark:text-white text-xs">{currency} {s.grandTotal.toLocaleString()}</td>

                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${s.status === 'Returned' ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955'}`}>
                        {s.status === 'Returned' ? t.refunded : t.completed}
                      </span>
                    </td>

                    {/* Voucher / Invoice actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status !== 'Returned' && (
                          <button
                            onClick={() => handleWholeInvoiceRefund(s)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded-lg text-[10.5px] transition duration-150"
                          >
                            {t.refund_sale}
                          </button>
                        )}
                        <button
                          onClick={() => setActiveReprintSale(s)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-505" /> {t.reprint_receipt}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No sales history logs found during this timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE REPRINT MODAL PREVIEW DRAWER */}
      {activeReprintSale && (
        <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 z-50">
          <div className="bg-white text-slate-800 p-6 md:p-8 rounded-2xl w-full max-w-[440px] shadow-2xl relative border">
            
            <div className="flex items-center justify-between border-b pb-4 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reprint Invoices Drawer</span>
              <button onClick={() => setActiveReprintSale(null)} className="text-slate-400 font-bold text-sm">✕ Close</button>
            </div>

            {/* Reprint content */}
            <div className="bg-white text-black p-4 font-sans text-xs tracking-tight leading-snug max-h-[480px] overflow-y-auto pr-1" id="reprint-ticket-box">
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-black">
                <h2 className="text-xl font-black tracking-tight uppercase text-black">{settings.shopName}</h2>
                {settings.address && (
                  <p className="whitespace-pre-line text-xs font-bold leading-tight text-black">{settings.address}</p>
                )}
                <p className="text-xs font-bold text-black">Contact: <strong>{settings.phone}</strong></p>
                <div className="pt-1">
                  <span className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-xs">
                    REPRINT DUPLICATE COPY
                  </span>
                </div>
              </div>

              <div className="py-2.5 space-y-1 text-xs font-bold border-b-2 border-dashed border-black text-black">
                <div className="flex justify-between">
                  <span>Voucher: <strong>#{activeReprintSale.invoiceNo}</strong></span>
                  <span>Date: {new Date(activeReprintSale.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: <strong>{customers.find(c => c.id === activeReprintSale.customerId)?.name || 'Walk-In'}</strong></span>
                  <span>POS Station #1</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-3 border-b-2 border-dashed border-black">
                <div className="grid grid-cols-12 font-black mb-2 text-xs uppercase border-b border-black pb-1 text-black">
                  <span className="col-span-6">Catalog Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-black">
                  {activeReprintSale.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 leading-snug font-bold">
                      <span className="col-span-6 font-extrabold truncate pr-1">{it.name}</span>
                      <span className="col-span-2 text-center font-black">{it.quantity}</span>
                      <span className="col-span-2 text-right">{currency}{it.salePrice.toLocaleString()}</span>
                      <span className="col-span-2 text-right font-black">{currency}{it.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2.5 text-right space-y-1.5 text-xs sm:text-sm font-bold border-b-2 border-dashed border-black text-black">
                <div className="flex justify-between">
                  <span>Subtotal Value</span>
                  <span className="font-black">{currency} {activeReprintSale.subtotal.toLocaleString()}</span>
                </div>
                {activeReprintSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Sales Tax</span>
                    <span className="font-black">{currency} {activeReprintSale.tax.toLocaleString()}</span>
                  </div>
                )}
                {activeReprintSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount Deduction</span>
                    <span className="font-black">-{currency} {activeReprintSale.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black border-y-2 border-black py-2 my-1 uppercase text-black">
                  <span>INVOICE GRAND TOTAL</span>
                  <span>{currency} {activeReprintSale.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-2.5 text-xs font-bold border-b-2 border-black text-black space-y-1">
                <div className="flex justify-between">
                  <span>Method: <strong>{activeReprintSale.paymentMethod}</strong></span>
                  <span>Change Return: <strong>{currency}{activeReprintSale.changeAmount.toLocaleString()}</strong></span>
                </div>
                <div className="flex justify-between items-center text-xs font-black pt-1">
                  <span>Registry Status:</span>
                  <span className={activeReprintSale.status === 'Returned' ? "text-rose-600 font-black" : "text-emerald-700 font-black"}>
                    {activeReprintSale.status === 'Returned' ? 'REFUNDED OR RETURNED' : 'PAID & ARCHIVED'}
                  </span>
                </div>
              </div>

              <div className="text-center pt-3 text-xs font-bold text-black select-none space-y-0.5">
                <p className="uppercase tracking-widest font-black">*** THANK YOU ***</p>
                {settings.receiptFooter && <p>{settings.receiptFooter}</p>}
                <p className="text-[10px] opacity-75">Duplicate Print Voucher Copy</p>
              </div>
            </div>

            {/* Reprint CTA */}
            <div className="mt-6 flex flex-col gap-2 print:hidden">
              <button
                onClick={handleBluetoothReprint}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Bluetooth className="w-4 h-4 text-white" />
                <span>Print via Bluetooth</span>
              </button>
              {activeReprintSale.status !== 'Returned' && (
                <button
                  onClick={() => handleWholeInvoiceRefund(activeReprintSale)}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 text-xs rounded-xl transition"
                >
                  Refund & Restock entire Invoice
                </button>
              )}
              <button
                onClick={() => setActiveReprintSale(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 text-xs rounded-xl transition"
              >
                Close Reprint View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
