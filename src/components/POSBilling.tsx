import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Barcode, Trash2, Tag, Percent, Info, ShoppingCart, 
  User, Check, DollarSign, ListFilter, Play, Bookmark, FileText, ChevronRight, Image,
  AlertTriangle, X, Package, Printer
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { DBState, addLog } from '../db';
import { Product, Customer, CartItem, Sale, HoldCart } from '../types';
import { triggerHaptic } from '../lib/capacitor';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface POSBillingProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
  onNavigate: (view: string) => void;
}

export default function POSBilling({ db, onSaveDB, onNavigate }: POSBillingProps) {
  const { products, customers, settings, holdCarts } = db;
  const currency = settings.currency;

  // Active customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1'); // Walk-In default
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Barcode quick scan mode simulation
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billingPriceMode, setBillingPriceMode] = useState<'retail' | 'wholesale'>('retail');

  const handleBillingPriceModeChange = (mode: 'retail' | 'wholesale') => {
    setBillingPriceMode(mode);
    // Automatically transition existing items in cart to the newly chosen price category
    const updated = cart.map(item => ({
      ...item,
      priceType: mode
    }));
    setCart(updated);
  };

  const [invoiceNotes, setInvoiceNotes] = useState('');
  
  // Custom discounts or tax
  const [overallDiscount, setOverallDiscount] = useState<number>(0); // static amount or percentage. Let's use static amount in currency
  const [customTaxRate, setCustomTaxRate] = useState<number>(settings.taxRate);

  // Held bill parameters
  const [holdTitle, setHoldTitle] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);

  // Checkout modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  // Successful payment outcome
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Sale | null>(null);
  const [receiptSize, setReceiptSize] = useState<'58mm' | '80mm' | 'A4'>('80mm');

  // Continuous Scan Mode
  const [continuousScanMode, setContinuousScanMode] = useState<boolean>(true);
  const [lastScannedItem, setLastScannedItem] = useState<string>('');
  const [showScanSuccess, setShowScanSuccess] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Custom Toast State
  const [toast, setToast] = useState<{
    message: string;
    title?: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', title?: string) => {
    setToast({ message, type, title });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Input refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);

  // Filter products by search query or category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Hotkey listener disabled for touch-screen phone and tablet devices

  // Handle direct Barcode scan (matching SKU or barcode directly)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const findProduct = products.find(p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (findProduct) {
      handleAddToCart(findProduct);
      setBarcodeInput('');
    } else {
      triggerToast(`No active product found with barcode or SKU: ${barcodeInput}`, 'error', 'Not Found');
    }
  };

  // Add Item
  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      triggerToast(`Warning: "${product.name}" is OUT OF STOCK! Can still sell if necessary.`, 'warning', 'Out of Stock');
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        discount: 0,
        priceType: billingPriceMode
      }]);
    }
    triggerHaptic('light');
  };

  // Keep handleAddToCart fresh using a ref to avoid re-binding the window event listener too often
  const handleAddToCartRef = useRef(handleAddToCart);
  useEffect(() => {
    handleAddToCartRef.current = handleAddToCart;
  }, [handleAddToCart]);

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // State refs to keep the global keyboard event listener fresh without re-binding
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const billingPriceModeRef = useRef(billingPriceMode);
  useEffect(() => {
    billingPriceModeRef.current = billingPriceMode;
  }, [billingPriceMode]);

  const showHoldModalRef = useRef(showHoldModal);
  useEffect(() => {
    showHoldModalRef.current = showHoldModal;
  }, [showHoldModal]);

  const showPayModalRef = useRef(showPayModal);
  useEffect(() => {
    showPayModalRef.current = showPayModal;
  }, [showPayModal]);

  const showReceiptRef = useRef(showReceipt);
  useEffect(() => {
    showReceiptRef.current = showReceipt;
  }, [showReceipt]);

  const continuousScanModeRef = useRef(continuousScanMode);
  useEffect(() => {
    continuousScanModeRef.current = continuousScanMode;
  }, [continuousScanMode]);

  // Visual scan feedback trigger
  const triggerScanFeedback = (itemName: string) => {
    setLastScannedItem(itemName);
    setShowScanSuccess(true);
    setTimeout(() => {
      setShowScanSuccess(false);
    }, 2000);
  };

  // Alter qty
  const handleUpdateQty = (idx: number, val: number) => {
    if (val < 1) return;
    const updated = [...cart];
    updated[idx].quantity = val;
    setCart(updated);
  };

  // Switch billing type (Retail vs. Wholesale)
  const handleTogglePriceType = (idx: number) => {
    const updated = [...cart];
    updated[idx].priceType = updated[idx].priceType === 'retail' ? 'wholesale' : 'retail';
    setCart(updated);
  };

  // Alert line item discount
  const handleUpdateLineDiscount = (idx: number, disc: number) => {
    if (disc < 0 || disc > 100) return;
    const updated = [...cart];
    updated[idx].discount = disc;
    setCart(updated);
  };

  // Remove individual
  const handleRemoveItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Hold billing receipt state
  const handleHoldBill = () => {
    if (!holdTitle.trim()) {
      triggerToast('Please enter a reference title to hold this cart', 'warning', 'Hold Order');
      return;
    }
    const newHold: HoldCart = {
      id: 'hold-' + Date.now(),
      customerId: selectedCustomerId,
      items: cart,
      notes: invoiceNotes,
      date: new Date().toISOString(),
      title: holdTitle.trim()
    };

    const updatedCarts = [...holdCarts, newHold];
    onSaveDB({
      ...db,
      holdCarts: updatedCarts
    });

    addLog('Hold Sale', `Order held with reference name: ${holdTitle}`);
    setHoldTitle('');
    setShowHoldModal(false);
    setCart([]);
    setInvoiceNotes('');
    setOverallDiscount(0);
  };

  // Retreive hold cart back to stage
  const handleRestoreHoldCart = (h: HoldCart) => {
    setCart(h.items);
    setSelectedCustomerId(h.customerId);
    setInvoiceNotes(h.notes);
    
    // Remove that held ticket
    onSaveDB({
      ...db,
      holdCarts: holdCarts.filter(c => c.id !== h.id)
    });
    addLog('Restore Held Sale', `Restored held invoice titled: ${h.title}`);
  };

  // Financial sums
  const subtotal = cart.reduce((acc, item) => {
    const price = item.priceType === 'retail' ? item.product.salePrice : item.product.wholesalePrice;
    const discountAmount = (price * item.discount) / 100;
    return acc + ((price - discountAmount) * item.quantity);
  }, 0);

  const totalTaxAmount = (subtotal * customTaxRate) / 100;
  const grandTotal = Math.max(subtotal + totalTaxAmount - overallDiscount, 0);

  const handleOpenPayment = () => {
    setReceivedAmount(grandTotal.toString());
    setShowPayModal(true);
  };

  // Clear / Cancel POS
  const handleResetPOS = () => {
    triggerHaptic('medium');
    setCart([]);
    setInvoiceNotes('');
    setOverallDiscount(0);
    setSelectedCustomerId('cust-1');
    setBarcodeInput('');
  };

  // Continuous barcode scanner & universal keyboard shortcuts hook
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Handle Escape key to close active modal dialogs
      if (key === 'Escape') {
        if (showHoldModalRef.current) {
          e.preventDefault();
          setShowHoldModal(false);
        } else if (showPayModalRef.current) {
          e.preventDefault();
          setShowPayModal(false);
        } else if (showReceiptRef.current) {
          e.preventDefault();
          setShowReceipt(false);
        }
        return;
      }

      // Check for global POS keyboard shortcuts
      const isSearchHotkey = key === 'F1' || (e.altKey && key.toLowerCase() === 's');
      const isBarcodeHotkey = key === 'F2' || (e.altKey && key.toLowerCase() === 'b');
      const isCustomerHotkey = key === 'F3' || (e.altKey && key.toLowerCase() === 'c');
      const isPriceModeHotkey = key === 'F4' || (e.altKey && key.toLowerCase() === 'm');
      const isParkHotkey = key === 'F8' || (e.altKey && key.toLowerCase() === 'p');
      const isCheckoutHotkey = key === 'F9' || (e.altKey && (key === 'Enter' || key.toLowerCase() === 'e'));
      const isResetHotkey = key === 'F10' || (e.altKey && key.toLowerCase() === 'r');

      if (isSearchHotkey) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (isBarcodeHotkey) {
        e.preventDefault();
        e.stopPropagation();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      }

      if (isCustomerHotkey) {
        e.preventDefault();
        e.stopPropagation();
        customerSelectRef.current?.focus();
        return;
      }

      if (isPriceModeHotkey) {
        e.preventDefault();
        e.stopPropagation();
        const nextMode = billingPriceModeRef.current === 'retail' ? 'wholesale' : 'retail';
        handleBillingPriceModeChange(nextMode);
        triggerToast(`Switched Billing Price Mode to: ${nextMode.toUpperCase()}`, 'success', 'Billing Category');
        return;
      }

      if (isParkHotkey) {
        e.preventDefault();
        e.stopPropagation();
        if (cartRef.current.length > 0) {
          setShowHoldModal(true);
        } else {
          triggerToast('Your cart is empty. Cannot park empty ticket.', 'warning', 'Park Bill');
        }
        return;
      }

      if (isCheckoutHotkey) {
        e.preventDefault();
        e.stopPropagation();
        if (cartRef.current.length > 0) {
          handleOpenPayment();
        } else {
          triggerToast('Your cart is empty. Please add items to checkout.', 'warning', 'Checkout');
        }
        return;
      }

      if (isResetHotkey) {
        e.preventDefault();
        e.stopPropagation();
        handleResetPOS();
        triggerToast('Cart cleared and default state restored.', 'info', 'Cart Reset');
        return;
      }

      // If user holds standard modifier keys and it wasn't one of our hotkeys, ignore it to prevent overriding browser shortcuts
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Process hands-free barcode scanning if enabled
      if (!continuousScanModeRef.current) return;

      let isInput = false;
      let isBarcodeField = false;

      // Safely check focus to prevent cross-origin errors
      try {
        if (e.target) {
          const target = e.target as any;
          const tagName = target.tagName;
          const isContentEditable = target.isContentEditable;
          isInput = (
            tagName === 'INPUT' || 
            tagName === 'TEXTAREA' || 
            tagName === 'SELECT' ||
            isContentEditable === true ||
            (typeof isContentEditable === 'string' && isContentEditable !== 'false')
          );
          isBarcodeField = (target === barcodeInputRef.current);
        }
      } catch (err) {
        isInput = false;
        isBarcodeField = false;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      const isFastScanner = timeDiff < 35;
      const shouldAccumulate = !isInput || isBarcodeField || (isInput && isFastScanner);

      if (!shouldAccumulate) {
        buffer = '';
        return;
      }

      if (e.key === 'Enter') {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer.length > 0) {
          const findProduct = productsRef.current.find(p => 
            p.barcode === trimmedBuffer || 
            p.sku.toLowerCase() === trimmedBuffer.toLowerCase()
          );

          if (findProduct) {
            handleAddToCartRef.current(findProduct);
            buffer = '';
            setBarcodeInput('');
            triggerScanFeedback(findProduct.name);
            e.preventDefault();
            e.stopPropagation();
          } else {
            if (isFastScanner || !isInput) {
              triggerToast(`Scanned code "${trimmedBuffer}" not found in retail catalog.`, 'error', 'Scanner Error');
              buffer = '';
              setBarcodeInput('');
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
        return;
      }

      if (e.key.length === 1) {
        if (!isInput) {
          e.preventDefault();
        }
        if (buffer.length > 50) {
          buffer = '';
        }
        buffer += e.key;
        if (!isInput) {
          setBarcodeInput(buffer);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [handleBillingPriceModeChange, handleOpenPayment, handleResetPOS]);

  // Submit payment order
  const handleConfirmCheckout = () => {
    const recNum = parseFloat(receivedAmount);
    if (isNaN(recNum) || recNum < grandTotal) {
      if (paymentMethod === 'Cash' || paymentMethod === 'Mixed') {
        triggerToast('Received amount cannot be less than Grand Total unless charging a credit account.', 'error', 'Invalid Amount');
        return;
      }
    }

    const changeAmount = Math.max(recNum - grandTotal, 0);

    // 1. Generate elegant invoice receipt model
    const invoiceNumber = `${settings.invoicePrefix}-${Date.now().toString().slice(-6)}`;
    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      invoiceNo: invoiceNumber,
      customerId: selectedCustomerId,
      date: new Date().toISOString(),
      subtotal,
      tax: totalTaxAmount,
      discount: overallDiscount,
      grandTotal,
      paymentMethod,
      paymentDetails,
      receivedAmount: recNum,
      changeAmount,
      notes: invoiceNotes,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        salePrice: item.priceType === 'retail' ? item.product.salePrice : item.product.wholesalePrice,
        costPrice: item.product.costPrice,
        total: (item.priceType === 'retail' ? item.product.salePrice : item.product.wholesalePrice) * item.quantity
      })),
      status: 'Completed'
    };

    // 2. Adjust Stock Deductions
    const updatedProducts = products.map(p => {
      const soldItem = cart.find(itm => itm.product.id === p.id);
      if (soldItem) {
        return {
          ...p,
          quantity: p.quantity - soldItem.quantity
        };
      }
      return p;
    });

    // 3. Update Customer Ledger Balances if it was credit or regular customer
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomerId && selectedCustomerId !== 'cust-1') {
        // If they paid LESS than grand total, we add the difference to their outstanding liability!
        const liabilityDifference = grandTotal - (recNum || 0);
        return {
          ...c,
          currentBalance: c.currentBalance + liabilityDifference
        };
      }
      return c;
    });

    // 4. Update the cash/ledger ledger list
    const newLedgerEntities = [...db.ledgers];
    if (selectedCustomerId !== 'cust-1') {
      newLedgerEntities.push({
        id: 'ldg-' + Date.now(),
        accountType: 'customer',
        accountId: selectedCustomerId,
        type: 'debit',
        amount: grandTotal,
        balance: activeCustomer.currentBalance + grandTotal,
        date: new Date().toISOString(),
        description: `POS Checkout - Invoice ${invoiceNumber}`
      });

      if (recNum > 0) {
        newLedgerEntities.push({
          id: 'ldg-' + (Date.now() + 1),
          accountType: 'customer',
          accountId: selectedCustomerId,
          type: 'credit',
          amount: Math.min(recNum, grandTotal),
          balance: activeCustomer.currentBalance + (grandTotal - Math.min(recNum, grandTotal)),
          date: new Date().toISOString(),
          description: `POS Payment - Invoice ${invoiceNumber}`
        });
      }
    }

    // Cash register addition log entry
    newLedgerEntities.push({
      id: 'ldg-cash-' + Date.now(),
      accountType: 'cash',
      accountId: 'cash_register',
      type: 'debit',
      amount: Math.min(recNum, grandTotal),
      balance: 0, // dynamic balance computed later
      date: new Date().toISOString(),
      description: `Billing Sales Invoice ${invoiceNumber}`
    });

    // Save state
    const salesList = [newSale, ...db.sales];
    onSaveDB({
      ...db,
      products: updatedProducts,
      customers: updatedCustomers,
      sales: salesList,
      ledgers: newLedgerEntities
    });

    addLog('POS Checkout', `Created invoice #${invoiceNumber} total ${currency} ${grandTotal}`);
    triggerHaptic('success');

    setLastInvoice(newSale);
    setShowPayModal(false);
    setShowReceipt(true);
    handleResetPOS();
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleSaveInvoiceToFile = async () => {
    if (!lastInvoice) return;
    
    // Create beautifully formatted plain text receipt
    const content = `
========================================
       ${settings.shopName.toUpperCase()}
========================================
Address: ${settings.address}
Contact: ${settings.phone}
----------------------------------------
Invoice No: #${lastInvoice.invoiceNo}
Date: ${new Date(lastInvoice.date).toLocaleString()}
Customer: ${customers.find(c => c.id === lastInvoice.customerId)?.name || 'Walk-In'}
Cashier: Station #1
----------------------------------------
Product Name          Qty   Price   Total
----------------------------------------
${lastInvoice.items.map(it => {
  const namePadded = it.name.substring(0, 20).padEnd(21);
  const qtyPadded = it.quantity.toString().padStart(4);
  const pricePadded = `${currency}${it.salePrice.toLocaleString()}`.padStart(7);
  const totalPadded = `${currency}${it.total.toLocaleString()}`.padStart(8);
  return `${namePadded}${qtyPadded}${pricePadded}${totalPadded}`;
}).join('\n')}
----------------------------------------
Subtotal:          ${currency}${lastInvoice.subtotal.toLocaleString().padStart(12)}
Sales Tax:         ${currency}${lastInvoice.tax.toLocaleString().padStart(12)}
Discount:         -${currency}${lastInvoice.discount.toLocaleString().padStart(12)}
----------------------------------------
GRAND TOTAL:       ${currency}${lastInvoice.grandTotal.toLocaleString().padStart(12)}
----------------------------------------
Payment Method:    ${lastInvoice.paymentMethod}
Received Amount:   ${currency}${lastInvoice.receivedAmount.toLocaleString().padStart(12)}
Change Return:     ${currency}${lastInvoice.changeAmount.toLocaleString().padStart(12)}
========================================
     *** THANK YOU FOR SHOPPING ***
${settings.receiptFooter}
========================================
`.trim();
    const filename = `Invoice_${lastInvoice.invoiceNo}.txt`;

    if (Capacitor.isNativePlatform()) {
      try {
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: `Invoice #${lastInvoice.invoiceNo}`,
          text: `Plain text receipt for Invoice #${lastInvoice.invoiceNo}`,
          url: writeResult.uri,
          dialogTitle: 'Share Receipt text'
        });
        
        addLog('Save Bill Locally', `Invoice #${lastInvoice.invoiceNo} shared natively in TXT format`);
      } catch (err: any) {
        console.error('Failed to save/share native txt receipt:', err);
      }
    } else {
      const mimeType = 'text/plain';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog('Save Bill Locally', `Invoice #${lastInvoice.invoiceNo} downloaded locally in TXT format`);
    }
  };

  const handleSaveInvoiceAsImage = async () => {
    if (!lastInvoice) return;
    const element = document.getElementById('print-area');
    if (!element) return;
    try {
      // Temporarily remove print-only styling limitations, render clean 2x scaled image
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // Perfect density for phone screens and tablets
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Sanitize all style tags by replacing oklch color functions with hex codes
          const styles = Array.from(clonedDoc.getElementsByTagName('style'));
          for (const style of styles) {
            try {
              let cssText = style.innerHTML;
              if (cssText.includes('oklch')) {
                // Strip/replace oklch syntax which crashes html2canvas parser
                cssText = cssText.replace(/oklch\([^)]+\)/g, '#475569');
                style.innerHTML = cssText;
              }
            } catch (err) {
              console.warn('Could not sanitize style tag in cloned invoice:', err);
            }
          }

          // 2. Add an explicit standard high-contrast invoice printing stylesheet to the mock document
          const safePrintOverride = clonedDoc.createElement('style');
          safePrintOverride.innerHTML = `
            #print-area {
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            }
            #print-area * {
              background-color: transparent !important;
              color: #000000 !important;
              border-color: #cbd5e1 !important;
            }
            #print-area h2 {
              color: #000000 !important;
              font-weight: 800 !important;
            }
            #print-area span, #print-area p {
              color: #0f172a !important;
            }
            #print-area .text-slate-600, #print-area .text-slate-500, #print-area .text-slate-450 {
              color: #475569 !important;
            }
            #print-area .text-rose-650, #print-area .text-emerald-650 {
              color: #000000 !important;
              font-weight: bold !important;
            }
          `;
          clonedDoc.head.appendChild(safePrintOverride);

          // 3. Patch CSSStyleDeclaration prototype on the cloned document's window to safely handle oklch colors
          if (clonedDoc.defaultView && (clonedDoc.defaultView as any).CSSStyleDeclaration) {
            const proto = (clonedDoc.defaultView as any).CSSStyleDeclaration.prototype;
            
            // Patch getPropertyValue
            const originalGetPropertyValue = proto.getPropertyValue;
            if (originalGetPropertyValue) {
              proto.getPropertyValue = function(prop: string) {
                try {
                  const val = originalGetPropertyValue.call(this, prop);
                  if (typeof val === 'string' && val.includes('oklch')) {
                    if (prop === 'background-color') {
                      return '#ffffff';
                    }
                    if (prop.toLowerCase().includes('color')) {
                      if (prop.toLowerCase().includes('border')) {
                        return '#cbd5e1';
                      }
                      return '#0f172a';
                    }
                  }
                  return val;
                } catch (e) {
                  return '';
                }
              };
            }

            // Patch individual standard property getters
            const propsToPatch = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
            propsToPatch.forEach(propName => {
              try {
                const desc = Object.getOwnPropertyDescriptor(proto, propName) || 
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), propName);
                if (desc && desc.get) {
                  const originalGet = desc.get;
                  Object.defineProperty(proto, propName, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      try {
                        const val = originalGet.call(this);
                        if (typeof val === 'string' && val.includes('oklch')) {
                          if (propName === 'backgroundColor') {
                            return '#ffffff';
                          }
                          if (propName.toLowerCase().includes('border')) {
                            return '#cbd5e1';
                          }
                          return '#0f172a';
                        }
                        return val;
                      } catch (e) {
                        return '';
                      }
                    }
                  });
                } else {
                  // Fallback: if no descriptor/getter, define a getter delegating to getPropertyValue
                  Object.defineProperty(proto, propName, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      const cssProp = propName.replace(/([A-Z])/g, '-$1').toLowerCase();
                      return this.getPropertyValue(cssProp);
                    }
                  });
                }
              } catch (err) {
                console.warn('Could not patch property getter ' + propName, err);
              }
            });
          }
        }
      });
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `Invoice_${lastInvoice.invoiceNo}.png`;

      if (Capacitor.isNativePlatform()) {
        const rawBase64 = dataUrl.split(',')[1];
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: rawBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: `Invoice #${lastInvoice.invoiceNo}`,
          text: `Invoice graphic for order #${lastInvoice.invoiceNo}`,
          url: writeResult.uri,
          dialogTitle: 'Share Invoice Image'
        });

        addLog('Save Bill Locally', `Invoice #${lastInvoice.invoiceNo} shared natively as image (PNG)`);
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        addLog('Save Bill Locally', `Invoice #${lastInvoice.invoiceNo} saved locally as image (PNG)`);
      }
    } catch (error) {
      console.error('Failed to capture receipt as image:', error);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-150 dark:border-slate-700/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog Grid ({filteredProducts.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 relative ${
            mobileTab === 'cart'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-150 dark:border-slate-700/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Active Cart</span>
          {cart.length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* LEFT SIDE: Catalog, Categories, search filters (7 cols out of 12) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
        {/* Search controls row */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by Name, SKU, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            {/* Quick barcode search/submit */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-1.5 sm:w-60">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan SKU/Barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-3 text-white text-xs font-bold shadow-sm transition active:scale-98"
                >
                  Enter
                </button>
              </form>

              {/* Continuous Scan Mode Toggle */}
              <button
                type="button"
                onClick={() => setContinuousScanMode(!continuousScanMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 whitespace-nowrap ${
                  continuousScanMode 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs animate-pulse-subtle' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="When active, scan items directly without needing to click or focus the input field"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${continuousScanMode ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${continuousScanMode ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
                Hands-Free Scan {continuousScanMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Categories Selector list */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 shrink-0 scrollbar-thin scrollbar-thumb-slate-200">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-155 active:scale-98 shrink-0 ${selectedCategory === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-750'}`}
            >
              All Categories
            </button>
            {db.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-155 active:scale-98 shrink-0 ${selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-750'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Cheat Sheet */}
          <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 select-none">
            <span className="text-slate-500 dark:text-slate-400 font-bold">⌨️ Hotkeys:</span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F1</kbd> Search
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F2</kbd> Scan
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F3</kbd> Customer
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F4</kbd> Mode
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F8</kbd> Park
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F9</kbd> Pay
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">F10</kbd> Reset
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-xxs">Esc</kbd> Close
            </div>
          </div>
        </div>

        {/* Product Cards Grid section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 text-left flex flex-col justify-between group active:scale-[0.97] h-38"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {p.image && (
                        <img src={p.image} className="w-4 h-4 rounded-md object-cover shrink-0 border border-slate-200/50 dark:border-slate-600/50" alt="" referrerPolicy="no-referrer" />
                      )}
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate max-w-full">
                        {db.categories.find(c => c.id === p.categoryId)?.name || 'Default'}
                      </span>
                    </div>
                    {p.quantity <= p.minStock && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Low stock alert"></span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-snug line-clamp-2 mt-1 py-0.5">
                    {p.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono tracking-wider">SKU: {p.sku}</div>
                </div>

                <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-705/30 w-full">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {currency} {p.salePrice.toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${p.quantity <= 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/30' : p.quantity <= p.minStock ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/20' : 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400'}`}>
                    Qty: {p.quantity} {p.unit}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-slate-800 py-16 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <Search className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-sm font-medium">No inventory SKU meets the query.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-550"
              >
                Clear all active catalog filters
              </button>
            </div>
          )}
        </div>

        {/* Hold sales panels */}
        {holdCarts.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-705 dark:text-slate-350 mb-2 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-amber-500" /> HELD/PARKED TICKETS ({holdCarts.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {holdCarts.map(hc => (
                <div key={hc.id} className="bg-white dark:bg-slate-800 border border-slate-205/65 dark:border-slate-705 py-2 px-3 rounded-xl flex items-center justify-between gap-3 text-xs w-full sm:w-auto">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{hc.title}</div>
                    <div className="text-[9px] text-slate-400">
                      {hc.items.reduce((sum, i) => sum + i.quantity, 0)} items | {new Date(hc.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreHoldCart(hc)}
                    className="p-1 px-2.5 font-bold text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Shopping Cart panel (5 cols out of 12) */}
      <div className={`lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[560px] ${mobileTab === 'cart' ? 'block' : 'hidden lg:flex'}`}>
        
        {/* Cart Upper Header: Customer selector */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Client</label>
              <select
                ref={customerSelectRef}
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  triggerHaptic('light');
                }}
                className="w-full bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm py-1 font-semibold focus:outline-none focus:ring-0 focus:border-indigo-600 transition-all cursor-pointer"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {c.name} {c.id !== 'cust-1' ? `(Bal: ${currency}${c.currentBalance.toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-705/40 pt-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Billing Price Category
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleBillingPriceModeChange('retail')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  billingPriceMode === 'retail'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-100 dark:border-slate-705/40'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                <span>🛍️ Retail Price</span>
              </button>
              <button
                type="button"
                onClick={() => handleBillingPriceModeChange('wholesale')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  billingPriceMode === 'wholesale'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-100 dark:border-slate-705/40'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                <span>📦 Wholesale client</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-705/40 pt-3 flex items-center justify-between text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
            <span>Ticket Cart Items</span>
            <button 
              onClick={handleResetPOS}
              className="text-rose-500 hover:text-rose-600 font-bold transition text-[10px]"
              disabled={cart.length === 0}
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Cart Item rows container */}
        <div className="flex-1 overflow-y-auto max-h-[280px] my-4 pr-1 divide-y divide-slate-100 dark:divide-slate-705/30">
          {cart.length > 0 ? (
            cart.map((item, idx) => {
              const basePrice = item.priceType === 'retail' ? item.product.salePrice : item.product.wholesalePrice;
              const discountValue = (basePrice * item.discount) / 100;
              const finalItemPrice = basePrice - discountValue;
              const rowTotal = finalItemPrice * item.quantity;

              return (
                <div key={idx} className="py-3 text-xs flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-150 truncate leading-tight">{item.product.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 space-x-1.5 flex items-center">
                        <button 
                          onClick={() => handleTogglePriceType(idx)} 
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] hover:bg-indigo-100 font-bold uppercase transition"
                        >
                          {item.priceType === 'retail' ? 'Retail' : 'Wholesale'}
                        </button>
                        <span>Price: {currency}{basePrice}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Qty count & Line Discount configurations */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                        className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:bg-slate-100 font-extrabold text-sm transition"
                      >
                        -
                      </button>
                      <span className="px-3.5 py-0.5 font-bold text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                        className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:bg-slate-100 font-extrabold text-sm transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick discount tag */}
                    <div className="flex items-center gap-1 min-w-0">
                      <Percent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discount || ''}
                        onChange={(e) => handleUpdateLineDiscount(idx, parseInt(e.target.value) || 0)}
                        className="w-14 border border-slate-150 dark:border-slate-700 rounded bg-transparent px-1 py-0.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200"
                        title="Line item discount percent"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold">% Off</span>
                    </div>

                    <div className="text-right text-xs font-black text-slate-800 dark:text-white shrink-0 min-w-16">
                      {currency} {rowTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center text-slate-405 dark:text-slate-505 bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
              <div className="text-sm font-semibold">Shopping cart is empty</div>
              <p className="text-[11px] px-8 text-center text-slate-400">Select items from the catalog or barcode scan to create a checkout order invoice.</p>
            </div>
          )}
        </div>

        {/* Pricing Summary Block & Hold/Payment submit */}
        <div className="border-t border-slate-100 dark:border-slate-705/40 pt-4 space-y-3">
          
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {/* Subtotal */}
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{currency} {subtotal.toLocaleString()}</span>
            </div>

            {/* Tax */}
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Tax Rate %</span>
                <input
                  type="number"
                  value={customTaxRate}
                  onChange={(e) => setCustomTaxRate(Math.max(parseFloat(e.target.value) || 0, 0))}
                  className="w-11 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-702 font-bold px-0.5 text-[10px] text-slate-880 dark:text-slate-250 py-0.5"
                />
              </div>
              <span className="font-semibold text-slate-500 dark:text-slate-350">{currency} {totalTaxAmount.toLocaleString()}</span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-1 text-slate-400">
                <span>Overall Cash Discount (Amt)</span>
                <input
                  type="number"
                  placeholder="0"
                  value={overallDiscount || ''}
                  onChange={(e) => setOverallDiscount(Math.max(parseFloat(e.target.value) || 0, 0))}
                  className="w-14 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-702 font-bold px-0.5 text-[10px] text-slate-880 dark:text-slate-250 py-0.5"
                />
              </div>
              <span className="font-bold text-rose-500">-{currency} {overallDiscount.toLocaleString()}</span>
            </div>

            {/* Overall Notes */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Write private transaction invoice remarks/notes..."
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="w-full border border-slate-150 dark:border-slate-750 placeholder:text-[10px] rounded bg-transparent px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white mt-1 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Total Payable</span>
            <span className="text-2xl font-black text-indigo-650 dark:text-white">
              {currency} {grandTotal.toLocaleString()}
            </span>
          </div>

          {/* Checkout triggers */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => {
                if (cart.length > 0) {
                  setShowHoldModal(true);
                }
              }}
              disabled={cart.length === 0}
              className="bg-amber-100 border border-amber-200 text-amber-800 hover:bg-amber-150 py-3 rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-98"
            >
              Park Bill
            </button>
            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg py-3 rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Collect Payment & Checkout
            </button>
          </div>
        </div>
      </div>

      </div> {/* Close grid container */}

      {/* HOLD MODAL popup */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Park/Hold Receipt Transaction</h3>
              <p className="text-xs text-slate-400">Park current items under a reference name for instant recall.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">REFERENCE NAME / TABLE / PHONE</label>
              <input
                type="text"
                placeholder="e.g. Table 4, Ahmed, etc."
                value={holdTitle}
                onChange={(e) => setHoldTitle(e.target.value)}
                className="w-full border border-slate-205 dark:border-slate-703 rounded-xl bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
            </div>
            <div className="flex gap-2 text-xs pt-2">
              <button
                onClick={() => setShowHoldModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-slate-550 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleHoldBill}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-505 transition shadow-sm"
              >
                Hold Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT AND CHECKOUT MODAL DRAWER */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-lg w-full space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-white text-lg">Billing Payment Terminal</h3>
                <p className="text-xs text-slate-450">Process standard ledger credit liabilities and offline methods.</p>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-1.5 border border-slate-150 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-450 uppercase font-bold">
                <span>Account Client</span>
                <span>Subtotal Invoice</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-755 dark:text-slate-200">{activeCustomer.name}</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-white">
                  {currency} {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest">Active Channels</label>
              <div className="py-2.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20 flex items-center justify-between">
                <span>Cash Payment Only</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase rounded-lg border border-emerald-500/20 font-bold">Active</span>
              </div>
            </div>

            {/* Inputs block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-440 mb-1">CHARGED CASH AMOUNT ({currency})</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-702 rounded-xl bg-transparent px-3 py-2 text-base font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-440 mb-1">CASH RETURN CHANGE</label>
                <div className="w-full bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl text-base font-black text-emerald-500 border border-slate-100 dark:border-slate-800">
                  {currency} {Math.max((parseFloat(receivedAmount) || 0) - grandTotal, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment References info */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">TRANSACTION NO / CHEQUE REF (IF ANY)</label>
              <input
                type="text"
                placeholder="Transfer ID, Card batch code, Cheque reference..."
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-703 bg-transparent rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2 text-xs pt-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 border rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750 transition font-bold"
              >
                Close Ticket
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition shadow-lg inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4.5 h-4.5" />
                Deduct Qty & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SUCCESS RECEIPT PRINT VIEW SCREEN MODAL */}
      {showReceipt && lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 z-50">
          <div className="bg-white text-slate-800 p-5 md:p-8 rounded-2xl w-full max-w-[480px] shadow-2xl relative border border-slate-150 flex flex-col justify-between" id="printable-receipt-card">
            
            {/* Top triggers inside modal */}
            <div className="flex items-center justify-between border-b pb-4 mb-5 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Invoice Print Station</span>
              <div className="flex gap-2 text-xs">
                <select 
                  value={receiptSize} 
                  onChange={(e) => setReceiptSize(e.target.value as any)} 
                  className="bg-slate-100 border rounded p-1 text-[11px] font-bold"
                >
                  <option value="58mm">Thermal 58mm</option>
                  <option value="80mm">Thermal 80mm</option>
                  <option value="A4">Standard A4 Sheet</option>
                </select>
                <button 
                  onClick={() => setShowReceipt(false)} 
                  className="bg-slate-100 text-slate-700 font-bold rounded-lg p-1.5 hover:bg-slate-200 transition text-[11px]"
                >
                  Close Receipt
                </button>
              </div>
            </div>

            {/* ACTUAL RENDERED PRINT RECEIPT AREA */}
            <div className={`mx-auto bg-white text-black p-4 tracking-tight leading-normal ${receiptSize === '58mm' ? 'w-[280px] text-[10px]' : receiptSize === '80mm' ? 'w-[340px] text-xs' : 'w-full max-w-4xl text-sm'}`} id="print-area">
              
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-350">
                <h2 className="text-lg font-black tracking-tight uppercase">{settings.shopName}</h2>
                <p className="whitespace-pre-line text-[10px] leading-tight font-medium text-slate-600">{settings.address}</p>
                <p className="text-[10px]">Contact: <strong>{settings.phone}</strong></p>
              </div>

              <div className="py-3 leading-snug space-y-1 text-[10px] border-b border-dashed border-slate-350 select-none">
                <div className="flex justify-between">
                  <span>Invoice: <strong>#{lastInvoice.invoiceNo}</strong></span>
                  <span>Date: {new Date(lastInvoice.date).toLocaleDateString()} {new Date(lastInvoice.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {customers.find(c => c.id === lastInvoice.customerId)?.name || 'Walk-In'}</span>
                  <span>Cashier Station: Station #1</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-slate-350">
                <div className="grid grid-cols-12 font-bold mb-1.5 text-[10.5px]">
                  <span className="col-span-6 truncate">Product Name</span>
                  <span className="col-span-2 text-center text-slate-500">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>

                <div className="space-y-1 text-[10.5px]">
                  {lastInvoice.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 leading-relaxed">
                      <span className="col-span-6 truncate font-medium">{it.name}</span>
                      <span className="col-span-2 text-center font-bold text-slate-600">{it.quantity}</span>
                      <span className="col-span-2 text-right">{currency}{it.salePrice.toLocaleString()}</span>
                      <span className="col-span-2 text-right font-bold">{currency}{it.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregation */}
              <div className="py-3 space-y-1 text-right text-[11px] font-medium border-b border-dashed border-slate-350 leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{currency} {lastInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Tax %</span>
                  <span>{currency} {lastInvoice.tax.toLocaleString()}</span>
                </div>
                {lastInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-650">
                    <span>Discount Deduction</span>
                    <span>-{currency} {lastInvoice.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1">
                  <span>GRAND TOTAL</span>
                  <span>{currency} {lastInvoice.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-3 text-[10px] space-y-1 border-b border-slate-205">
                <div className="flex justify-between">
                  <span>Paid Channels: <strong>{lastInvoice.paymentMethod}</strong></span>
                  <span>Received Amount: {currency}{lastInvoice.receivedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-650 font-bold">
                  <span>Change Return Balance:</span>
                  <span>{currency}{lastInvoice.changeAmount.toLocaleString()}</span>
                </div>
              </div>

              {lastInvoice.notes && (
                <div className="py-2.5 text-[9.5px] italic text-slate-500">
                  Remarks: {lastInvoice.notes}
                </div>
              )}

              <div className="text-center pt-4 space-y-1 select-none">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">*** Thank you for shopping ***</p>
                <p className="text-[9px] leading-normal text-slate-450">{settings.receiptFooter}</p>
                <p className="text-[8px] text-slate-350 mt-1">POS built completely offline for MS Windows Systems.</p>
              </div>

            </div>

            {/* Receipt Footer Triggers */}
            <div className="mt-6 space-y-4 print:hidden w-full">
              {/* Save Locally to Folder options */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-2">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Save Bill / Invoice to folder</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleSaveInvoiceToFile}
                    title="Save as plain text file"
                    className="py-2.5 px-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-98"
                  >
                    <FileText className="w-3.5 h-3.5" /> <span>Text (.txt)</span>
                  </button>
                  <button
                    onClick={handleSaveInvoiceAsImage}
                    title="Save as Photo/Image to gallery"
                    className="py-2.5 px-1 bg-indigo-600 hover:bg-indigo-505 text-white text-[10.5px] font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-98"
                  >
                    <Image className="w-3.5 h-3.5" /> <span>Image (.png)</span>
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 text-center select-none pt-0.5">
                  Offline Device Friendly: Instantly saves the invoice file directly to your downloads / tablet local folders.
                </p>
              </div>

              <button
                onClick={handleTriggerPrint}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Thermal Voucher/A4
              </button>
              
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 text-xs rounded-xl transition"
              >
                Close Station Receipt View
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Floating Scan Success Toast */}
      {showScanSuccess && !toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold border border-emerald-500 animate-fade-in">
          <Check className="w-5 h-5 bg-white/20 rounded-lg p-0.5 shrink-0" />
          <div className="text-xs">
            <span className="text-[9px] block opacity-85 uppercase tracking-widest">Continuous Scan Success</span>
            <span className="text-sm">{lastScannedItem} added to cart</span>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Action Bar (Only visible on mobile viewports when catalog tab is active and cart contains items) */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div 
          onClick={() => setMobileTab('cart')}
          className="lg:hidden fixed bottom-6 left-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 font-bold border border-indigo-500 cursor-pointer active:scale-95 transition-all duration-150 animate-bounce-subtle"
        >
          <div className="flex items-center gap-3">
            <div className="relative bg-white/10 p-2 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9.5px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-indigo-600">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] block opacity-85 uppercase tracking-wider leading-none mb-1">Basket Order Total</span>
              <span className="text-base font-black leading-none">{currency} {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs bg-white/15 px-3 py-1.5 rounded-xl border border-white/10">
            Checkout <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Floating Custom Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold border animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
          toast.type === 'warning' ? 'bg-amber-600 border-amber-500' :
          toast.type === 'error' ? 'bg-rose-600 border-rose-500' :
          'bg-indigo-600 border-indigo-500'
        }`}>
          {toast.type === 'success' && <Check className="w-5 h-5 bg-white/20 rounded-lg p-0.5 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 bg-white/20 rounded-lg p-0.5 shrink-0" />}
          {toast.type === 'error' && <X className="w-5 h-5 bg-white/20 rounded-lg p-0.5 shrink-0 cursor-pointer" onClick={() => setToast(null)} />}
          {toast.type === 'info' && <Info className="w-5 h-5 bg-white/20 rounded-lg p-0.5 shrink-0" />}
          
          <div className="text-xs">
            {toast.title && <span className="text-[9px] block opacity-85 uppercase tracking-widest">{toast.title}</span>}
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
