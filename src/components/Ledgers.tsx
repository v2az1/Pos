import React, { useState } from 'react';
import { 
  CircleDollarSign, ArrowUpRight, ArrowDownRight, Search, Landmark 
} from 'lucide-react';
import { DBState } from '../db';

interface LedgersProps {
  db: DBState;
}

export default function Ledgers({ db }: LedgersProps) {
  const { ledgers, settings } = db;
  const currency = settings.currency;

  const [search, setSearch] = useState('');

  // Calculate dynamic Cash Register stats
  const cashLedgerList = ledgers.filter(l => l.accountType === 'cash');
  // Debit increases cash, credit decreases cash asset
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

  return (
    <div className="space-y-6">
      
      {/* Top title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight font-sans">Business Ledgers & Cash Registry</h1>
        <p className="text-sm text-slate-400">Consolidated double-entry transaction history of cash inside register drawer.</p>
      </div>

      {/* Cash register statistics card */}
      <div className="bg-white dark:bg-slate-805 p-5 rounded-2xl border border-slate-150 border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> Cash register Inflows</span>
          <div className="text-xl font-black text-emerald-555">{currency} {cashIn.toLocaleString()}</div>
          <p className="text-[10px] text-slate-404">Voucher checkouts & manual ledger entries</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ArrowDownRight className="w-4 h-4 text-rose-500" /> Cash register Outflows</span>
          <div className="text-xl font-black text-rose-555">{currency} {cashOut.toLocaleString()}</div>
          <p className="text-[10px] text-slate-404">Logged store and utility expenses</p>
        </div>

        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-15/20">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><CircleDollarSign className="w-4.5 h-4.5 text-indigo-500" /> Net Operating Cash On Hand</span>
          <div className="text-2xl font-black text-indigo-150 dark:text-white">{currency} {currentCashInRegister.toLocaleString()}</div>
          <p className="text-[10px] text-slate-440">Physical liquid assets operating inside register drawer</p>
        </div>
      </div>

      {/* Search line */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter entries in cash ledger journal..."
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
                <th className="px-5 py-4">Transaction Timestamp</th>
                <th className="px-5 py-4">Account Target</th>
                <th className="px-5 py-4">Details Description Remarks</th>
                <th className="px-5 py-4 text-center">Type</th>
                <th className="px-5 py-4 text-right">Debit / Credit Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-104 dark:divide-slate-705/35">
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${l.type === 'debit' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20' : 'bg-rose-50 text-rose-605 dark:bg-rose-955/20'}`}>
                        {l.type === 'debit' ? 'Debit (+)' : 'Credit (-)'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-black">
                      <span className={l.type === 'debit' ? "text-emerald-555" : "text-rose-555"}>
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
  );
}
