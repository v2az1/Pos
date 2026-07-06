import React, { useState } from 'react';
import { 
  TrendingUp, CircleDollarSign, Package, AlertTriangle, 
  Users, Truck, ArrowUpRight, ArrowDownRight, RefreshCcw, ShoppingCart, Info, TrendingDown
} from 'lucide-react';
import { DBState } from '../db';
import { Product, Sale, Expense } from '../types';
import { translations } from '../lib/translations';

interface DashboardProps {
  db: DBState;
  onRefresh: () => void;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ db, onRefresh, onNavigate }: DashboardProps) {
  // Let's compute statistics dynamically based on current DBState
  const { products, sales, expenses, customers, suppliers, settings } = db;
  const currency = settings.currency;
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];

  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Today's Sales
  const todaySales = sales
    .filter(s => s.date.startsWith(todayStr) && s.status !== 'Returned');
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // 2. Weekly Sales (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklySales = sales
    .filter(s => new Date(s.date) >= oneWeekAgo && s.status !== 'Returned');
  const weeklySalesTotal = weeklySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // 3. Monthly Sales (last 30 days)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthlySales = sales
    .filter(s => new Date(s.date) >= oneMonthAgo && s.status !== 'Returned');
  const monthlySalesTotal = monthlySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // 4. Total Revenue
  const totalRevenue = sales
    .filter(s => s.status !== 'Returned')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // 5. Cost of Goods Sold (COGS) & Profit
  let totalCostOfGoodsSold = 0;
  sales.filter(s => s.status !== 'Returned').forEach(s => {
    s.items.forEach(itm => {
      totalCostOfGoodsSold += (itm.costPrice * itm.quantity);
    });
  });
  
  const totalProfit = totalRevenue - totalCostOfGoodsSold;

  // 6. Total Expenses
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // 7. Net Profit (Profit - Expenses)
  const netProfit = totalProfit - totalExpenses;

  // 8. Low Stock Items count
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
  const outOfStockProducts = products.filter(p => p.quantity <= 0);

  // Chart data calculations: Last 7 days Sales
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    const daySales = sales
      .filter(s => s.date.startsWith(dayStr) && s.status !== 'Returned');
    
    const salesSum = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
    
    let costOfSales = 0;
    daySales.forEach(s => {
      s.items.forEach(itm => {
        costOfSales += (itm.costPrice * itm.quantity);
      });
    });
    
    const profitSum = salesSum - costOfSales;

    return {
      dayStr,
      dayName,
      sales: salesSum,
      profit: profitSum,
    };
  });

  // Find the highest sales value in the 7 days to scale our SVG chart properly
  const maxSalesIn7Days = Math.max(...last7DaysData.map(d => d.sales), 1000);

  // 9. Best Selling Products calculation
  const productSalesMap: { [id: string]: { name: string; qty: number; total: number } } = {};
  sales.filter(s => s.status !== 'Returned').forEach(s => {
    s.items.forEach(itm => {
      if (!productSalesMap[itm.productId]) {
        productSalesMap[itm.productId] = { name: itm.name, qty: 0, total: 0 };
      }
      productSalesMap[itm.productId].qty += itm.quantity;
      productSalesMap[itm.productId].total += itm.total;
    });
  });

  const bestSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {t.dashboard}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time analytics for <strong className="text-slate-700 dark:text-slate-200">{settings.shopName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onRefresh();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-75 *:transition active:scale-98"
          >
            <RefreshCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t.refresh_data}
          </button>
          <button
            onClick={() => onNavigate('pos')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-transparent rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            {t.pos_terminal}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.today_sales}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{currency} {todaySalesTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.successful_receipts.replace('{count}', todaySales.length.toString())}</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.days_revenue}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{currency} {weeklySalesTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{t.active_flow_tracking}</span>
            </div>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Cost Margin & Gross Profit */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.gross_profit}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-850 dark:text-emerald-400">{currency} {totalProfit.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.avg_margin}: <strong className="text-slate-700 dark:text-slate-200">{totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%</strong>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.total_expenses}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-450">{currency} {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.net_profit}: <strong className="text-slate-800 dark:text-slate-350">{currency} {netProfit.toLocaleString()}</strong>
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Auxiliary Mini Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-100/60 dark:bg-indigo-900/40 rounded-lg text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.total_catalog}</div>
            <div className="text-base font-bold text-slate-800 dark:text-white">{products.length} Products</div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-rose-100/60 dark:bg-rose-900/40 rounded-lg text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.low_stock}</div>
            <div className="text-base font-bold text-rose-600 dark:text-rose-450">{t.items_count.replace('{count}', lowStockProducts.length.toString())}</div>
          </div>
        </div>
      </div>

      {/* Main Charts & Top Products section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (Pure SVG High-Fidelity Custom Representation) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.weekly_billing_flow}</h3>
              <p className="text-xs text-slate-400">{t.compare_gross_profit}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>{t.gross_revenue}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{t.net_profit}</span>
            </div>
          </div>

          {/* Render Vector Bar-Chart */}
          <div className="relative pt-6 pb-2 h-64 flex flex-col justify-between">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400/80">
              <div className="border-b border-slate-100 dark:border-slate-700/60 pb-1 w-full text-right">{currency} {Math.round(maxSalesIn7Days).toLocaleString()}</div>
              <div className="border-b border-slate-100 dark:border-slate-700/60 pb-1 w-full text-right">{currency} {Math.round(maxSalesIn7Days * 0.66).toLocaleString()}</div>
              <div className="border-b border-slate-100 dark:border-slate-700/60 pb-1 w-full text-right">{currency} {Math.round(maxSalesIn7Days * 0.33).toLocaleString()}</div>
              <div className="border-b border-slate-100 dark:border-slate-700/60 pb-1 w-full text-right">{currency} 0</div>
            </div>

            <div className="flex items-end justify-around h-48 pt-4 z-10 w-full">
              {last7DaysData.map((d, index) => {
                const salesHeight = (d.sales / maxSalesIn7Days) * 100;
                const profitHeight = (d.profit / maxSalesIn7Days) * 100;

                return (
                  <div key={index} className="flex flex-col items-center group relative w-12">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-800 text-slate-100 text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-20 shadow-xl whitespace-nowrap">
                      <div>{t.gross_revenue}: <strong className="text-indigo-300">{currency} {d.sales.toLocaleString()}</strong></div>
                      <div>{t.net_profit}: <strong className="text-emerald-300">{currency} {d.profit.toLocaleString()}</strong></div>
                    </div>

                    <div className="flex gap-1.5 items-end justify-center h-44 w-full">
                      {/* Revenue Bar */}
                      <div 
                        className="w-4 bg-indigo-500 hover:bg-indigo-400 rounded-t-md transition-all duration-300"
                        style={{ height: `${Math.max(salesHeight, 4)}%` }}
                      ></div>
                      {/* Profit Bar */}
                      <div 
                        className="w-4 bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all duration-300"
                        style={{ height: `${Math.max(profitHeight, 2)}%` }}
                      ></div>
                    </div>

                    <span className="mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{d.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Selling Products Summary list */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.best_selling_products}</h3>
            <p className="text-xs text-slate-400">{t.highest_volume_retail}</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-750 transition duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{t.units_shipped.replace('{count}', p.qty.toString())}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 shrink-0">
                    {currency} {p.total.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
                <Info className="w-5 h-5 text-slate-300" />
                {t.no_inventory_shipped}
              </div>
            )}
          </div>
          {bestSellingProducts.length > 0 && (
            <button
              onClick={() => onNavigate('reports')}
              className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-500 py-1.5 transition block"
            >
              {t.generate_complete_shipping_reports}
            </button>
          )}
        </div>
      </div>

      {/* Critical Stock Warn & Active Logs Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Low Stock Watchlist */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.critical_stock_alerts}</h3>
              <p className="text-xs text-rose-500">{t.products_nearing_depleted}</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-450">
              {lowStockProducts.length} {t.low_stock.toLowerCase()}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-sm max-h-[260px] overflow-y-auto pr-1">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 truncate text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-400">SKU: {p.sku} | {t.measuring_unit}: {p.unit}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">
                      {t.stock}: <strong className={p.quantity <= 0 ? "text-rose-600 font-bold" : "text-amber-500 font-bold"}>
                        {p.quantity}
                      </strong> <span className="text-slate-400 font-medium">/ min {p.minStock}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {t.all_sufficiently_stocked}
              </div>
            )}
          </div>
        </div>

        {/* System Activity Logs (Audit Trail) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.local_audit_log}</h3>
              <p className="text-xs text-slate-400">{t.continuous_background_operations}</p>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-[10px] text-slate-400 hover:text-slate-300"
            >
              {t.audits_settings}
            </button>
          </div>

          <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
            {db.activityLogs.slice(0, 6).map((l) => (
              <div key={l.id} className="flex gap-3 text-xs">
                <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">
                  {new Date(l.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-700 dark:text-slate-200">{l.action}</div>
                  <div className="text-[10px] text-slate-400 truncate leading-relaxed">{l.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
