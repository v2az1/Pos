import React, { useRef, useState } from 'react';
import { 
  Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, FileJson, X
} from 'lucide-react';
import { DBState, getInitialDB, addLog } from '../db';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface BackupRestoreProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
}

export default function BackupRestore({ db, onSaveDB }: BackupRestoreProps) {
  const { settings, backups } = db;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [modal, setModal] = useState<{
    show: boolean;
    type: 'clean' | 'demo' | 'restore';
    parsedData?: DBState;
    fileName?: string;
    fileSizeString?: string;
    typedConfirmation?: string;
  }>({ show: false, type: 'clean', typedConfirmation: '' });

  // Trigger full JSON state download mimicking local offline SQLite backups
  const handleExportBackup = async () => {
    try {
      const dbString = JSON.stringify(db, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `offline_pos_backup_${timestamp}.json`;
      let sizeString = '';

      if (Capacitor.isNativePlatform()) {
        // Write backup file to native app cache directory
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: dbString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Use native share dialog so the user can easily copy/send/save it
        await Share.share({
          title: 'POS Database Backup',
          text: `POS database backup compiled on ${new Date().toLocaleDateString()}`,
          url: writeResult.uri,
          dialogTitle: 'Share POS Backup File'
        });

        const sizeKB = Math.round(dbString.length / 1024);
        sizeString = `${sizeKB} KB`;
      } else {
        const blob = new Blob([dbString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        sizeString = `${Math.round(blob.size / 1024)} KB`;
      }

      // Record backup log metadata
      const newBackupRecord = {
        id: 'bak-' + Date.now(),
        date: new Date().toISOString(),
        name: fileName,
        size: sizeString,
        type: 'manual' as const
      };

      onSaveDB({
        ...db,
        backups: [newBackupRecord, ...backups]
      });

      addLog('Backup Created', `Successfully compiled local JSON backup file: ${newBackupRecord.name}`);
      setMessage({ type: 'success', text: `Local station backup files generated! (${newBackupRecord.size})` });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to compile backup: ${err.message}` });
    }
  };

  // Import JSON files to restore DB states
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as DBState;

        // Simple validations
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
          setModal({
            show: true,
            type: 'restore',
            parsedData: parsed,
            fileName: file.name,
            fileSizeString: `${Math.round(content.length / 1024)} KB`,
            typedConfirmation: ''
          });
        } else {
          setMessage({ type: 'error', text: "Invalid Schema: The uploaded backup file format is unsupported or corrupted." });
          setTimeout(() => setMessage(null), 5000);
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: `Fatal JSON syntax parsing error: ${err.message}` });
        setTimeout(() => setMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    
    // clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Factory reset warning Trigger click
  const handleFactoryResetDatabase = () => {
    setModal({
      show: true,
      type: 'demo',
      typedConfirmation: ''
    });
  };

  // Reset to Clean Slate (0 products, 0 logs, 0 data)
  const handleResetToCleanSlate = () => {
    setModal({
      show: true,
      type: 'clean',
      typedConfirmation: ''
    });
  };

  const executeCleanSlate = () => {
    const cleanDb: DBState = {
      user: db.user,
      categories: [],
      products: [],
      customers: [
        { id: 'cust-1', name: 'Walk-In Customer', phone: '0000-0000000', address: 'N/A', email: 'walkin@pos.com', cnic: '00000-0000000-0', openingBalance: 0, currentBalance: 0 }
      ],
      suppliers: [],
      sales: [],
      purchases: [],
      expenses: [],
      ledgers: [],
      settings: db.settings,
      backups: [],
      holdCarts: [],
      activityLogs: [
        {
          id: 'log-' + Date.now(),
          action: 'System Wiped',
          details: 'Wiped all records to clean slate (0 products, empty sales charts)',
          date: new Date().toISOString()
        }
      ],
      isLoggedIn: db.isLoggedIn
    };

    onSaveDB(cleanDb);
    setMessage({ type: 'success', text: 'POS Database successfully erased! Products list and Sales charts are now completely empty (0).' });
    setTimeout(() => setMessage(null), 5000);
    setModal({ show: false, type: 'clean', typedConfirmation: '' });
  };

  const executeDemoReset = () => {
    const initialDb = getInitialDB();
    onSaveDB({
      ...initialDb,
      backups: [
        {
          id: 'bak-reset-' + Date.now(),
          date: new Date().toISOString(),
          name: 'System Initialized',
          size: '0 KB',
          type: 'auto' as const
        }
      ]
    });

    addLog('Factory Reset', 'Admin fully deleted database records and re-seeded default configurations');
    setMessage({ type: 'success', text: 'POS Database successfully erased and reset back to initial defaults!' });
    setTimeout(() => setMessage(null), 5050);
    setModal({ show: false, type: 'demo', typedConfirmation: '' });
  };

  const executeRestore = () => {
    if (!modal.parsedData || !modal.fileName || !modal.fileSizeString) return;
    const parsed = modal.parsedData;
    onSaveDB({
      ...parsed,
      backups: [
        {
          id: 'bak-restore-' + Date.now(),
          date: new Date().toISOString(),
          name: `Restored: ${modal.fileName}`,
          size: modal.fileSizeString,
          type: 'manual' as const
        },
        ...parsed.backups
      ]
    });

    addLog('Backup Restored', `Restored offline POS database using file backup: ${modal.fileName}`);
    setMessage({ type: 'success', text: `System database restored successfully using file: ${modal.fileName} !` });
    setTimeout(() => setMessage(null), 5000);
    setModal({ show: false, type: 'restore', typedConfirmation: '' });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Offline Backup & Restoration Center</h1>
        <p className="text-sm text-slate-400">Perfect data safety with absolutely no internet requirement. Backup files are downloaded directly onto your local machine.</p>
      </div>

      {message && (
        <div className={`p-4 border rounded-2xl text-xs font-bold shadow-sm flex items-start gap-2.5 ${message.type === 'success' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* BACKUP CRADLE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-850 dark:text-white text-base flex items-center gap-1.5 border-b pb-3.5 mb-4">
          <Download className="w-5 h-5 text-indigo-550" /> Compile Live Backups
        </h3>

        <div className="text-xs text-slate-450 leading-relaxed font-medium space-y-2">
          <p>Exporting compiler downloads a complete copy of products stock volumes, sales invoices, ledger audits, and business accounts configuration in standard format.</p>
          <p>Keep these files secured inside independent USB flash drives to guarantee protection from computer crashes.</p>
        </div>

        <button
          onClick={handleExportBackup}
          className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2 mt-2"
        >
          <Download className="w-4.5 h-4.5" /> Export DB Backup File (.json)
        </button>
      </div>

      {/* RESTORE CRADLE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-850 dark:text-white text-base flex items-center gap-1.5 border-b pb-3.5 mb-4">
          <Upload className="w-5 h-5 text-emerald-500" /> Restore backup Sheet
        </h3>

        <div className="text-xs text-slate-450 leading-relaxed font-semibold">
          <p className="text-rose-600 dark:text-indigo-400">WARNING: Restoring replacing active products and invoicing logs cannot be undone.</p>
        </div>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImportBackup}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2"
        >
          <Upload className="w-4.5 h-4.5" /> Upload Backup File to Restore
        </button>
      </div>

      {/* FACTORY ERASE SYSTEM */}
      <div className="bg-rose-50/50 dark:bg-rose-955/15 p-6 rounded-3xl border border-rose-102 dark:border-rose-954 space-y-4">
        <h3 className="font-extrabold text-rose-700 text-sm tracking-wide uppercase flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Factory Clear System Operations
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-rose-100 dark:border-rose-950/20 space-y-2">
            <span className="block text-xs font-black text-rose-650 dark:text-rose-400 uppercase tracking-wide">Option 1: Clean Slate Reset (0 Products, 0 Charts)</span>
            <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed font-medium">
              Completely wips all transactions, products, customer logs, and expenditures back to 0. Excellent for beginning real business operations. Your customized shop branding configuration is kept safe.
            </p>
            <button
              onClick={handleResetToCleanSlate}
              className="w-full py-2.5 bg-rose-650 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm active:scale-98"
            >
              Wipe to Clean Slate (0 Products & Data)
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Option 2: Reset to Retail Demo Data</span>
            <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed font-medium">
              Erase current database records and re-generate simulated products, sample bills, customer ledger tabs, and graphics for testing.
            </p>
            <button
              onClick={handleFactoryResetDatabase}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-98"
            >
              Re-seed Demonstration Data
            </button>
          </div>
        </div>
      </div>

      {/* State-driven Safety Confirmation Modal Overlay */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="reset-safety-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setModal({ show: false, type: 'clean', typedConfirmation: '' })}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-rose-650 dark:text-rose-450">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-tight">
                  {modal.type === 'clean' && 'Confirm Clean Slate Reset'}
                  {modal.type === 'demo' && 'Confirm Demo Data Seed'}
                  {modal.type === 'restore' && 'Confirm Database Restore'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {modal.type === 'clean' && 'This will completely erase all products, customer logs, sales invoices, ledger balances, and transactions. You will have 0 products, 0 charts, and 0 financial data. Custom shop settings (Shop Name, phone, address) will be preserved.'}
                  {modal.type === 'demo' && 'This will completely delete all active custom products, transaction registers, and customer data, and replace them with rich retail demo statistics, sample invoices, and pre-seeded dashboards.'}
                  {modal.type === 'restore' && `This will completely overwrite all current products, ledger records, transactions, actions, and settings with the contents of "${modal.fileName}" (${modal.fileSizeString}). This action cannot be revoked.`}
                </p>
              </div>

              {/* Requirement: Type confirmation for Demo Reset or Clean Reset or Restore */}
              {modal.type === 'demo' ? (
                <div className="w-full space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-left">
                    Type "RESET SYSTEM ELECTRICAL" to confirm:
                  </label>
                  <input
                    type="text"
                    value={modal.typedConfirmation || ''}
                    onChange={(e) => setModal({ ...modal, typedConfirmation: e.target.value })}
                    placeholder="Type RESET SYSTEM ELECTRICAL..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold uppercase transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div className="w-full space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-left font-sans">
                    Type "WIPE SYSTEM" to execute:
                  </label>
                  <input
                    type="text"
                    value={modal.typedConfirmation || ''}
                    onChange={(e) => setModal({ ...modal, typedConfirmation: e.target.value })}
                    placeholder="Type WIPE SYSTEM..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold uppercase transition focus:outline-none focus:ring-2 focus:ring-rose-450"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 w-full pt-1.5">
                <button
                  type="button"
                  onClick={() => setModal({ show: false, type: 'clean', typedConfirmation: '' })}
                  className="py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition active:scale-98"
                >
                  Cancel
                </button>

                {modal.type === 'clean' && (
                  <button
                    type="button"
                    onClick={executeCleanSlate}
                    disabled={modal.typedConfirmation !== 'WIPE SYSTEM'}
                    className={`py-2.5 text-white text-xs font-bold rounded-xl transition ${modal.typedConfirmation === 'WIPE SYSTEM' ? 'bg-rose-650 hover:bg-rose-500 active:scale-98 shadow' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-40 text-slate-400'}`}
                  >
                    Confirm Wipe
                  </button>
                )}

                {modal.type === 'demo' && (
                  <button
                    type="button"
                    onClick={executeDemoReset}
                    disabled={modal.typedConfirmation !== 'RESET SYSTEM ELECTRICAL'}
                    className={`py-2.5 text-white text-xs font-bold rounded-xl transition ${modal.typedConfirmation === 'RESET SYSTEM ELECTRICAL' ? 'bg-rose-650 hover:bg-rose-500 active:scale-98 shadow' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-40 text-slate-400'}`}
                  >
                    Confirm Reset
                  </button>
                )}

                {modal.type === 'restore' && (
                  <button
                    type="button"
                    onClick={executeRestore}
                    disabled={modal.typedConfirmation !== 'WIPE SYSTEM'}
                    className={`py-2.5 text-white text-xs font-bold rounded-xl transition ${modal.typedConfirmation === 'WIPE SYSTEM' ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-40 text-slate-400'}`}
                  >
                    Confirm Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
