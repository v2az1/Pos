import React, { useState, useEffect } from 'react';
import { Bluetooth, Printer, RefreshCcw, Check, X, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import {
  getSavedPrinter,
  getSavedPaperSize,
  savePaperSize,
  scanAndSelectPrinter,
  printTestReceiptViaBluetooth,
  forgetPrinter,
  BluetoothPrinterDevice
} from '../lib/bluetoothPrinter';
import { ShopSettings } from '../types';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onPrinterConnected?: (device: BluetoothPrinterDevice) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
  settings,
  onPrinterConnected,
  triggerToast
}) => {
  const [savedDevice, setSavedDevice] = useState<BluetoothPrinterDevice | null>(null);
  const [paperSize, setPaperSizeState] = useState<'58mm' | '80mm'>('58mm');
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrinterInfo();
    }
  }, [isOpen]);

  const loadPrinterInfo = async () => {
    const dev = await getSavedPrinter();
    const size = await getSavedPaperSize();
    setSavedDevice(dev);
    setPaperSizeState(size);
  };

  const handlePaperSizeChange = async (size: '58mm' | '80mm') => {
    setPaperSizeState(size);
    await savePaperSize(size);
    triggerToast(`Paper size format set to ${size}`, 'info', 'Printer Settings');
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      triggerToast('Scanning for nearby Bluetooth ESC/POS thermal printers...', 'info', 'Bluetooth Scanner');
      const dev = await scanAndSelectPrinter();
      setSavedDevice(dev);
      if (onPrinterConnected) onPrinterConnected(dev);
      triggerToast(`Connected & paired with ${dev.name}`, 'success', 'Printer Connected');
    } catch (err: any) {
      console.error('Scan error:', err);
      triggerToast(err.message || 'Failed to connect to Bluetooth printer', 'error', 'Printer Connection Failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      triggerToast('Sending ESC/POS diagnostic test payload to thermal printer...', 'info', 'Test Printing');
      await printTestReceiptViaBluetooth(settings, paperSize);
      triggerToast('Test print sent successfully!', 'success', 'Test Complete');
    } catch (err: any) {
      console.error('Test print error:', err);
      triggerToast(`Test print failed: ${err.message}`, 'error', 'Print Failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleForgetPrinter = async () => {
    await forgetPrinter();
    setSavedDevice(null);
    triggerToast('Bluetooth printer disconnected & removed from memory.', 'warning', 'Printer Removed');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Bluetooth Thermal Printer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pair ESC/POS 58mm / 80mm printers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          
          {/* Active Printer Status Card */}
          <div className={`p-4 rounded-xl border transition ${
            savedDevice 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' 
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  savedDevice 
                    ? 'bg-emerald-500 text-white shadow-xs' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {savedDevice ? savedDevice.name : 'No Printer Paired'}
                    </span>
                    {savedDevice && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {savedDevice ? `Device ID: ${savedDevice.id}` : 'Connect a 58mm or 80mm Bluetooth ESC/POS receipt printer'}
                  </p>
                </div>
              </div>

              {savedDevice && (
                <button
                  onClick={handleForgetPrinter}
                  title="Forget printer"
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Paper Size Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Thermal Paper Size Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePaperSizeChange('58mm')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>58mm (2-Inch / 32 Cols)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaperSizeChange('80mm')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>80mm (3-Inch / 48 Cols)</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer active:scale-98"
            >
              {isScanning ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Scanning Bluetooth Printers...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" />
                  <span>{savedDevice ? 'Scan & Change Printer' : 'Scan & Pair Bluetooth Printer'}</span>
                </>
              )}
            </button>

            {savedDevice && (
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
              >
                {isTesting ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Printing Diagnostic Test...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Print ESC/POS Test Receipt</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Helper Tips */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
            <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Direct ESC/POS Printing
            </div>
            <p>
              Once paired, receipts print instantly to your thermal printer without opening any Android print dialogs or share sheets.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
