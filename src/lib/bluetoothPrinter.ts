/**
 * Native Bluetooth ESC/POS Thermal Printer Engine
 * Compatible with Capacitor 7/8 and Android 11–16
 * Supports Android 12+ permissions (BLUETOOTH_CONNECT, BLUETOOTH_SCAN),
 * enumerating paired devices, direct SPP socket connections via MAC address,
 * and step-by-step detailed diagnostic logging.
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Sale, ShopSettings } from '../types';

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  address?: string;
  bonded?: boolean;
  connected?: boolean;
  type?: number;
}

export interface NativeBluetoothPrinterPlugin {
  checkAndRequestPermissions(): Promise<{ granted: boolean; logs: string[] }>;
  getBluetoothStatus(): Promise<{ available: boolean; enabled: boolean; permissionGranted: boolean; logs: string[] }>;
  getPairedDevices(): Promise<{ success: boolean; devices: BluetoothPrinterDevice[]; error?: string; logs: string[] }>;
  printRawBytes(options: { address: string; bytesBase64: string }): Promise<{ success: boolean; message?: string; error?: string; logs: string[] }>;
}

// Register custom Capacitor native plugin bridge
const NativeBTPrinter = registerPlugin<NativeBluetoothPrinterPlugin>('BluetoothPrinter');

const PRINTER_STORAGE_KEY = 'pos_bt_thermal_printer_device';
const PAPER_SIZE_STORAGE_KEY = 'pos_bt_thermal_paper_size';

// In-memory diagnostic log collector
let globalPrinterLogs: string[] = [];

export const getPrinterLogs = (): string[] => [...globalPrinterLogs];
export const clearPrinterLogs = (): void => { globalPrinterLogs = []; };
export const addPrinterLog = (msg: string): void => {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${msg}`;
  globalPrinterLogs.push(entry);
  console.log(entry);
};

// Web Bluetooth GATT Printer Service UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb', // SPP UUID
  '00004953-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000180a-0000-1000-8000-00805f9b34fb'
];

let webActiveDeviceHandle: any = null;
let webActiveCharHandle: any = null;

/**
 * Get saved paper size preference
 */
export const getSavedPaperSize = async (): Promise<'58mm' | '80mm'> => {
  try {
    const { value } = await Preferences.get({ key: PAPER_SIZE_STORAGE_KEY });
    if (value === '80mm' || value === '58mm') {
      return value;
    }
  } catch (e) {
    console.debug('Failed reading paper size preference:', e);
  }
  return '58mm';
};

/**
 * Save paper size preference
 */
export const savePaperSize = async (size: '58mm' | '80mm'): Promise<void> => {
  try {
    await Preferences.set({ key: PAPER_SIZE_STORAGE_KEY, value: size });
    addPrinterLog(`Paper size saved as ${size}`);
  } catch (e) {
    console.error('Failed saving paper size preference:', e);
  }
};

/**
 * Get saved Bluetooth printer device from storage
 */
export const getSavedPrinter = async (): Promise<BluetoothPrinterDevice | null> => {
  try {
    const { value } = await Preferences.get({ key: PRINTER_STORAGE_KEY });
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.debug('Failed reading saved printer preference:', e);
  }
  return null;
};

/**
 * Save default selected Bluetooth printer
 */
export const savePrinter = async (device: BluetoothPrinterDevice): Promise<void> => {
  try {
    await Preferences.set({
      key: PRINTER_STORAGE_KEY,
      value: JSON.stringify({
        id: device.id,
        name: device.name,
        address: device.address || device.id,
        bonded: true
      })
    });
    addPrinterLog(`Saved active printer: ${device.name} (${device.address || device.id})`);
  } catch (e) {
    console.error('Failed saving printer preference:', e);
  }
};

/**
 * Forget saved printer
 */
export const forgetPrinter = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: PRINTER_STORAGE_KEY });
    webActiveDeviceHandle = null;
    webActiveCharHandle = null;
    addPrinterLog('Cleared saved Bluetooth printer memory.');
  } catch (e) {
    console.error('Failed removing saved printer preference:', e);
  }
};

/**
 * Get Bluetooth adapter status & runtime permissions
 */
