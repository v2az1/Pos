/**
 * Native Bluetooth ESC/POS Thermal Printer Utility for Capacitor Android POS
 * Handles Bluetooth permissions, device scanning, persistent pairing memory,
 * auto-reconnect, and professional thermal receipt formatting for 58mm / 80mm printers.
 */

import { Preferences } from '@capacitor/preferences';
import { Sale, ShopSettings } from '../types';

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  address?: string;
  connected?: boolean;
}

const PRINTER_STORAGE_KEY = 'pos_bt_thermal_printer_device';
const PAPER_SIZE_STORAGE_KEY = 'pos_bt_thermal_paper_size';

// Standard Bluetooth GATT Thermal Printer Service UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // ESC/POS Standard
  '0000ff00-0000-1000-8000-00805f9b34fb', // Thermal Vendor Service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
  '00004953-0000-1000-8000-00805f9b34fb', // ISSC SPP
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Zebra / Portable Thermal Service
  '0000180a-0000-1000-8000-00805f9b34fb'  // Device Info Service
];

let activeDeviceHandle: any = null;
let activeCharacteristicHandle: any = null;

/**
 * Get saved paper size configuration
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
 * Save paper size configuration
 */
export const savePaperSize = async (size: '58mm' | '80mm'): Promise<void> => {
  try {
    await Preferences.set({ key: PAPER_SIZE_STORAGE_KEY, value: size });
  } catch (e) {
    console.error('Failed saving paper size preference:', e);
  }
};

/**
 * Get remembered Bluetooth printer
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
 * Save remembered Bluetooth printer
 */
export const savePrinter = async (device: BluetoothPrinterDevice): Promise<void> => {
  try {
    await Preferences.set({
      key: PRINTER_STORAGE_KEY,
      value: JSON.stringify({ id: device.id, name: device.name, address: device.address })
    });
  } catch (e) {
    console.error('Failed saving printer preference:', e);
  }
};

/**
 * Remove remembered Bluetooth printer
 */
export const forgetPrinter = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: PRINTER_STORAGE_KEY });
    await disconnectPrinter();
  } catch (e) {
    console.error('Failed removing saved printer preference:', e);
  }
};

/**
 * Check if a printer GATT connection is active
 */
export const isPrinterConnected = (): boolean => {
  return !!(activeDeviceHandle && activeDeviceHandle.gatt && activeDeviceHandle.gatt.connected);
};

/**
 * Disconnect current active printer
 */
export const disconnectPrinter = async (): Promise<void> => {
  if (activeDeviceHandle && activeDeviceHandle.gatt) {
    try {
      await activeDeviceHandle.gatt.disconnect();
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
  }
  activeDeviceHandle = null;
  activeCharacteristicHandle = null;
};

/**
 * Scan for nearby Bluetooth thermal printers
 * Requests Web Bluetooth / Native Android GATT permission dialog
 */
export const scanAndSelectPrinter = async (): Promise<BluetoothPrinterDevice> => {
  if (typeof window === 'undefined') {
    throw new Error('Bluetooth scanner requires browser runtime environment.');
  }

  const nav = navigator as any;

  if (!nav.bluetooth) {
    throw new Error('Bluetooth is disabled or not supported on this device. Please turn on Bluetooth in Android Settings.');
  }

  try {
    console.log('[NativeBTPrinter] Requesting Bluetooth scan...');

    // Request Bluetooth device pairing
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS
    });

    if (!device) {
      throw new Error('No Bluetooth thermal printer was chosen.');
    }

    const printerObj: BluetoothPrinterDevice = {
      id: device.id,
      name: device.name || 'Bluetooth Thermal Printer',
      address: device.id
    };

    // Connect GATT server immediately to verify characteristic capability
    await connectDeviceGATT(device);

    // Persist as default POS printer
    await savePrinter(printerObj);

    return printerObj;
  } catch (err: any) {
    console.error('[NativeBTPrinter] Scan error:', err);
    throw new Error(err.message || 'Failed to discover Bluetooth thermal printers.');
  }
};

/**
 * Connect to device GATT server & locate write characteristic
 */
