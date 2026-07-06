import React, { useState } from 'react';
import { 
  BarChart3, FileText, Download, Printer, Landmark, TrendingUp, TrendingDown, CircleDollarSign, AlertCircle, Info, FileSpreadsheet
} from 'lucide-react';
import { DBState } from '../db';
import { translations } from '../lib/translations';

interface ReportsProps {
  db: DBState;
}

export default function Reports({ db }: ReportsProps) {
  const { products, sales, expenses, customers, suppliers, settings } = db;
  const currency = settings.currency;
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];

  const [activeReportType, setActiveReportType] = useState<
    'sales' | 'profit' | 'expense' | 'inventory' | 'tax'
  >('sales');

  // Helper calculations
  // 1. Sales Report aggregates
  const completedSales = sales.filter(s => s.status !== 'Returned');
  const grossSalesVolume = completedSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalTaxCollected = completedSales.reduce((acc, s) => acc + s.tax, 0);

  // 2. Profit Report aggregates
  let totalCostOfSoldGoods = 0;
  completedSales.forEach(s => {
    s.items.forEach(itm => {
      totalCostOfSoldGoods += (itm.costPrice * itm.quantity);
    });
  });
  const grossProfit = grossSalesVolume - totalCostOfSoldGoods;
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfitBreakdown = grossProfit - totalExpenses;

  // 3. Inventory valuation
  const inventoryTotalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const inventoryValuationCost = products.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0);
  const inventoryValuationSales = products.reduce((acc, p) => acc + (p.salePrice * p.quantity), 0);
  const anticipatedRetailProfit = inventoryValuationSales - inventoryValuationCost;

  // Simple CSV Downloader function
  const handleDownloadCSVReport = async () => {
    try {
      let csvContent = "";
      
      if (activeReportType === 'sales') {
        csvContent += "Invoice No,Customer,Date,Payment Channel,Tax Collected,Gross Value,Status\n";
        sales.forEach(s => {
          const custName = (customers.find(c => c.id === s.customerId)?.name || 'Walk-In').replace(/"/g, '""');
          csvContent += `"${s.invoiceNo}","${custName}","${s.date}","${s.paymentMethod}",${s.tax},${s.grandTotal},"${s.status}"\n`;
        });
      } else if (activeReportType === 'inventory') {
        csvContent += "SKU,Product Name,Remaining Qty,Unit,Cost Value,Retail Value,Anticipated Profit\n";
        products.forEach(p => {
          const escapedName = p.name.replace(/"/g, '""');
          const escapedUnit = p.unit.replace(/"/g, '""');
          csvContent += `"${p.sku}","${escapedName}",${p.quantity},"${escapedUnit}",${p.costPrice * p.quantity},${p.salePrice * p.quantity},${(p.salePrice - p.costPrice) * p.quantity}\n`;
        });
      } else if (activeReportType === 'expense') {
        csvContent += "Expenditure Title,Category,Date,Paid Out\n";
        expenses.forEach(e => {
          const escapedTitle = e.title.replace(/"/g, '""');
          const escapedCat = e.category.replace(/"/g, '""');
          csvContent += `"${escapedTitle}","${escapedCat}","${e.date}",${e.amount}\n`;
        });
      } else {
        csvContent += "Record,Statistic,Net Aggregate Value\n";
        csvContent += `General,Gross Sales Volume,${grossSalesVolume}\n`;
        csvContent += `General,Gross Profit,${grossProfit}\n`;
        csvContent += `General,Expenses Accumulations,${totalExpenses}\n`;
        csvContent += `General,Net Store Profit,${netProfitBreakdown}\n`;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `store_${activeReportType}_report_${timestamp}.csv`;

      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: `Store ${activeReportType.toUpperCase()} Report`,
          text: `POS terminal ${activeReportType} analytical report CSV compiled on ${new Date().toLocaleDateString()}`,
          url: writeResult.uri,
          dialogTitle: `Share ${activeReportType.toUpperCase()} Report CSV`
        });
      } else {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `store_${activeReportType}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(`Report export failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.analytical_reports}</h1>
          <p className="text-sm text-slate-400">{currentLang === 'ur' ? 'رپورٹس تیار کریں، پرنٹ کریں اور آف لائن آڈٹ کے لیے CSV فائل ڈاؤن لوڈ کریں۔' : 'Generate, print, and export CSV ledger books for offline auditing.'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-705 dark:text-slate-205 transition"
          >
            <Printer className="w-4 h-4 text-slate-450" /> {currentLang === 'ur' ? 'رپورٹ پرنٹ کریں' : 'Print Auditing Report'}
          </button>
          <button
            onClick={handleDownloadCSVReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow"
          >
            <Download className="w-4 h-4" /> {currentLang === 'ur' ? 'ایکسپورٹ CSV' : 'Export CSV Spreadsheet'}
          </button>
        </div>
      </div>

      {/* Reports tabs line */}
      <div className="flex flex-wrap gap-2 border-b pb-2 select-none text-xs font-bold">
        {(['sales', 'profit', 'expense', 'inventory', 'tax'] as const).map(tab => {
          const tabLabelMap: Record<string, string> = {
            sales: currentLang === 'ur' ? 'فروخت رپورٹ' : 'Sales Report',
            profit: currentLang === 'ur' ? 'منافع رپورٹ' : 'Profit Report',
            expense: currentLang === 'ur' ? 'اخراجات رپورٹ' : 'Expense Report',
            inventory: currentLang === 'ur' ? 'انوینٹری رپورٹ' : 'Inventory Report',
            tax: currentLang === 'ur' ? 'ٹیکس رپورٹ' : 'Tax Report'
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveReportType(tab)}
              className={`py-2 px-4 rounded-xl border transition ${activeReportType === tab ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-805 border-slate-150 hover:bg-slate-50 text-slate-600'}`}
            >
              {tabLabelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* Grid statistics depending on active report */}
      {activeReportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gross Sales Receipts</span>
              <div className="text-xl font-black text-slate-800 dark:text-white">{currency} {grossSalesVolume.toLocaleString()}</div>
              <p className="text-[10px] text-slate-404">{completedSales.length} invoice vouchers paid</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Refund Deduction Accruals</span>
              <div className="text-xl font-black text-rose-600">
                {currency} {sales.filter(s => s.status === 'Returned').reduce((acc, s) => acc + s.grandTotal, 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-404">{sales.filter(s => s.status === 'Returned').length} fully returned tickets</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Avg Basket Ticket Value</span>
              <div className="text-xl font-black text-indigo-610 dark:text-indigo-400">
                {currency} {completedSales.length > 0 ? Math.round(grossSalesVolume / completedSales.length).toLocaleString() : 0}
              </div>
              <p className="text-[10px] text-slate-404">Average customer transaction revenue</p>
            </div>
          </div>

          {/* Table display */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
            <div className="p-4 border-b font-extrabold text-xs uppercase tracking-wider text-slate-415 bg-slate-50 dark:bg-slate-855">Sales Ledger Journal Entries</div>
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 font-bold border-b">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Consumer</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Receipt Tax</th>
                  <th className="p-3.5 text-right">Invoiced Total</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-650 dark:text-slate-300">
                {sales.map((s, index) => (
                  <tr key={s.id || index} className="dark:hover:bg-slate-850/20">
                    <td className="p-3.5 font-bold font-mono">#{s.invoiceNo}</td>
                    <td className="p-3.5">{customers.find(c => c.id === s.customerId)?.name || 'Walk-In'}</td>
                    <td className="p-3.5">{s.date.split('T')[0]}</td>
                    <td className="p-3.5 text-right">{currency} {s.tax.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-bold text-slate-800 dark:text-white">{currency} {s.grandTotal.toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'Returned' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportType === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Business Revenue</span>
              <div className="text-xl font-black text-slate-800 dark:text-white">{currency} {grossSalesVolume.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Wholesale Goods Cost</span>
              <div className="text-xl font-black text-slate-700 dark:text-slate-350">{currency} {totalCostOfSoldGoods.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-805 p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gross margin Profit</span>
              <div className="text-xl font-black text-emerald-600">{currency} {grossProfit.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-805 p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-350">Net store Profit</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{currency} {netProfitBreakdown.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-205/65">
            <h3 className="font-extrabold text-sm text-slate-705 dark:text-slate-300">Net Profit Breakdown Analytical Summary</h3>
            <div className="space-y-3.5 pt-4 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-415 font-semibold">Gross sales billing returns</span>
                <span className="font-bold text-slate-800 dark:text-white">+{currency} {grossSalesVolume.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-415 font-semibold">Subtract actual wholesale cost value of shipped items</span>
                <span className="font-bold text-rose-500">-{currency} {totalCostOfSoldGoods.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2 font-bold text-slate-700">
                <span>Intermediate gross margin profits</span>
                <span className="text-emerald-500">={currency} {grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-415 font-semibold">Subtract running business operational expenditures (rent, utilities)</span>
                <span className="font-bold text-rose-500">-{currency} {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2.5 text-sm font-black text-slate-800 dark:text-white bg-white dark:bg-slate-900 p-3 rounded-xl border">
                <span>NET ACCOUNTING RETAIL INCOME</span>
                <span className={netProfitBreakdown >= 0 ? "text-emerald-555" : "text-rose-555"}>
                  {currency} {netProfitBreakdown.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Valuation Audits */}
      {activeReportType === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total units on Hand</span>
              <div className="text-xl font-black text-slate-800 dark:text-white">{inventoryTotalUnits} Pcs</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Book Stock Cost Valuation</span>
              <div className="text-xl font-black text-slate-655 dark:text-slate-350">{currency} {inventoryValuationCost.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Anticipated Retail Turnover</span>
              <div className="text-xl font-black text-emerald-500">{currency} {inventoryValuationSales.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
            <div className="p-4 border-b font-extrabold text-xs bg-slate-50 dark:bg-slate-855">Product SKU Stock Valuation Checklist</div>
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 font-bold border-b">
                <tr>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Product Title</th>
                  <th className="p-3.5 text-center">Qty On Hand</th>
                  <th className="p-3.5 text-right">Wholesale Cost Per</th>
                  <th className="p-3.5 text-right">Accumulated Cost value</th>
                  <th className="p-3.5 text-right">Accumulated Sale retail</th>
                  <th className="p-3.5 text-right">Potential Profit Value</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-605">
                {products.map((p, index) => (
                  <tr key={p.id || index} className="dark:hover:bg-slate-850/15">
                    <td className="p-3.5 font-bold font-mono text-slate-850 dark:text-slate-102">{p.sku}</td>
                    <td className="p-3.5">{p.name}</td>
                    <td className="p-3.5 text-center font-bold">{p.quantity} {p.unit}</td>
                    <td className="p-3.5 text-right">{currency}{p.costPrice.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-medium">{currency}{(p.costPrice * p.quantity).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-medium">{currency}{(p.salePrice * p.quantity).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-555">{currency}{((p.salePrice - p.costPrice) * p.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenditures ledger breakdown */}
      {activeReportType === 'expense' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
            <div className="p-4 border-b font-extrabold text-xs bg-slate-50 dark:bg-slate-855">All Store Expense Ledger Entries</div>
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 font-bold border-b font-mono text-[10px]">
                <tr>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Record date</th>
                  <th className="p-3.5">Remarks</th>
                  <th className="p-3.5 text-right">Charged Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-500">
                {expenses.map((e, index) => (
                  <tr key={e.id || index}>
                    <td className="p-3.5 font-bold text-slate-850 dark:text-slate-105">{e.title}</td>
                    <td className="p-3.5 font-bold uppercase">{e.category}</td>
                    <td className="p-3.5">{e.date}</td>
                    <td className="p-3.5 italic">{e.notes || 'No remarks'}</td>
                    <td className="p-3.5 text-right font-black text-rose-600">{currency} {e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Report details */}
      {activeReportType === 'tax' && (
        <div className="space-y-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border">
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">Indirect Sales Taxes Audit Book value</h3>
            <p className="text-xs text-slate-400">Total tax allocations captured on POS station checkouts</p>
          </div>

          <div className="space-y-3 pt-4 text-xs">
            <div className="flex justify-between border-b pb-2 text-slate-415">
              <span>Standard Default System-Wide Tax rate configured</span>
              <span className="font-bold text-slate-800 dark:text-white">{settings.taxRate}%</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-slate-415">
              <span>Total invoices checking output</span>
              <span className="font-semibold text-slate-655">{completedSales.length} Paid tickets</span>
            </div>
            <div className="flex justify-between text-base font-black bg-slate-50 p-3 rounded-xl border">
              <span>TOTAL ACCUMULATED SALES TAX IN register drawer</span>
              <span className="text-indigo-600 dark:text-indigo-400">{currency} {totalTaxCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
