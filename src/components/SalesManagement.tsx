import React, { useState } from 'react';
import { 
  History, Search, Calendar, FileText, RefreshCcw, Printer, Info, CheckCircle2, XCircle
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { Sale } from '../types';

interface SalesManagementProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
}

export default function SalesManagement({ db, onSaveDB }: SalesManagementProps) {
  const { sales, customers, settings } = db;
  const currency = settings.currency;

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Sales Invoice Archive</h1>
        <p className="text-sm text-slate-400">Review historic receipts, reprint checkout vouchers, and process consumer refunds.</p>
      </div>

      {/* Timeline Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice registries by ID or Client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none rounded-xl"
          />
        </div>

        <div className="flex gap-2 text-xs shrink-0 font-bold text-slate-600">
          {(['All', 'Today', 'Week', 'Month'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl border transition ${filterType === type ? 'bg-indigo-650 text-white border-indigo-650' : 'bg-transparent border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Invoice Voucher ID</th>
                <th className="px-5 py-4">Client Detail</th>
                <th className="px-5 py-4">Checkout Date Timestamp</th>
                <th className="px-5 py-4">Channel</th>
                <th className="px-5 py-4 text-right">Subtotal</th>
                <th className="px-5 py-4 text-right">Grand Total Paid</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Voucher Operation Actions</th>
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
                      {customers.find(c => c.id === s.customerId)?.name || 'Walk-In Customer'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-500">{s.paymentMethod}</td>

                    <td className="px-5 py-3.5 text-right text-slate-500 font-semibold">{currency} {s.subtotal.toLocaleString()}</td>

                    <td className="px-5 py-3.5 text-right font-black text-slate-850 dark:text-white text-xs">{currency} {s.grandTotal.toLocaleString()}</td>

                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${s.status === 'Returned' ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955'}`}>
                        {s.status === 'Returned' ? 'Refunded' : 'Completed'}
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
                            Refund Return
                          </button>
                        )}
                        <button
                          onClick={() => setActiveReprintSale(s)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-505" /> Print
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
            <div className="bg-white text-black p-2 font-sans text-xs tracking-tight leading-normal max-h-[460px] overflow-y-auto pr-1" id="reprint-ticket-box">
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-wider uppercase">{settings.shopName}</h2>
                <p className="text-[10px] whitespace-pre-line text-slate-500 leading-tight">{settings.address}</p>
                <p className="text-[10px]">Contact: <strong>{settings.phone}</strong></p>
              </div>

              <div className="py-2.5 space-y-0.5 text-[10.5px] block border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Voucher: <strong>#{activeReprintSale.invoiceNo}</strong></span>
                  <span>Date: {new Date(activeReprintSale.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {customers.find(c => c.id === activeReprintSale.customerId)?.name || 'Walk-In'}</span>
                  <span>Account: <strong>Offline Store</strong></span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[10.5px]">
                <div className="grid grid-cols-12 font-bold mb-1 border-b pb-1">
                  <span className="col-span-6">Catalog Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-right">Sum</span>
                </div>
                <div className="space-y-1">
                  {activeReprintSale.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 leading-relaxed">
                      <span className="col-span-6 truncate font-medium">{it.name}</span>
                      <span className="col-span-2 text-center font-bold">{it.quantity}</span>
                      <span className="col-span-2 text-right">{currency}{it.salePrice.toLocaleString()}</span>
                      <span className="col-span-2 text-right font-black">{currency}{it.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2.5 text-right space-y-1 text-[10.5px] border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal value</span>
                  <span>{currency} {activeReprintSale.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Tax rate</span>
                  <span>{currency} {activeReprintSale.tax.toLocaleString()}</span>
                </div>
                {activeReprintSale.discount > 0 && (
                  <div className="flex justify-between text-rose-650 font-bold">
                    <span>Discount Offset</span>
                    <span>-{currency} {activeReprintSale.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1">
                  <span>INVOICE GRAND TOTAL</span>
                  <span>{currency} {activeReprintSale.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Method: <strong>{activeReprintSale.paymentMethod}</strong></span>
                  <span>Change return: {currency}{activeReprintSale.changeAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold pt-1.5 leading-relaxed text-indigo-705">
                  <span>Billing Registry Status:</span>
                  <span className={activeReprintSale.status === 'Returned' ? "text-rose-650" : "text-emerald-650"}>
                    {activeReprintSale.status === 'Returned' ? 'REFUNDED OR RETURNED' : 'PAID & ARCHIVED'}
                  </span>
                </div>
              </div>

              <div className="text-center pt-3 text-[9px] text-slate-400 border-t mt-4 leading-normal select-none">
                <p>Duplicate Print Voucher Copy.</p>
                <p>{settings.receiptFooter}</p>
              </div>
            </div>

            {/* Reprint CTA */}
            <div className="mt-6 flex flex-col gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4.5 h-4.5" /> Trigger Printer
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
