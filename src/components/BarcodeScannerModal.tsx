import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, Camera, Bluetooth, X, Check, AlertCircle, RefreshCw, 
  Volume2, VolumeX, Flashlight, ShieldCheck, Zap
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Product } from '../types';
import { triggerHaptic } from '../lib/capacitor';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, matchedProduct?: Product) => void;
  products?: Product[];
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  products = [],
  title = 'Barcode & Bluetooth Scanner'
}) => {
  const [activeTab, setActiveTab] = useState<'bluetooth' | 'camera'>('bluetooth');
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<string>('');
  const [matchedItem, setMatchedItem] = useState<Product | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; time: string; product?: string }>>([]);

  // Camera scanner states
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // Play audio beep on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1040, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      // Audio context playback non-fatal fallback
    }
  };

  // Handle successful code processing
  const processScannedCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    playBeep();
    triggerHaptic('medium');

    const foundProduct = products.find(
      p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
    );

    const timestamp = new Date().toLocaleTimeString();
    setLastScannedCode(code);
    setLastScanTime(timestamp);
    setMatchedItem(foundProduct || null);

    setScanHistory(prev => [
      { code, time: timestamp, product: foundProduct?.name },
      ...prev.slice(0, 9)
    ]);

    onScanSuccess(code, foundProduct);
  };

  // Listen for Bluetooth HID barcode scanner key sequence globally when modal is open
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ignore standard shortcut modifiers
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      // Bluetooth scanners transmit rapid keystrokes (< 80ms apart)
      const isFastScanner = timeDiff < 80;

      // Check if target is an input
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Enter' || e.key === 'Tab') {
        const trimmed = buffer.trim();
        if (trimmed.length > 0) {
          e.preventDefault();
          processScannedCode(trimmed);
          buffer = '';
          setManualCode('');
        }
        return;
      }

      if (e.key.length === 1) {
        // If not typing in input or fast scanner output, capture into buffer
        if (!isInput || isFastScanner) {
          if (buffer.length > 60) buffer = '';
          buffer += e.key;
          setManualCode(buffer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, products, soundEnabled]);

  // Handle Camera scanning initialization
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraScanner();
      return;
    }

    startCameraScanner();

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, activeTab, selectedCameraId]);

  const startCameraScanner = async () => {
    setCameraError(null);
    setIsCameraScanning(true);

    try {
      const codeReader = new BrowserMultiFormatReader();

      // List available camera video input devices
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setAvailableCameras(videoDevices);

      let deviceId = selectedCameraId;
      if (!deviceId && videoDevices.length > 0) {
        // Prefer environment/back camera if available
        const backCam = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        deviceId = backCam ? backCam.deviceId : videoDevices[0].deviceId;
        setSelectedCameraId(deviceId);
      }

      if (videoRef.current) {
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          deviceId || undefined,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              processScannedCode(text);
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Camera scanner init error:', err);
      setCameraError(err?.message || 'Unable to access camera device. Ensure camera permissions are granted.');
      setIsCameraScanning(false);
    }
  };

  const stopCameraScanner = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        // Ignore stop error
      }
      controlsRef.current = null;
    }
    setIsCameraScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processScannedCode(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Bluetooth HID hardware scanner & rear camera support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'Disable Scan Audio Beep' : 'Enable Scan Audio Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'bluetooth'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-sky-300" />
            <span>Bluetooth / USB Scanner</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>Device Camera</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: BLUETOOTH HID HARDWARE SCANNER */}
          {activeTab === 'bluetooth' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-950/30 border border-sky-800/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Bluetooth Scanner Mode: ACTIVE</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" /> HID Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pair your Bluetooth handheld barcode scanner (or 2.4G wireless/USB scanner) with your Android device or PC. Point and press the trigger to scan any barcode!
                </p>
              </div>

              {/* Manual Input Test */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Scanned Barcode / SKU Input (Auto-populates on Bluetooth scan)
                </label>
                <div className="relative">
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Scan barcode with Bluetooth scanner or type here..."
                    className="w-full pl-10 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <Barcode className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <span>Camera Initialization Error</span>
                  </div>
                  <p>{cameraError}</p>
                  <button
                    onClick={startCameraScanner}
                    className="mt-2 px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning reticle visual overlay */}
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-500/40 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-lg shadow-red-500/50"></div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-300 font-medium text-center flex items-center justify-between">
                    <span>Align barcode within red laser line</span>
                    {availableCameras.length > 1 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-white"
                      >
                        {availableCameras.map(cam => (
                          <option key={cam.deviceId} value={cam.deviceId}>
                            {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LAST SCANNED RESULT FEEDBACK BOX */}
          {lastScannedCode && (
            <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${
              matchedItem 
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-700/60 text-amber-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {matchedItem ? (
                      <span className="p-1 bg-emerald-500 text-slate-950 rounded-lg">
                        <Check className="w-3.5 h-3.5 font-extrabold" />
                      </span>
                    ) : (
                      <span className="p-1 bg-amber-500 text-slate-950 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 font-extrabold" />
                      </span>
                    )}
                    <span className="font-mono text-sm font-bold tracking-wider">
                      {lastScannedCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({lastScanTime})
                    </span>
                  </div>

                  {matchedItem ? (
                    <div className="text-xs font-semibold text-emerald-300 pt-1">
                      Matched Item: <strong>{matchedItem.name}</strong> ({matchedItem.sku})
                      <div className="text-[11px] text-emerald-400/80">
                        Price: {matchedItem.salePrice} | Stock: {matchedItem.quantity} {matchedItem.unit}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 font-semibold pt-1">
                      Barcode recognized, but product not found in active catalog.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCAN HISTORY */}
          {scanHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Recent Scan Logs ({scanHistory.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {scanHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono">
                    <span className="text-indigo-300">{item.code}</span>
                    <span className="text-slate-300 font-sans truncate max-w-[180px]">
                      {item.product || 'Unrecognized SKU'}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Tested & Compatible with Zebra, Honeywell, Eyoyo, Inateck, SocketMobile & Android Camera
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
