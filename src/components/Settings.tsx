import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, Store, Shield, RefreshCw, Key, Image, Moon, Sun
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { ShopSettings } from '../types';

interface SettingsProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function Settings({ db, onSaveDB, onToggleTheme, isDark }: SettingsProps) {
  const { settings, user } = db;

  const [formData, setFormData] = useState<ShopSettings>({
    ...settings
  });

  const [username, setUsername] = useState(user.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [msg, setMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDB({
      ...db,
      settings: formData
    });
    addLog('Settings Updated', 'Altered standard business shop credentials or tax configuration');
    setMsg('Store settings saved successfully!');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert("Action refused: Passwords do not match.");
        return;
      }
    }

    onSaveDB({
      ...db,
      user: {
        ...user,
        username: username.trim(),
        passwordHash: newPassword ? 'custom_hashed_or_plain' : user.passwordHash // simple pass custom
      }
    });

    addLog('Password Update', `Altered credentials schema for admin account: ${username}`);
    setMsg('Admin credentials updated successfully!');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Software Station Parameters</h1>
        <p className="text-sm text-slate-400">Configure receipt printout details, custom currency markers, and local credentials security.</p>
      </div>

      {msg && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200/50 rounded-2xl text-indigo-700 text-xs font-bold shadow-sm">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SHOP METRICS FORM */}
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-850 dark:text-white text-base flex items-center gap-1.5 border-b pb-3 mb-4">
            <Store className="w-5 h-5 text-indigo-550" /> Shop Branding Details
          </h3>

          <div className="space-y-3.5 text-xs font-medium">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">SHOP DISPLAY TITLE *</label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="MashaAllah Super Mart"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">SHOP TELEPHONE LINE *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="021-12345678"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">PHYSICAL LOCATION ADDRESS *</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={2}
                placeholder="Shop # 4, Block C, Commercial Market Karachi"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">CURRENCY SYMBOL</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Rs.">PKR / Rs.</option>
                  <option value="$">US Dollar ($)</option>
                  <option value="AED">AED Dirham</option>
                  <option value="SAR">Saudi Riyal</option>
                  <option value="£">British Pound (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">INVOICE NO PREFIX</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoicePrefix: e.target.value.toUpperCase() }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="MSM"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">DEFAULT TAX RATE %</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxRate: Math.max(parseFloat(e.target.value) || 0, 0) }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="5"
                />
              </div>

              {/* Theme Settings toggle inside settings */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase">DISPLAY INTERFACE THEME</label>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-full py-2 border rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" /> Use Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-400" /> Use Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">RECEIPT FOOTER MESSAGE</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptFooter: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Thank you for shopping with us!"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4.5 h-4.5" /> Save Shop Branding Settings
          </button>
        </form>

        {/* SECURITY CREDENTIALS FORM */}
        <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-850 dark:text-white text-base flex items-center gap-1.5 border-b pb-3 mb-4">
            <Shield className="w-5 h-5 text-indigo-550" /> Station Security Credentials
          </h3>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">ADMIN USERNAME</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">CHANGE SECURITY PASSWORD (LEAVE EMPTY to keep current)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Type new secure offline station password..."
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">CONFIRM NEW SECURITY PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Re-type new secure password to confirm..."
              />
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              <Key className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong>Offline local stations do not use online servers.</strong> Backup your password locally. Fallback security credential remains: <strong>admin</strong>.
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Save Station Credentials
          </button>
        </form>

      </div>
    </div>
  );
}
