import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Calendar, FileText, Info, TrendingDown, HelpCircle, AlertTriangle, BarChart3, Search
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { Expense } from '../types';
import { translations } from '../lib/translations';

interface ExpenseManagementProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
}

export default function ExpenseManagement({ db, onSaveDB }: ExpenseManagementProps) {
  const { expenses, settings } = db;
  const currency = settings.currency;
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Expense['category']>('All');

  // Form modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: 100,
    category: 'Miscellaneous' as Expense['category'],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.notes.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: 0,
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingExpense(null);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.amount <= 0) return;

    if (editingExpense) {
      // Edit
      const updated = expenses.map(item => {
        if (item.id === editingExpense.id) {
          return {
            ...item,
            ...formData,
            amount: Number(formData.amount)
          };
        }
        return item;
      });

      onSaveDB({
        ...db,
        expenses: updated
      });
      addLog('Expense Edit', `Edited store expense details: "${formData.title}"`);
    } else {
      // Add
      const newExp: Expense = {
        id: 'exp-' + Date.now(),
        ...formData,
        amount: Number(formData.amount)
      };

      // Deduct from Cash Flow Registers
      const updatedLedgers = [...db.ledgers];
      updatedLedgers.push({
        id: 'ldg-exp-' + Date.now(),
        accountType: 'cash',
        accountId: 'cash_register',
        type: 'credit', // cash spent
        amount: Number(formData.amount),
        balance: 0,
        date: new Date().toISOString(),
        description: `Logged Expense - ${formData.category}: ${formData.title}`
      });

      onSaveDB({
        ...db,
        expenses: [newExp, ...expenses],
        ledgers: updatedLedgers
      });
      addLog('Expense Add', `Logged new business expense payout: "${formData.title}" - ${currency} ${formData.amount}`);
    }

    setShowFormModal(false);
    resetForm();
  };

  const handleDeleteExpense = (exp: Expense) => {
    if (confirm(`Are you sure you want to delete expense "${exp.title}"?`)) {
      const remaining = expenses.filter(item => item.id !== exp.id);
      onSaveDB({
        ...db,
        expenses: remaining
      });
      addLog('Expense Delete', `Erased expense item: "${exp.title}"`);
    }
  };

  // Get total expense amount by category for visual bento analysis
  const getCategorySum = (cat: Expense['category']) => {
    return expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totalExpenseVolume = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.expense_registry}</h1>
          <p className="text-sm text-slate-400">{currentLang === 'ur' ? `کل اخراجات کا حجم:` : `Total running store expense accruals:`} <strong className="text-slate-650 dark:text-slate-200">{currency} {totalExpenseVolume.toLocaleString()}</strong></p>
        </div>
        <button
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow"
        >
          <Plus className="w-5 h-5" /> {t.log_expenditure_payout}
        </button>
      </div>

      {/* Categories Bento Grid Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['Rent', 'Electricity', 'Internet', 'Salary', 'Miscellaneous'] as const).map(cat => {
          const sum = getCategorySum(cat);
          const percent = totalExpenseVolume > 0 ? Math.round((sum / totalExpenseVolume) * 100) : 0;

          const catTranslationMap: Record<string, string> = {
            Rent: currentLang === 'ur' ? 'کرایہ' : 'Rent',
            Electricity: currentLang === 'ur' ? 'بجلی کا بل' : 'Electricity',
            Internet: currentLang === 'ur' ? 'انٹرنیٹ' : 'Internet',
            Salary: currentLang === 'ur' ? 'تنخواہ' : 'Salary',
            Miscellaneous: currentLang === 'ur' ? 'متفرق' : 'Miscellaneous'
          };

          return (
            <div key={cat} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{catTranslationMap[cat]}</span>
              <div className="text-base font-black text-slate-800 dark:text-slate-100">{currency} {sum.toLocaleString()}</div>
              <div className="w-full bg-slate-50 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold block pt-0.5">{percent}% {currentLang === 'ur' ? 'کل اخراجات کا حصہ' : 'of spent capital'}</span>
            </div>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search_bills}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-705/50 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-402 text-xs focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 text-slate-650 text-xs rounded-xl px-4 py-2 font-bold focus:outline-none shrink-0"
        >
          <option value="All">{t.all_cats}</option>
          <option value="Rent">{currentLang === 'ur' ? 'کرایہ' : 'Rent'}</option>
          <option value="Electricity">{currentLang === 'ur' ? 'بجلی کا بل' : 'Electricity'}</option>
          <option value="Internet">{currentLang === 'ur' ? 'انٹرنیٹ' : 'Internet'}</option>
          <option value="Salary">{currentLang === 'ur' ? 'تنخواہ' : 'Salary'}</option>
          <option value="Miscellaneous">{currentLang === 'ur' ? 'متفرق' : 'Miscellaneous'}</option>
        </select>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-slate-805 rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-855 text-slate-400 uppercase font-extrabold tracking-wider border-b">
              <tr>
                <th className="px-5 py-4">{currentLang === 'ur' ? 'اخراجات کا عنوان' : 'Expenditure Bill Title'}</th>
                <th className="px-5 py-4">{currentLang === 'ur' ? 'کیٹیگری' : 'Category Section'}</th>
                <th className="px-5 py-4">{t.date_lbl}</th>
                <th className="px-5 py-2">{currentLang === 'ur' ? 'تفصیل' : 'Detailed Remarks'}</th>
                <th className="px-5 py-4 text-right">{t.amount_paid}</th>
                <th className="px-5 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705/30">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {e.title}
                    </td>

                    <td className="px-5 py-3.5 font-bold uppercase text-[10.5px]">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                        {e.category === 'Rent' ? (currentLang === 'ur' ? 'کرایہ' : 'Rent') :
                         e.category === 'Electricity' ? (currentLang === 'ur' ? 'بجلی' : 'Electricity') :
                         e.category === 'Internet' ? (currentLang === 'ur' ? 'انٹرنیٹ' : 'Internet') :
                         e.category === 'Salary' ? (currentLang === 'ur' ? 'تنخواہ' : 'Salary') :
                         e.category === 'Miscellaneous' ? (currentLang === 'ur' ? 'متفرق' : 'Miscellaneous') : e.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 font-semibold">{e.date}</td>
                    
                    <td className="px-5 py-2 text-slate-500 italic max-w-56 truncate">{e.notes || 'N/A'}</td>

                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-850 dark:text-white">
                      {currency} {e.amount.toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => {
                            setFormData({
                              title: e.title,
                              amount: e.amount,
                              category: e.category,
                              date: e.date,
                              notes: e.notes
                            });
                            setEditingExpense(e);
                            setShowFormModal(true);
                          }}
                          className="p-1 px-2 border rounded-lg hover:bg-slate-50 text-slate-500 font-bold transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteExpense(e)}
                          className="p-1 px-2 text-rose-500 hover:text-rose-650 hover:bg-rose-50 border rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <TrendingDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No expenditures cataloged during active filters checklist.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL TRIGGER */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-sm w-full my-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-850 dark:text-white text-base">
                {editingExpense ? 'Modify Expenditure entry' : 'Log Expenditure Payout'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-200">✕ Close</button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">EXPENDITURE INVOICE TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="e.g. KElectric Bill June, Rent payout"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase">CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:bg-slate-800"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Internet">Internet</option>
                    <option value="Salary">Salary</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase">PAYMENT DATE</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">EXPENDITURE VALUE ({currency}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-sm font-black focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">EXPENDITURE REMARKS / NOTES</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                  placeholder="Receipt number references or details..."
                />
              </div>

              <div className="flex gap-2 text-xs pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-550 text-white font-bold rounded-xl transition shadow"
                >
                  Submit Exp Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
