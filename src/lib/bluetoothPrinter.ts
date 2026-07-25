/**
 * Bluetooth Thermal ESC/POS Printer Integration Helper
 * Uses Web Bluetooth API (navigator.bluetooth) for direct mobile/desktop POS receipt printing.
 */

import { Sale, ShopSettings } from '../types';

// Standard GATT Bluetooth Thermal Printer Service & Characteristic UUIDs
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common Thermal Printer Vendor Service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
  '00004953-0000-1000-8000-00805f9b34fb', // ISSC SPP
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Zebra / Portable Thermal Service
  '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service
];

let activeBluetoothDevice: any = null;
let activeCharacteristic: any = null;

export const isBluetoothSupported = (): boolean => {
  return typeof window !== 'undefined' && 'bluetooth' in navigator;
};

export const getSavedPrinterDeviceName = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('bt_printer_device_name') || '';
};

export const getSavedPaperSize = (): '58mm' | '80mm' | 'A4' => {
  if (typeof localStorage === 'undefined') return '58mm';
  return (localStorage.getItem('bt_printer_paper_size') as any) || '58mm';
};

export const savePaperSize = (size: '58mm' | '80mm' | 'A4') => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bt_printer_paper_size', size);
  }
};

export const isPrinterConnected = (): boolean => {
  return activeBluetoothDevice && activeBluetoothDevice.gatt && activeBluetoothDevice.gatt.connected;
};

/**
 * Connect to a Bluetooth ESC/POS Printer device via Web Bluetooth picker
 */
export const connectBluetoothPrinter = async (): Promise<string> => {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Web Bluetooth capable browser.');
  }

  try {
    const bluetooth = (navigator as any).bluetooth;

    // Prompt user to pick a Bluetooth device
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    });

    if (!device) {
      throw new Error('No printer device was selected.');
    }

    console.log(`[BluetoothPrinter] Selected device: ${device.name || device.id}`);

    // Connect GATT server
    const server = await device.gatt.connect();
    console.log('[BluetoothPrinter] GATT server connected');

    // Find printable characteristic
    let foundCharacteristic: any = null;

    // Iterate through known services to find a writeable characteristic
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();

        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundCharacteristic = char;
            break;
          }
        }
      } catch (e) {
        // Service not available on this device, continue checking next service
      }

      if (foundCharacteristic) break;
    }

    // Fallback: search all available primary services
    if (!foundCharacteristic) {
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                foundCharacteristic = char;
                break;
              }
            }
          } catch (e) {}
          if (foundCharacteristic) break;
        }
      } catch (e) {}
    }

    if (!foundCharacteristic) {
      throw new Error('Connected to Bluetooth device, but no ESC/POS printable GATT characteristic was found.');
    }

    activeBluetoothDevice = device;
    activeCharacteristic = foundCharacteristic;

    const deviceName = device.name || 'Bluetooth ESC/POS Thermal Printer';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bt_printer_device_name', deviceName);
    }

    device.addEventListener('gattserverdisconnected', () => {
      console.warn('[BluetoothPrinter] Device disconnected');
      activeBluetoothDevice = null;
      activeCharacteristic = null;
    });

    return deviceName;
  } catch (err: any) {
    console.error('[BluetoothPrinter] Connection error:', err);
    throw new Error(err.message || 'Failed to connect to Bluetooth printer.');
  }
};

/**
 * Disconnect current Bluetooth printer
 */
export const disconnectBluetoothPrinter = async (): Promise<void> => {
  if (activeBluetoothDevice && activeBluetoothDevice.gatt) {
    try {
      await activeBluetoothDevice.gatt.disconnect();
    } catch (e) {}
  }
  activeBluetoothDevice = null;
  activeCharacteristic = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('bt_printer_device_name');
  }
};

/**
 * Transmit raw binary buffer chunks to Bluetooth printer
 */