export const getBluetoothStatus = async (): Promise<{
  available: boolean;
  enabled: boolean;
  permissionGranted: boolean;
  logs: string[];
}> => {
  clearPrinterLogs();
  addPrinterLog('Checking Bluetooth hardware & runtime permission status...');

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeBTPrinter.getBluetoothStatus();
      if (res.logs && Array.isArray(res.logs)) {
        res.logs.forEach(l => addPrinterLog(l));
      }
      return res;
    } catch (err: any) {
      addPrinterLog(`Native Bluetooth status check warning: ${err.message}`);
      return { available: true, enabled: true, permissionGranted: true, logs: getPrinterLogs() };
    }
  } else {
    const nav = navigator as any;
    const available = !!nav.bluetooth;
    addPrinterLog(`Web Bluetooth API available: ${available}`);
    return {
      available,
      enabled: available,
      permissionGranted: available,
      logs: getPrinterLogs()
    };
  }
};

/**
 * Enumerate already paired/bonded Bluetooth devices from Android system settings
 */
export const getPairedBluetoothDevices = async (): Promise<{
  success: boolean;
  devices: BluetoothPrinterDevice[];
  error?: string;
  logs: string[];
}> => {
  clearPrinterLogs();
  addPrinterLog('Querying paired ESC/POS thermal printers from Android OS...');

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Request Android 12+ permissions first if not granted
      addPrinterLog('Step 1: Validating Android BLUETOOTH_CONNECT & SCAN permissions...');
      const permRes = await NativeBTPrinter.checkAndRequestPermissions();
      if (permRes.logs && Array.isArray(permRes.logs)) {
        permRes.logs.forEach(l => addPrinterLog(l));
      }

      if (!permRes.granted) {
        addPrinterLog('ERROR: Bluetooth permissions were not granted by user.');
        return {
          success: false,
          devices: [],
          error: 'Bluetooth permissions required. Please allow permissions when prompted.',
          logs: getPrinterLogs()
        };
      }

      // 2. Query paired devices
      addPrinterLog('Step 2: Retrieving bonded Bluetooth devices via Android BluetoothAdapter...');
      const pairedRes = await NativeBTPrinter.getPairedDevices();
      if (pairedRes.logs && Array.isArray(pairedRes.logs)) {
        pairedRes.logs.forEach(l => addPrinterLog(l));
      }

      if (pairedRes.success && pairedRes.devices) {
        addPrinterLog(`Successfully loaded ${pairedRes.devices.length} paired Bluetooth device(s).`);
        return {
          success: true,
          devices: pairedRes.devices,
          logs: getPrinterLogs()
        };
      } else {
        return {
          success: false,
          devices: [],
          error: pairedRes.error || 'Failed retrieving paired Bluetooth devices.',
          logs: getPrinterLogs()
        };
      }
    } catch (err: any) {
      addPrinterLog(`Error fetching paired devices: ${err.message}`);
      return {
        success: false,
        devices: [],
        error: err.message || 'Error querying paired Bluetooth devices.',
        logs: getPrinterLogs()
      };
    }
  } else {
    // Web environment fallback
    addPrinterLog('Web browser mode: checking saved device or Web Bluetooth scanner...');
    const saved = await getSavedPrinter();
    const mockList: BluetoothPrinterDevice[] = saved ? [saved] : [];
    return {
      success: true,
      devices: mockList,
      logs: getPrinterLogs()
    };
  }
};

/**
 * Scan & Pair a Bluetooth Printer
 * For native Android: Returns list of paired devices or initiates pairing
 * For Web: Triggers browser requestDevice dialog
 */
