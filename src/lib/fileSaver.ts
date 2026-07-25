/**
 * Native Filesystem Direct File Saver Utility for Capacitor Android POS
 * Saves invoices (.txt and .png) directly into 'Documents/POS Invoices' without opening the Android Share Sheet.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface SaveFileResult {
  success: boolean;
  filePath: string;
  displayPath: string;
  error?: string;
}

/**
 * Ensures storage permissions are requested if necessary
 */
export const checkAndRequestStoragePermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true;

  try {
    const status = await Filesystem.checkPermissions();
    if (status.publicStorage === 'granted') {
      return true;
    }
    const request = await Filesystem.requestPermissions();
    return request.publicStorage === 'granted';
  } catch (err) {
    console.warn('[FileSaver] Storage permission check skipped or non-fatal:', err);
    return true;
  }
};

/**
 * Direct save text content to 'Documents/POS Invoices/Invoice-<invoiceNo>.txt'
 */
export const saveInvoiceTextDirect = async (
  invoiceNo: string,
  textContent: string
): Promise<SaveFileResult> => {
  const folder = 'POS Invoices';
  const fileName = `Invoice-${invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '')}.txt`;
  const relativePath = `${folder}/${fileName}`;

  try {
    await checkAndRequestStoragePermission();

    if (Capacitor.isNativePlatform()) {
      // 1. Write file directly using Capacitor Filesystem
      const writeResult = await Filesystem.writeFile({
        path: relativePath,
        data: textContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });

      console.log('[FileSaver] Text invoice written directly:', writeResult.uri);

      // Construct friendly display path
      const displayPath = `Documents/POS Invoices/${fileName}`;

      return {
        success: true,
        filePath: writeResult.uri,
        displayPath
      };
    } else {
      // Web browser fallback: Trigger direct browser file download (no share dialog)
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filePath: fileName,
        displayPath: `Downloads/${fileName}`
      };
    }
  } catch (err: any) {
    console.error('[FileSaver] Direct save text invoice error:', err);
    return {
      success: false,
      filePath: '',
      displayPath: '',
      error: err.message || 'Failed to save text invoice to device.'
    };
  }
};

/**
 * Direct save image (Base64 PNG) to 'Documents/POS Invoices/Invoice-<invoiceNo>.png'
 */
export const saveInvoiceImageDirect = async (
  invoiceNo: string,
  base64PngData: string
): Promise<SaveFileResult> => {
  const folder = 'POS Invoices';
  const fileName = `Invoice-${invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
  const relativePath = `${folder}/${fileName}`;

  // Strip prefix if base64 data URL format
  const rawBase64 = base64PngData.includes(',') ? base64PngData.split(',')[1] : base64PngData;

  try {
    await checkAndRequestStoragePermission();

    if (Capacitor.isNativePlatform()) {
      // Direct write base64 image file
      const writeResult = await Filesystem.writeFile({
        path: relativePath,
        data: rawBase64,
        directory: Directory.Documents,
        recursive: true
      });

      console.log('[FileSaver] Image invoice written directly:', writeResult.uri);

      const displayPath = `Documents/POS Invoices/${fileName}`;

      return {
        success: true,
        filePath: writeResult.uri,
        displayPath
      };
    } else {
      // Web browser fallback download
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${rawBase64}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        filePath: fileName,
        displayPath: `Downloads/${fileName}`
      };
    }
  } catch (err: any) {
    console.error('[FileSaver] Direct save image invoice error:', err);
    return {
      success: false,
      filePath: '',
      displayPath: '',
      error: err.message || 'Failed to save invoice image to device.'
    };
  }
};