const connectDeviceGATT = async (device: any): Promise<void> => {
  if (!device || !device.gatt) {
    throw new Error('Invalid Bluetooth device handle.');
  }

  console.log(`[NativeBTPrinter] Connecting GATT server to ${device.name}...`);
  const server = await device.gatt.connect();

  let printableChar: any = null;

  // Search standard printer service UUIDs
  for (const uuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printableChar = char;
          break;
        }
      }
    } catch (e) {}
    if (printableChar) break;
  }

  // Fallback: search all primary services
  if (!printableChar) {
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              printableChar = char;
              break;
            }
          }
        } catch (e) {}
        if (printableChar) break;
      }
    } catch (e) {}
  }

  if (!printableChar) {
    throw new Error('Connected to Bluetooth device, but no ESC/POS writeable GATT characteristic was found.');
  }

  activeDeviceHandle = device;
  activeCharacteristicHandle = printableChar;

  device.addEventListener('gattserverdisconnected', () => {
    console.warn('[NativeBTPrinter] Bluetooth printer GATT disconnected');
    activeDeviceHandle = null;
    activeCharacteristicHandle = null;
  });
};

/**
 * Ensure printer is connected, auto-reconnecting to remembered device if disconnected
 */
export const ensureConnected = async (): Promise<void> => {
  if (isPrinterConnected()) {
    return;
  }

  const saved = await getSavedPrinter();
  if (!saved) {
    // Prompt user to scan & pair printer
    await scanAndSelectPrinter();
    return;
  }

  // Attempt auto reconnect
  const nav = navigator as any;
  if (!nav.bluetooth) {
    throw new Error('Bluetooth is not available. Please enable Bluetooth on your device.');
  }

  try {
    console.log(`[NativeBTPrinter] Auto reconnecting to saved printer: ${saved.name}...`);
    // Re-trigger device selection / reconnect
    await scanAndSelectPrinter();
  } catch (err: any) {
    throw new Error(`Auto reconnect to ${saved.name} failed. Please pair printer again: ${err.message}`);
  }
};

/**
 * Transmit ESC/POS binary data chunked to printer
 */
export const transmitESCPOSToPrinter = async (data: Uint8Array): Promise<void> => {
  await ensureConnected();

  if (!activeCharacteristicHandle) {
    throw new Error('Bluetooth printer characteristic is not ready.');
  }

  // Send in 100-byte chunks to fit GATT MTU size limits safely
  const CHUNK_SIZE = 100;
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    if (activeCharacteristicHandle.properties.writeWithoutResponse) {
      await activeCharacteristicHandle.writeValueWithoutResponse(chunk);
    } else {
      await activeCharacteristicHandle.writeValue(chunk);
    }
    // Short hardware delay between packet bursts
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

/**
 * ESC/POS Command Byte Definitions
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
  sizeHeader: () => new Uint8Array([GS, 0x21, 0x11]), // Double Width & Height
  sizeGrandTotal: () => new Uint8Array([GS, 0x21, 0x11]), // Large Bold Total
  sizeNormal: () => new Uint8Array([GS, 0x21, 0x00]),
  lineFeed: (count = 1) => {
    const buf = new Uint8Array(count);
    buf.fill(0x0a);
    return buf;
  },
  cutPaper: () => new Uint8Array([GS, 0x56, 0x41, 0x03]), // Full / Partial paper cut
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

/**
 * Left/Right 2-Column text formatting with exact padding
 */
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

/**
 * Format Product Line Item for 58mm / 80mm thermal receipt
 */
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

  // If item name fits on line with right col
  if (name.length + rightCol.length + 1 <= width) {
    lines.push(formatRow2Col(name, rightCol, width));
  } else {
    // Multi-line wrap: Product name on line 1, Qty & Price details on line 2
    // Break long product name into chunks if necessary
    let remaining = name;
    while (remaining.length > width) {
      lines.push(remaining.slice(0, width));
      remaining = remaining.slice(width);
    }
    if (remaining.length > 0) {
      lines.push(remaining);
    }
    // Second indented line for quantity and line sum
    lines.push(formatRow2Col(`  (${qty} pcs @ ${currency}${unitPrice})`, `${currency}${total}`, width));
  }

  return lines;
};

/**
 * Print Sale Receipt via Native Bluetooth ESC/POS
 */
