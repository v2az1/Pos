import React, { useState, useEffect } from 'react';
import { Bluetooth, Printer, RefreshCcw, Check, X, ShieldAlert, Sparkles, Trash2, Terminal, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import {
  getSavedPrinter,
  getSavedPaperSize,
  savePaperSize,
  savePrinter,
  forgetPrinter,
  getPairedBluetoothDevices,
  printTestReceiptViaBluetooth,
  getPrinterLogs,
  clearPrinterLogs,
  scanAndSelectPrinter,
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
  const [pairedDevices, setPairedDevices] = useState<BluetoothPrinterDevice[]>([]);
  const [paperSize, setPaperSizeState] = useState<'58mm' | '80mm'>('58mm');
  const [isLoadingPaired, setIsLoadingPaired] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPrinterInfo();
    }
  }, [isOpen]);

  const refreshLogs = () => {
    setLogs(getPrinterLogs());
  };

  const loadPrinterInfo = async () => {
    setIsLoadingPaired(true);
    try {
      const dev = await getSavedPrinter();
      const size = await getSavedPaperSize();
      setSavedDevice(dev);
      setPaperSizeState(size);

      // Fetch paired devices from Android system settings
      const res = await getPairedBluetoothDevices();
      refreshLogs();

      if (res.success && res.devices) {
        setPairedDevices(res.devices);
        // If no saved device yet, but paired devices exist, default to first one
        if (!dev && res.devices.length > 0) {
          const autoDev = res.devices[0];
          await savePrinter(autoDev);
          setSavedDevice(autoDev);
          if (onPrinterConnected) onPrinterConnected(autoDev);
        }
      } else if (res.error) {
        triggerToast(res.error, 'warning', 'Bluetooth Paired Devices');
      }
    } catch (err: any) {
      console.error('Error loading printer info:', err);
    } finally {
      setIsLoadingPaired(false);
      refreshLogs();
    }
  };

  const handleSelectPairedDevice = async (device: BluetoothPrinterDevice) => {
    try {
      await savePrinter(device);
      setSavedDevice(device);
      if (onPrinterConnected) onPrinterConnected(device);
      triggerToast(`Connected to paired printer ${device.name} (${device.address || device.id})`, 'success', 'Printer Selected');
      refreshLogs();
    } catch (err: any) {
      triggerToast(`Failed selecting printer: ${err.message}`, 'error');
    }
  };

  const handlePaperSizeChange = async (size: '58mm' | '80mm') => {
    setPaperSizeState(size);
    await savePaperSize(size);
    triggerToast(`Paper size format set to ${size}`, 'info', 'Printer Settings');
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      triggerToast('Querying Bluetooth thermal printers...', 'info', 'Bluetooth Scanner');
      const dev = await scanAndSelectPrinter();
      setSavedDevice(dev);
      if (onPrinterConnected) onPrinterConnected(dev);
      triggerToast(`Connected & paired with ${dev.name}`, 'success', 'Printer Connected');
      await loadPrinterInfo();
    } catch (err: any) {
      console.error('Scan error:', err);
      triggerToast(err.message || 'Failed to connect to Bluetooth printer', 'error', 'Printer Connection Failed');
      refreshLogs();
    } finally {
      setIsScanning(false);
      refreshLogs();
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      triggerToast('Sending ESC/POS payload via direct Bluetooth SPP socket...', 'info', 'Test Printing');
      await printTestReceiptViaBluetooth(settings, paperSize, savedDevice?.address || savedDevice?.id);
      refreshLogs();
      triggerToast('Test print sent successfully!', 'success', 'Test Complete');
    } catch (err: any) {
      console.error('Test print error:', err);
      refreshLogs();
      triggerToast(`Test print failed: ${err.message}`, 'error', 'Print Failed');
    } finally {
      setIsTesting(false);
      refreshLogs();
    }
  };

  const handleForgetPrinter = async () => {
    await forgetPrinter();
    setSavedDevice(null);
    triggerToast('Bluetooth printer removed from active memory.', 'warning', 'Printer Removed');
    refreshLogs();
  };

  const handleClearLogs = () => {
    clearPrinterLogs();
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Bluetooth ESC/POS Thermal Printer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct Android SPP Socket & Paired Device Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* Active Printer Status Card */}
          <div className={`p-4 rounded-xl border transition ${
            savedDevice 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' 
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  savedDevice 
                    ? 'bg-emerald-500 text-white shadow-xs' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {savedDevice ? savedDevice.name : 'No Active Printer Selected'}
                    </span>
                    {savedDevice && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3" /> Active Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    {savedDevice ? `MAC Address: ${savedDevice.address || savedDevice.id}` : 'Select a paired ESC/POS thermal printer below'}
                  </p>
                </div>
              </div>

              {savedDevice && (
                <button
                  onClick={handleForgetPrinter}
                  title="Remove default printer"
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Enumerate Already Paired Devices */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Paired Bluetooth Printers ({pairedDevices.length})</span>
              </label>
              <button
                type="button"
                onClick={loadPrinterInfo}
                disabled={isLoadingPaired}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCcw className={`w-3 h-3 ${isLoadingPaired ? 'animate-spin' : ''}`} />
                <span>Refresh Paired</span>
              </button>
            </div>

            {isLoadingPaired ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                <RefreshCcw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                Querying paired Bluetooth devices from Android OS...
              </div>
            ) : pairedDevices.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pairedDevices.map((dev) => {
                  const isSelected = savedDevice && (savedDevice.id === dev.id || savedDevice.address === dev.address);
                  return (
                    <div
                      key={dev.id}
                      onClick={() => handleSelectPairedDevice(dev)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`} />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{dev.name}</div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">{dev.address || dev.id}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select Printer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  No paired Bluetooth devices detected
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Pair your ESC/POS thermal printer in <strong>Android Bluetooth Settings</strong> first, then tap Refresh.
                </p>
              </div>
            )}
          </div>

          {/* Paper Size Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Thermal Paper Width Format
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
          <div className="space-y-2.5 pt-1">
            {savedDevice && (
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer active:scale-98"
              >
                {isTesting ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Connecting & Printing Test Receipt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Print Diagnostic ESC/POS Test Receipt</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
            >
              {isScanning ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Scanning Devices...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Scan / Choose Bluetooth Device</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible Detailed Diagnostic Log Console */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-slate-200">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Connection Logs ({logs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {logs.length > 0 && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                    Latest: {logs[logs.length - 1].slice(0, 30)}...
                  </span>
                )}
                {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showLogs && (
              <div className="p-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                  <span>Android SPP / Bluetooth Log Stream</span>
                  <button
                    onClick={handleClearLogs}
                    className="text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  {logs.length > 0 ? (
                    logs.map((logMsg, i) => (
                      <div
                        key={i}
                        className={
                          logMsg.includes('ERROR') || logMsg.includes('WARNING')
                            ? 'text-rose-400 font-semibold'
                            : logMsg.includes('SUCCESS') || logMsg.includes('connected') || logMsg.includes('Found Paired')
                            ? 'text-emerald-400 font-semibold'
                            : 'text-slate-300'
                        }
                      >
                        {logMsg}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No log entries recorded yet. Tap "Print Diagnostic ESC/POS Test Receipt" to run full pipeline check.</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-800 flex justify-end shrink-0">
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