export const scanAndSelectPrinter = async (): Promise<BluetoothPrinterDevice> => {
  addPrinterLog('Initiating Bluetooth printer scan/select process...');

  if (Capacitor.isNativePlatform()) {
    // 1. Query paired devices first
    const res = await getPairedBluetoothDevices();
    if (res.success && res.devices.length > 0) {
      addPrinterLog(`Found ${res.devices.length} paired device(s). Prompting user to select printer.`);
      // Default to first paired printer if auto-selecting, or user selects in modal
      const firstDev = res.devices[0];
      await savePrinter(firstDev);
      return firstDev;
    }

    if (res.error) {
      throw new Error(res.error);
    }

    throw new Error('No paired Bluetooth printers found in Android Settings. Please pair your ESC/POS thermal printer in Android Bluetooth settings first.');
  } else {
    // Web Bluetooth flow
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error('Web Bluetooth is not supported on this web browser. Use Chrome or Android native build.');
    }

    addPrinterLog('Opening browser Bluetooth device scan chooser...');
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS
    });

    if (!device) {
      throw new Error('No Bluetooth device selected.');
    }

    const devObj: BluetoothPrinterDevice = {
      id: device.id,
      name: device.name || 'Bluetooth ESC/POS Printer',
      address: device.id,
      bonded: true
    };

    // Connect Web GATT
    addPrinterLog(`Connecting GATT server to ${devObj.name}...`);
    const server = await device.gatt.connect();

    let printableChar: any = null;
    for (const uuid of PRINTER_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(uuid);
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            printableChar = c;
            break;
          }
        }
      } catch (e) {}
      if (printableChar) break;
    }

    if (!printableChar) {
      throw new Error('Connected to Bluetooth device, but no ESC/POS writeable GATT characteristic was found.');
    }

    webActiveDeviceHandle = device;
    webActiveCharHandle = printableChar;

    await savePrinter(devObj);
    return devObj;
  }
};

/**
 * Transmit ESC/POS binary payload to printer
 * Uses direct MAC address & SPP UUID socket connection on Android
 */
export const transmitESCPOSToPrinter = async (data: Uint8Array, targetAddress?: string): Promise<void> => {
  clearPrinterLogs();
  addPrinterLog(`Preparing to transmit ${data.length} bytes of ESC/POS commands...`);

  let address = targetAddress;
  if (!address) {
    const saved = await getSavedPrinter();
    if (saved) {
      address = saved.address || saved.id;
    }
  }

  if (Capacitor.isNativePlatform()) {
    if (!address) {
      addPrinterLog('No paired printer selected. Attempting to fetch paired devices list...');
      const pairedRes = await getPairedBluetoothDevices();
      if (pairedRes.success && pairedRes.devices.length > 0) {
        const first = pairedRes.devices[0];
        address = first.address || first.id;
        await savePrinter(first);
      } else {
        throw new Error('No paired Bluetooth thermal printer found. Please pair printer in Android settings.');
      }
    }

    addPrinterLog(`Target Printer Address: ${address}`);

    // Convert Uint8Array to base64
    let binaryStr = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binaryStr += String.fromCharCode(data[i]);
    }
    const base64Data = btoa(binaryStr);

    addPrinterLog('Invoking Native Android Bluetooth Printer Plugin...');
    const printRes = await NativeBTPrinter.printRawBytes({
      address: address!,
      bytesBase64: base64Data
    });

    if (printRes.logs && Array.isArray(printRes.logs)) {
      printRes.logs.forEach(l => addPrinterLog(l));
    }

    if (!printRes.success) {
      throw new Error(printRes.error || 'Failed sending raw print commands to Bluetooth printer.');
    }

    addPrinterLog('Print operation completed successfully!');
    return;
  } else {
    // Web Bluetooth transmission
    addPrinterLog('Transmitting via Web Bluetooth GATT...');
    if (!webActiveCharHandle) {
      await scanAndSelectPrinter();
    }

    if (!webActiveCharHandle) {
      throw new Error('Web Bluetooth printer characteristic is not ready.');
    }

    const CHUNK_SIZE = 100;
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      if (webActiveCharHandle.properties.writeWithoutResponse) {
        await webActiveCharHandle.writeValueWithoutResponse(chunk);
      } else {
        await webActiveCharHandle.writeValue(chunk);
      }
      await new Promise(r => setTimeout(r, 20));
    }

    addPrinterLog('Web Bluetooth print payload sent successfully.');
  }
};

/**
 * ESC/POS Command Constants
 */
const ESC = 0x1b;
const GS = 0x1d;

const escpos = {
  init: () => new Uint8Array([ESC, 0x40]),
  alignLeft: () => new Uint8Array([ESC, 0x61, 0]),
  alignCenter: () => new Uint8Array([ESC, 0x61, 1]),
  alignRight: () => new Uint8Array([ESC, 0x61, 2]),
  boldOn: () => new Uint8Array([ESC, 0x45, 1]),
  boldOff: () => new Uint8Array([ESC, 0x45, 0]),
  sizeHeader: () => new Uint8Array([GS, 0x21, 0x11]),
  sizeGrandTotal: () => new Uint8Array([GS, 0x21, 0x11]),
  sizeNormal: () => new Uint8Array([GS, 0x21, 0x00]),
  lineFeed: (count = 1) => {
    const buf = new Uint8Array(count);
    buf.fill(0x0a);
    return buf;
  },
  cutPaper: () => new Uint8Array([GS, 0x56, 0x41, 0x03]),
};