const sendToPrinter = async (data: Uint8Array): Promise<void> => {
  if (!activeCharacteristic || !activeBluetoothDevice || !activeBluetoothDevice.gatt.connected) {
    // Attempt auto reconnect
    await connectBluetoothPrinter();
  }

  if (!activeCharacteristic) {
    throw new Error('Bluetooth printer characteristic not ready.');
  }

  // Write in 100-byte chunks to avoid Bluetooth payload limit truncation
  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (activeCharacteristic.properties.writeWithoutResponse) {
      await activeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await activeCharacteristic.writeValue(chunk);
    }
    // Small pause to allow hardware buffer processing
    await new Promise(resolve => setTimeout(resolve, 30));
  }
};

/**
 * ESC/POS Command Generator Helpers
 */
const ESC = 0x1b;
const GS = 0x1d;

const commands = {
  init: () => new Uint8Array([ESC, 0x40]),
  alignLeft: () => new Uint8Array([ESC, 0x61, 0]),
  alignCenter: () => new Uint8Array([ESC, 0x61, 1]),
  alignRight: () => new Uint8Array([ESC, 0x61, 2]),
  boldOn: () => new Uint8Array([ESC, 0x45, 1]),
  boldOff: () => new Uint8Array([ESC, 0x45, 0]),
  sizeDouble: () => new Uint8Array([GS, 0x21, 0x11]),
  sizeNormal: () => new Uint8Array([GS, 0x21, 0x00]),
  lineFeed: (lines = 1) => {
    const arr = [];
    for (let i = 0; i < lines; i++) arr.push(0x0a);
    return new Uint8Array(arr);
  },
  cutPaper: () => new Uint8Array([GS, 0x56, 0x41, 0x03]),
};

const concatUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};

const encoder = new TextEncoder();

const strToBytes = (str: string): Uint8Array => {
  return encoder.encode(str);
};

/**
 * Format string row with left and right padding for ESC/POS fixed column width
 */
const formatTwoCols = (leftStr: string, rightStr: string, maxLen: number): string => {
  const rightSpace = maxLen - leftStr.length;
  if (rightSpace <= rightStr.length) {
    const truncatedLeft = leftStr.slice(0, Math.max(maxLen - rightStr.length - 1, 1));
    const pad = maxLen - truncatedLeft.length - rightStr.length;
    return truncatedLeft + ' '.repeat(Math.max(pad, 1)) + rightStr;
  }
  const pad = maxLen - leftStr.length - rightStr.length;
  return leftStr + ' '.repeat(pad) + rightStr;
};

/**
 * Print Sale Receipt via Bluetooth ESC/POS
 */
