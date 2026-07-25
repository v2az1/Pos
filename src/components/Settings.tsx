import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, Store, Shield, RefreshCw, Key, Image, Moon, Sun, Globe,
  Printer, Bluetooth, CheckCircle2, AlertCircle, WifiOff
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { ShopSettings } from '../types';
import { translations } from '../lib/translations';
import { 
  isBluetoothSupported, 
  getSavedPrinterDeviceName, 
  getSavedPaperSize, 
  savePaperSize, 
  connectBluetoothPrinter, 
  disconnectBluetoothPrinter, 
  printTestReceiptViaBluetooth,
  isPrinterConnected
} from '../lib/bluetoothPrinter';

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

  // Bluetooth printer states
  const [btPrinterName, setBtPrinterName] = useState<string>(getSavedPrinterDeviceName());
  const [paperSize, setPaperSizeState] = useState<'58mm' | '80mm' | 'A4'>(getSavedPaperSize());
  const [btStatus, setBtStatus] = useState<string>('');
  const [isBtConnecting, setIsBtConnecting] = useState<boolean>(false);

  const currentLang = formData.language || 'en';
  const t = translations[currentLang];

  const handleConnectBT = async () => {
    setIsBtConnecting(true);
    setBtStatus('');
    try {
      const devName = await connectBluetoothPrinter();
      setBtPrinterName(devName);
      setBtStatus(currentLang === 'ur' ? 'بلیوٹوتھ پرنٹر کامیابی سے منسلک ہو گیا!' : 'Bluetooth printer paired successfully!');
    } catch (err: any) {
      setBtStatus(err.message || 'Bluetooth connection failed.');
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleDisconnectBT = async () => {
    await disconnectBluetoothPrinter();
    setBtPrinterName('');
    setBtStatus(currentLang === 'ur' ? 'پرنٹر منقطع ہو گیا' : 'Bluetooth printer disconnected.');
  };

  const handleTestBTPrint = async () => {
    try {
      setBtStatus('Sending ESC/POS diagnostic buffer to printer...');
      await printTestReceiptViaBluetooth(formData);
      setBtStatus(currentLang === 'ur' ? 'ٹیسٹ پرنٹ کامیابی سے بھیج دیا گیا!' : 'Test receipt sent successfully to thermal printer!');
    } catch (err: any) {
      setBtStatus(`Test print error: ${err.message}`);
    }
  };

  const handlePaperSizeChange = (sz: '58mm' | '80mm' | 'A4') => {
    setPaperSizeState(sz);
    savePaperSize(sz);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDB({
      ...db,
      settings: formData
    });
    addLog('Settings Updated', 'Altered standard business shop credentials or tax configuration');
    setMsg(formData.language === 'ur' ? 'اسٹور کی سیٹنگز کامیابی سے محفوظ ہو گئیں!' : 'Store settings saved successfully!');
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
        passwordHash: newPassword ? newPassword : user.passwordHash
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.software_parameters}</h1>
        <p className="text-sm text-slate-400">{t.configure_receipt}</p>
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
            <Store className="w-5 h-5 text-indigo-550" /> {t.shop_branding}
          </h3>

          <div className="space-y-3.5 text-xs font-medium">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase">{t.shop_title}</label>
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
              <label className="block text-slate-400 font-bold mb-1 uppercase">{t.shop_phone}</label>
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
              <label className="block text-slate-400 font-bold mb-1 uppercase">{t.physical_address}</label>
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
                <label className="block text-slate-400 font-bold mb-1 uppercase">{t.currency_symbol}</label>
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
                <label className="block text-slate-400 font-bold mb-1 uppercase">{t.invoice_prefix}</label>
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
                <label className="block text-slate-400 font-bold mb-1 uppercase">{t.default_tax}</label>
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
                <label className="block text-slate-400 font-bold mb-1 uppercase">{t.display_theme}</label>
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
              <label className="block text-slate-400 font-bold mb-1 uppercase">{t.receipt_footer}</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptFooter: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Thank you for shopping with us!"
              />
            </div>

            {/* Language Settings Selection Block */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-750/50 space-y-2 mt-2">
              <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> {t.language}
              </label>
              <select
                value={formData.language || 'en'}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as any }))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="en">English (UK/US)</option>
                <option value="ur">اردو (Urdu)</option>
              </select>
              <span className="block text-[10px] text-slate-400 leading-tight">Shifts full platform terminologies, layout direction cues, and printed receipt outputs into Urdu text instantly.</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4.5 h-4.5" /> {t.save_branding}
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

        {/* BLUETOOTH THERMAL PRINTER CONFIGURATION */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-base flex items-center gap-2">
              <Bluetooth className="w-5 h-5 text-indigo-500" />
              <span>{currentLang === 'ur' ? 'بلیوٹوتھ تھرمل پرنٹر سیٹ اپ' : 'Bluetooth Thermal Printer Setup'}</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 self-start sm:self-auto">
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paper: <strong>{paperSize}</strong></span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status & Connection Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {currentLang === 'ur' ? 'پرنٹر کنکشن کی حالت' : 'Printer Status'}
                </span>
                {btPrinterName ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    <WifiOff className="w-3.5 h-3.5" /> Not Connected
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {btPrinterName || (currentLang === 'ur' ? 'کوئی پرنٹر منسلک نہیں ہے' : 'No Bluetooth Thermal Printer Paired')}
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  {currentLang === 'ur'
                    ? 'براہ کرم اپنا 58mm یا 80mm تھرمل بلیوٹوتھ پرنٹر آن کریں اور جوڑنے کے لیے بٹن پر کلک کریں۔'
                    : 'Connect directly to your 58mm/80mm Bluetooth ESC/POS receipt printer without needing print preview windows.'}
                </p>
              </div>

              {btStatus && (
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  {btStatus}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConnectBT}
                  disabled={isBtConnecting}
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{isBtConnecting ? (currentLang === 'ur' ? 'تلاش جاری ہے...' : 'Searching...') : (currentLang === 'ur' ? 'پرنٹر جوڑیں' : 'Pair Printer')}</span>
                </button>

                {btPrinterName && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestBTPrint}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1 active:scale-98"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{currentLang === 'ur' ? 'ٹیسٹ پرنٹ' : 'Test Print'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectBT}
                      className="py-2.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition active:scale-98"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Paper Format & Compatibility Settings */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {currentLang === 'ur' ? 'تھرمل پیپر کا سائز' : 'Receipt Paper Size & Protocol'}
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('58mm')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-extrabold border transition ${
                    paperSize === '58mm'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  58mm (2 Inch)
                </button>

                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('80mm')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-extrabold border transition ${
                    paperSize === '80mm'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  80mm (3 Inch)
                </button>

                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('A4')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-extrabold border transition ${
                    paperSize === 'A4'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Standard A4
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10.5px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{currentLang === 'ur' ? 'موبائل اور ٹیبلٹ کی رہنمائی' : 'Mobile & POS Compatibility Note'}</span>
                </div>
                <p className="leading-snug">
                  {currentLang === 'ur'
                    ? 'اگر آپ کا پرنٹر ویب بلیوٹوتھ میں نظر نہیں آتا تو یقینی بنائیں کہ ڈیوائس پر بلیوٹوتھ آن ہے اور پرنٹر پیئرنگ موڈ میں ہے۔'
                    : 'ESC/POS commands are transmitted directly via GATT Bluetooth. If Web Bluetooth popup is unavailable in embedded frames, click "Open in New Tab" to pair.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