const encoder = new TextEncoder();
const strToBytes = (str: string): Uint8Array => encoder.encode(str);

const concatChunks = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const res = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    res.set(c, offset);
    offset += c.length;
  }
  return res;
};

const formatRow2Col = (left: string, right: string, width: number): string => {
  const availableLeft = width - right.length - 1;
  if (left.length > availableLeft) {
    const truncated = left.slice(0, Math.max(availableLeft, 1));
    const pad = width - truncated.length - right.length;
    return truncated + ' '.repeat(Math.max(pad, 1)) + right;
  }
  const pad = width - left.length - right.length;
  return left + ' '.repeat(Math.max(pad, 1)) + right;
};

const formatItemRow = (
  name: string,
  qty: number,
  unitPrice: number,
  total: number,
  currency: string,
  width: number
): string[] => {
  const lines: string[] = [];
  const rightCol = `${qty}x${unitPrice} = ${currency}${total}`;

  if (name.length + rightCol.length + 1 <= width) {
    lines.push(formatRow2Col(name, rightCol, width));
  } else {
    let remaining = name;
    while (remaining.length > width) {
      lines.push(remaining.slice(0, width));
      remaining = remaining.slice(width);
    }
    if (remaining.length > 0) {
      lines.push(remaining);
    }
    lines.push(formatRow2Col(`  (${qty} pcs @ ${currency}${unitPrice})`, `${currency}${total}`, width));
  }

  return lines;
};

/**
 * Print Sale Receipt via Bluetooth ESC/POS
 */