export const printReceiptViaBluetooth = async (
  sale: Sale,
  settings: ShopSettings,
  currency: string,
  customerName = 'Walk-In Customer',
  paperSize: '58mm' | '80mm' | 'A4' = '58mm'
): Promise<void> => {
  const cols = paperSize === '80mm' ? 48 : 32;
  const lineSeparator = '-'.repeat(cols);

  const parts: Uint8Array[] = [];

  // 1. Reset & Center header
  parts.push(commands.init());
  parts.push(commands.alignCenter());
  parts.push(commands.boldOn());
  parts.push(commands.sizeDouble());
  parts.push(strToBytes(`${settings.shopName}\n`));
  parts.push(commands.sizeNormal());
  parts.push(commands.boldOff());

  if (settings.address) {
    parts.push(strToBytes(`${settings.address}\n`));
  }
  if (settings.phone) {
    parts.push(strToBytes(`Phone: ${settings.phone}\n`));
  }
  parts.push(strToBytes(`${lineSeparator}\n`));

  // 2. Invoice Details (Left aligned)
  parts.push(commands.alignLeft());
  parts.push(strToBytes(formatTwoCols(`Inv: #${sale.invoiceNo}`, new Date(sale.date).toLocaleDateString(), cols) + '\n'));
  parts.push(strToBytes(formatTwoCols(`Time: ${new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, `Client: ${customerName}`, cols) + '\n'));
  parts.push(strToBytes(`${lineSeparator}\n`));

  // 3. Items Header
  parts.push(commands.boldOn());
  parts.push(strToBytes(formatTwoCols('Item Description', 'Qty x Price   Total', cols) + '\n'));
  parts.push(commands.boldOff());

  // 4. Items List
  for (const item of sale.items) {
    const itemName = item.name.length > cols - 12 ? item.name.slice(0, cols - 12) : item.name;
    const rightSide = `${item.quantity}x${item.salePrice} = ${currency}${item.total}`;
    parts.push(strToBytes(formatTwoCols(itemName, rightSide, cols) + '\n'));
  }
  parts.push(strToBytes(`${lineSeparator}\n`));

  // 5. Totals & Payment Summary
  parts.push(commands.alignRight());
  parts.push(strToBytes(formatTwoCols('Subtotal:', `${currency}${sale.subtotal.toLocaleString()}`, cols) + '\n'));
  if (sale.tax > 0) {
    parts.push(strToBytes(formatTwoCols('Sales Tax:', `${currency}${sale.tax.toLocaleString()}`, cols) + '\n'));
  }
  if (sale.discount > 0) {
    parts.push(strToBytes(formatTwoCols('Discount:', `-${currency}${sale.discount.toLocaleString()}`, cols) + '\n'));
  }

  parts.push(commands.boldOn());
  parts.push(strToBytes(formatTwoCols('GRAND TOTAL:', `${currency}${sale.grandTotal.toLocaleString()}`, cols) + '\n'));
  parts.push(commands.boldOff());

  parts.push(strToBytes(formatTwoCols(`Paid (${sale.paymentMethod}):`, `${currency}${sale.receivedAmount.toLocaleString()}`, cols) + '\n'));
  if (sale.changeAmount > 0) {
    parts.push(strToBytes(formatTwoCols('Change Return:', `${currency}${sale.changeAmount.toLocaleString()}`, cols) + '\n'));
  }

  parts.push(strToBytes(`${lineSeparator}\n`));

  // 6. Footer & Thank You
  parts.push(commands.alignCenter());
  parts.push(commands.boldOn());
  parts.push(strToBytes('*** THANK YOU FOR YOUR BUSINESS ***\n'));
  parts.push(commands.boldOff());
  if (settings.receiptFooter) {
    parts.push(strToBytes(`${settings.receiptFooter}\n`));
  }
  parts.push(strToBytes('Powered by Wholesale POS Station\n'));

  // 7. Feed & Paper Cut
  parts.push(commands.lineFeed(4));
  parts.push(commands.cutPaper());

  const fullPayload = concatUint8Arrays(parts);
  await sendToPrinter(fullPayload);
};

/**
 * Print a test diagnostic receipt over Bluetooth
 */
export const printTestReceiptViaBluetooth = async (settings: ShopSettings): Promise<void> => {
  const cols = 32;
  const lineSeparator = '='.repeat(cols);

  const parts: Uint8Array[] = [
    commands.init(),
    commands.alignCenter(),
    commands.boldOn(),
    commands.sizeDouble(),
    strToBytes(`${settings.shopName || 'POS STATION'}\n`),
    commands.sizeNormal(),
    commands.boldOff(),
    strToBytes('BLUETOOTH PRINTER TEST\n'),
    strToBytes(`${new Date().toLocaleString()}\n`),
    strToBytes(`${lineSeparator}\n`),
    commands.alignLeft(),
    strToBytes('Connection: Web Bluetooth GATT\n'),
    strToBytes('Protocol: ESC/POS Thermal\n'),
    strToBytes('Status: Operational & Ready\n'),
    strToBytes(`${lineSeparator}\n`),
    commands.alignCenter(),
    commands.boldOn(),
    strToBytes('TEST PRINT SUCCESSFUL!\n'),
    commands.boldOff(),
    commands.lineFeed(4),
    commands.cutPaper(),
  ];

  const fullPayload = concatUint8Arrays(parts);
  await sendToPrinter(fullPayload);
};