export const printReceiptViaBluetooth = async (
  sale: Sale,
  settings: ShopSettings,
  currency: string,
  customerName = 'Walk-In Customer',
  overridePaperSize?: '58mm' | '80mm'
): Promise<void> => {
  const paperSize = overridePaperSize || (await getSavedPaperSize());
  const cols = paperSize === '80mm' ? 48 : 32;
  const lineSeparator = '='.repeat(cols);
  const thinSeparator = '-'.repeat(cols);

  const chunks: Uint8Array[] = [];

  // 1. Initialize Printer
  chunks.push(escpos.init());

  // 2. Centered Business Header
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

  // 3. Left-aligned Invoice Metadata
  chunks.push(escpos.alignLeft());
  chunks.push(strToBytes(formatRow2Col(`INVOICE: #${sale.invoiceNo}`, new Date(sale.date).toLocaleDateString(), cols) + '\n'));
  chunks.push(strToBytes(formatRow2Col(`TIME: ${new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, `CLIENT: ${customerName}`, cols) + '\n'));
  chunks.push(strToBytes(`STATION: POS Register #1\n`));
  chunks.push(strToBytes(`${thinSeparator}\n`));

  // 4. Items Table Header
  chunks.push(escpos.boldOn());
  chunks.push(strToBytes(formatRow2Col('ITEM DESCRIPTION', 'QTY x PRICE   TOTAL', cols) + '\n'));
  chunks.push(escpos.boldOff());
  chunks.push(strToBytes(`${thinSeparator}\n`));

  // 5. Line Items
  for (const item of sale.items) {
    const itemLines = formatItemRow(item.name, item.quantity, item.salePrice, item.total, currency, cols);
    for (const line of itemLines) {
      chunks.push(strToBytes(`${line}\n`));
    }
  }

  chunks.push(strToBytes(`${thinSeparator}\n`));

  // 6. Subtotal, Tax, Discount
  chunks.push(escpos.alignLeft());
  chunks.push(strToBytes(formatRow2Col('Subtotal:', `${currency}${sale.subtotal.toLocaleString()}`, cols) + '\n'));
  if (sale.tax > 0) {
    chunks.push(strToBytes(formatRow2Col('Sales Tax:', `${currency}${sale.tax.toLocaleString()}`, cols) + '\n'));
  }
  if (sale.discount > 0) {
    chunks.push(strToBytes(formatRow2Col('Discount:', `-${currency}${sale.discount.toLocaleString()}`, cols) + '\n'));
  }

  chunks.push(strToBytes(`${lineSeparator}\n`));

  // 7. Large Bold Grand Total
  chunks.push(escpos.alignLeft());
  chunks.push(escpos.boldOn());
  chunks.push(escpos.sizeGrandTotal());
  chunks.push(strToBytes(formatRow2Col('TOTAL:', `${currency}${sale.grandTotal.toLocaleString()}`, cols / 2) + '\n'));
  chunks.push(escpos.sizeNormal());
  chunks.push(escpos.boldOff());

  chunks.push(strToBytes(`${lineSeparator}\n`));

  // 8. Payment Breakdown
  chunks.push(strToBytes(formatRow2Col(`Payment (${sale.paymentMethod}):`, `${currency}${sale.receivedAmount.toLocaleString()}`, cols) + '\n'));
  if (sale.changeAmount > 0) {
    chunks.push(escpos.boldOn());
    chunks.push(strToBytes(formatRow2Col('Change Return:', `${currency}${sale.changeAmount.toLocaleString()}`, cols) + '\n'));
    chunks.push(escpos.boldOff());
  }

  chunks.push(strToBytes(`${lineSeparator}\n`));

  // 9. Centered Footer & Thank You
  chunks.push(escpos.alignCenter());
  chunks.push(escpos.boldOn());
  chunks.push(strToBytes('*** THANK YOU FOR YOUR BUSINESS ***\n'));
  chunks.push(escpos.boldOff());

  if (settings.receiptFooter) {
    chunks.push(strToBytes(`${settings.receiptFooter}\n`));
  }
  chunks.push(strToBytes('Powered by Wholesale POS Station\n'));

  // 10. Feed Paper & Cut
  chunks.push(escpos.lineFeed(4));
  chunks.push(escpos.cutPaper());

  const binaryPayload = concatChunks(chunks);
  await transmitESCPOSToPrinter(binaryPayload);
};

/**
 * Print Diagnostic Test Receipt via Bluetooth ESC/POS
 */
export const printTestReceiptViaBluetooth = async (
  settings: ShopSettings,
  overridePaperSize?: '58mm' | '80mm'
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
    strToBytes('Protocol: Native ESC/POS Command Stream\n'),
    strToBytes('Status: Operational & Ready\n'),
    strToBytes(`${lineSeparator}\n`),
    escpos.alignCenter(),
    escpos.boldOn(),
    strToBytes('TEST PRINT SUCCESSFUL!\n'),
    escpos.boldOff(),
    escpos.lineFeed(4),
    escpos.cutPaper()
  ];

  const binaryPayload = concatChunks(chunks);
  await transmitESCPOSToPrinter(binaryPayload);
};