export const printReceiptViaBluetooth = async (
  sale: Sale,
  settings: ShopSettings,
  currency: string,
  customerName = 'Walk-In Customer',
  overridePaperSize?: '58mm' | '80mm',
  targetAddress?: string
): Promise<void> => {
  const paperSize = overridePaperSize || (await getSavedPaperSize());
  const cols = paperSize === '80mm' ? 48 : 32;
  const lineSeparator = '='.repeat(cols);
  const thinSeparator = '-'.repeat(cols);

  const chunks: Uint8Array[] = [];

  chunks.push(escpos.init());

  // Header
  chunks.push(escpos.alignCenter());
  chunks.push(escpos.boldOn());
  chunks.push(escpos.sizeHeader());
  chunks.push(strToBytes(`${settings.shopName}\n`));
  chunks.push(escpos.sizeNormal());
  chunks.push(escpos.boldOff());

  if (settings.address) {
    chunks.push(strToBytes(`${settings.address}\n`));
  }
  if (settings.phone) {
    chunks.push(strToBytes(`Phone: ${settings.phone}\n`));
  }

  chunks.push(escpos.boldOn());
  chunks.push(strToBytes(`*** CASH SALES RECEIPT ***\n`));
  chunks.push(escpos.boldOff());
  chunks.push(strToBytes(`${lineSeparator}\n`));

  // Invoice Details
  chunks.push(escpos.alignLeft());
  chunks.push(strToBytes(formatRow2Col(`INVOICE: #${sale.invoiceNo}`, new Date(sale.date).toLocaleDateString(), cols) + '\n'));
  chunks.push(strToBytes(formatRow2Col(`TIME: ${new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, `CLIENT: ${customerName}`, cols) + '\n'));
  chunks.push(strToBytes(`STATION: POS Register #1\n`));
  chunks.push(strToBytes(`${thinSeparator}\n`));

  // Items
  chunks.push(escpos.boldOn());
  chunks.push(strToBytes(formatRow2Col('ITEM DESCRIPTION', 'QTY x PRICE   TOTAL', cols) + '\n'));
  chunks.push(escpos.boldOff());
  chunks.push(strToBytes(`${thinSeparator}\n`));

  for (const item of sale.items) {
    const itemLines = formatItemRow(item.name, item.quantity, item.salePrice, item.total, currency, cols);
    for (const line of itemLines) {
      chunks.push(strToBytes(`${line}\n`));
    }
  }

  chunks.push(strToBytes(`${thinSeparator}\n`));

  // Totals
  chunks.push(escpos.alignLeft());
  chunks.push(strToBytes(formatRow2Col('Subtotal:', `${currency}${sale.subtotal.toLocaleString()}`, cols) + '\n'));
  if (sale.tax > 0) {
    chunks.push(strToBytes(formatRow2Col('Sales Tax:', `${currency}${sale.tax.toLocaleString()}`, cols) + '\n'));
  }
  if (sale.discount > 0) {
    chunks.push(strToBytes(formatRow2Col('Discount:', `-${currency}${sale.discount.toLocaleString()}`, cols) + '\n'));
  }

  chunks.push(strToBytes(`${lineSeparator}\n`));

  chunks.push(escpos.alignLeft());
  chunks.push(escpos.boldOn());
  chunks.push(escpos.sizeGrandTotal());
  chunks.push(strToBytes(formatRow2Col('TOTAL:', `${currency}${sale.grandTotal.toLocaleString()}`, cols / 2) + '\n'));
  chunks.push(escpos.sizeNormal());
  chunks.push(escpos.boldOff());

  chunks.push(strToBytes(`${lineSeparator}\n`));

  // Payment
  chunks.push(strToBytes(formatRow2Col(`Payment (${sale.paymentMethod}):`, `${currency}${sale.receivedAmount.toLocaleString()}`, cols) + '\n'));
  if (sale.changeAmount > 0) {
    chunks.push(escpos.boldOn());
    chunks.push(strToBytes(formatRow2Col('Change Return:', `${currency}${sale.changeAmount.toLocaleString()}`, cols) + '\n'));
    chunks.push(escpos.boldOff());
  }

  chunks.push(strToBytes(`${lineSeparator}\n`));

  // Footer
  chunks.push(escpos.alignCenter());
  chunks.push(escpos.boldOn());
  chunks.push(strToBytes('*** THANK YOU FOR YOUR BUSINESS ***\n'));
  chunks.push(escpos.boldOff());

  if (settings.receiptFooter) {
    chunks.push(strToBytes(`${settings.receiptFooter}\n`));
  }
  chunks.push(strToBytes('Powered by Wholesale POS Station\n'));

  chunks.push(escpos.lineFeed(4));
  chunks.push(escpos.cutPaper());

  const binaryPayload = concatChunks(chunks);
  await transmitESCPOSToPrinter(binaryPayload, targetAddress);
};

/**
 * Print Diagnostic Test Receipt via Bluetooth ESC/POS
 */
export const printTestReceiptViaBluetooth = async (
  settings: ShopSettings,
  overridePaperSize?: '58mm' | '80mm',
  targetAddress?: string
): Promise<void> => {
  const paperSize = overridePaperSize || (await getSavedPaperSize());
  const cols = paperSize === '80mm' ? 48 : 32;
  const lineSeparator = '='.repeat(cols);

  const chunks: Uint8Array[] = [
    escpos.init(),
    escpos.alignCenter(),
    escpos.boldOn(),
    escpos.sizeHeader(),
    strToBytes(`${settings.shopName || 'POS STATION'}\n`),
    escpos.sizeNormal(),
    escpos.boldOff(),
    strToBytes('BLUETOOTH PRINTER TEST RECEIPT\n'),
    strToBytes(`${new Date().toLocaleString()}\n`),
    strToBytes(`${lineSeparator}\n`),
    escpos.alignLeft(),
    strToBytes(`Paper Format: ${paperSize} (${cols} Columns)\n`),
    strToBytes('Protocol: Native Android ESC/POS Socket (SPP)\n'),
    strToBytes('Status: Operational & Connected\n'),
    strToBytes(`${lineSeparator}\n`),
    escpos.alignCenter(),
    escpos.boldOn(),
    strToBytes('TEST PRINT SUCCESSFUL!\n'),
    escpos.boldOff(),
    escpos.lineFeed(4),
    escpos.cutPaper()
  ];

  const binaryPayload = concatChunks(chunks);
  await transmitESCPOSToPrinter(binaryPayload, targetAddress);
};

export interface PrintBarcodeOptions {
  productName: string;
  barcode: string;
  price: number;
  currency: string;
  shopName?: string;
  count?: number;
  overridePaperSize?: '58mm' | '80mm';
  targetAddress?: string;
}

/**
 * Print Barcode Tags directly to Bluetooth ESC/POS Thermal Printer
 */
export const printBarcodeViaBluetooth = async (
  options: PrintBarcodeOptions
): Promise<void> => {
  clearPrinterLogs();
  addPrinterLog('==================================================');
  addPrinterLog('[STEP 1/5] Initiating printBarcodeViaBluetooth process...');
  console.log('[BTPrinter] printBarcodeViaBluetooth called with options:', options);

  try {
    const paperSize = options.overridePaperSize || (await getSavedPaperSize());
    const cols = paperSize === '80mm' ? 48 : 32;
    addPrinterLog(`[STEP 2/5] Target Paper Format: ${paperSize} (${cols} columns).`);

    const rawBarcode = (options.barcode || '').trim();
    if (!rawBarcode) {
      const err = 'Cannot print barcode: Product barcode string is empty or missing.';
      addPrinterLog(`[ERROR] ${err}`);
      console.error('[BTPrinter]', err);
      throw new Error(err);
    }

    const count = Math.max(options.count || 1, 1);
    const shopName = options.shopName || 'WHOLESALE POS';
    const currency = options.currency || '$';

    addPrinterLog(`[STEP 3/5] Generating ESC/POS payload for ${count} label(s) ("${options.productName}", SKU: ${rawBarcode})...`);

    const chunks: Uint8Array[] = [];

    // Initialize ESC/POS
    chunks.push(escpos.init());

    for (let i = 0; i < count; i++) {
      addPrinterLog(`[STEP 3.${i + 1}] Formatting barcode tag ${i + 1} of ${count}...`);

      // Header - Shop Name
      chunks.push(escpos.alignCenter());
      chunks.push(escpos.boldOn());
      chunks.push(strToBytes(`${shopName}\n`));
      chunks.push(escpos.boldOff());

      // Product Name
      chunks.push(escpos.boldOn());
      chunks.push(strToBytes(`${options.productName}\n`));
      chunks.push(escpos.boldOff());

      // ESC/POS Barcode Parameters
      // GS h 60 (barcode height in dots: 60)
      chunks.push(new Uint8Array([GS, 0x68, 60]));
      // GS w [width] (2 for 58mm, 3 for 80mm)
      chunks.push(new Uint8Array([GS, 0x77, cols === 48 ? 3 : 2]));
      // GS H 2 (print HRI characters below barcode)
      chunks.push(new Uint8Array([GS, 0x48, 2]));
      // GS f 0 (HRI font A)
      chunks.push(new Uint8Array([GS, 0x66, 0]));

      // ESC/POS CODE128 command: GS k 73 len payload
      const barcodeBytes = strToBytes(rawBarcode);
      const code128Payload = new Uint8Array([0x7B, 0x42, ...barcodeBytes]); // 0x7B 0x42 = Subset B prefix
      const len = code128Payload.length;

      chunks.push(new Uint8Array([GS, 0x6B, 73, len, ...code128Payload]));
      chunks.push(strToBytes('\n'));

      // Human-readable code + price
      chunks.push(escpos.boldOn());
      chunks.push(strToBytes(`PRICE: ${currency}${options.price.toLocaleString()}\n`));
      chunks.push(escpos.boldOff());

      if (i < count - 1) {
        chunks.push(strToBytes('-'.repeat(cols) + '\n'));
        chunks.push(escpos.lineFeed(1));
      }
    }

    chunks.push(escpos.lineFeed(3));
    chunks.push(escpos.cutPaper());

    const binaryPayload = concatChunks(chunks);
    addPrinterLog(`[STEP 4/5] ESC/POS binary payload ready: ${binaryPayload.length} bytes.`);
    console.log(`[BTPrinter] Transmitting ${binaryPayload.length} bytes to Bluetooth thermal printer...`);

    await transmitESCPOSToPrinter(binaryPayload, options.targetAddress);

    addPrinterLog('[STEP 5/5] Barcode ESC/POS printing successfully transmitted!');
    console.log('[BTPrinter] Barcode ESC/POS printing successfully transmitted.');
  } catch (err: any) {
    const msg = err?.message || 'Error transmitting ESC/POS barcode payload.';
    addPrinterLog(`[FATAL ERROR] Barcode print error: ${msg}`);
    console.error('[BTPrinter] Fatal error in printBarcodeViaBluetooth:', err);
    throw new Error(msg);
  }
};
