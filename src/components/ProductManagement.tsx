import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Copy, ArrowUpDown, FileDown, FileUp, 
  Search, Barcode, HelpCircle, ArrowUpRight, ArrowDownRight, Tag, Info, AlertTriangle
} from 'lucide-react';
import { DBState, addLog } from '../db';
import { Product, Category } from '../types';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ProductManagementProps {
  db: DBState;
  onSaveDB: (newDb: DBState) => void;
}

export default function ProductManagement({ db, onSaveDB }: ProductManagementProps) {
  const { products, categories, suppliers, settings } = db;
  const currency = settings.currency;

  // Search/Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');

  // Form states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryId: 'cat-1',
    brand: '',
    description: '',
    costPrice: 100,
    salePrice: 150,
    wholesalePrice: 135,
    quantity: 10,
    minStock: 5,
    unit: 'Pcs',
    supplierId: 'sup-1',
    image: ''
  });

  // Stock Adjust Tool Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'Add' | 'Subtract'>('Add');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Barcode Label Printer Modal
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);
  const [barcodeLabelsCount, setBarcodeLabelsCount] = useState(12);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.barcode.includes(search) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || p.categoryId === selectedCat;
    
    let matchesStock = true;
    if (stockFilter === 'Low') {
      matchesStock = p.quantity <= p.minStock && p.quantity > 0;
    } else if (stockFilter === 'Out') {
      matchesStock = p.quantity <= 0;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      sku: '',
      categoryId: categories[0]?.id || 'cat-1',
      brand: '',
      description: '',
      costPrice: 0,
      salePrice: 0,
      wholesalePrice: 0,
      quantity: 0,
      minStock: 5,
      unit: 'Pcs',
      supplierId: suppliers[0]?.id || 'sup-1',
      image: ''
    });
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryName('');
  };

  // Generate SKU & Barcode automatically
  const autoGenerateCodes = () => {
    const epoch = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900 + 100).toString();
    const mockBarcode = `896${epoch}${rand}`;
    const cleanName = formData.name ? formData.name.trim().slice(0, 3).toUpperCase() : 'PROD';
    const mockSku = `${cleanName}-${epoch}`;
    
    setFormData(prev => ({
      ...prev,
      barcode: mockBarcode,
      sku: mockSku
    }));
  };

  // Add/Edit Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let finalCategoryId = formData.categoryId;
    let nextCategories = [...categories];

    if (isCustomCategory && customCategoryName.trim()) {
      const trimmedCustom = customCategoryName.trim();
      const existing = categories.find(c => c.name.toLowerCase() === trimmedCustom.toLowerCase());
      if (existing) {
        finalCategoryId = existing.id;
      } else {
        const newCatId = 'cat-' + Date.now();
        const newCat = {
          id: newCatId,
          name: trimmedCustom,
          description: ''
        };
        nextCategories.push(newCat);
        finalCategoryId = newCatId;
      }
    }

    if (editingProduct) {
      // Edit mode
      const updatedProducts = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...formData,
            categoryId: finalCategoryId,
            quantity: Number(formData.quantity),
            costPrice: Number(formData.costPrice),
            salePrice: Number(formData.salePrice),
            wholesalePrice: Number(formData.wholesalePrice),
            minStock: Number(formData.minStock)
          };
        }
        return p;
      });

      onSaveDB({
        ...db,
        categories: nextCategories,
        products: updatedProducts
      });
      addLog('Product Edit', `Updated item information for product: "${formData.name}"`);
    } else {
      // Add mode
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        ...formData,
        categoryId: finalCategoryId,
        quantity: Number(formData.quantity),
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        minStock: Number(formData.minStock),
        createdAt: new Date().toISOString()
      };

      onSaveDB({
        ...db,
        categories: nextCategories,
        products: [newProduct, ...products]
      });
      addLog('Product Add', `Added new product catalog entry: "${formData.name}"`);
    }

    setShowAddEditModal(false);
    resetForm();
  };

  // Delete product
  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you absolutely sure you want to delete "${p.name}"? This operation cannot be undone.`)) {
      const remaining = products.filter(item => item.id !== p.id);
      onSaveDB({
        ...db,
        products: remaining
      });
      addLog('Product Delete', `Deleted product from Catalog: "${p.name}"`);
    }
  };

  // Duplicate product
  const handleDuplicateProduct = (p: Product) => {
    const newProd: Product = {
      ...p,
      id: 'prod-' + Date.now(),
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-COPY`,
      barcode: `${p.barcode}1`,
      createdAt: new Date().toISOString()
    };

    onSaveDB({
      ...db,
      products: [newProd, ...products]
    });
    addLog('Product Duplicate', `Duplicated product "${p.name}" into copy template`);
  };

  // Perform specific count stock adjustment
  const handleSaveStockAdjustment = () => {
    if (!adjustingProduct || adjustQuantity <= 0) return;

    const changeAmount = adjustType === 'Add' ? adjustQuantity : -adjustQuantity;
    const finalQty = Math.max(adjustingProduct.quantity + changeAmount, 0);

    const updatedProducts = products.map(p => {
      if (p.id === adjustingProduct.id) {
        return {
          ...p,
          quantity: finalQty
        };
      }
      return p;
    });

    // Log the explicit audit movement
    const newLedgerEntities = [...db.ledgers];
    newLedgerEntities.push({
      id: 'ldg-adj-' + Date.now(),
      accountType: 'cash', // auxiliary log
      accountId: 'stock_adjustment',
      type: adjustType === 'Add' ? 'debit' : 'credit',
      amount: adjustQuantity * adjustingProduct.costPrice,
      balance: 0,
      date: new Date().toISOString(),
      description: `Manual Audited Stock move - ${adjustingProduct.name}: ${changeAmount} units. Notes: ${adjustNotes}`
    });

    onSaveDB({
      ...db,
      products: updatedProducts,
      ledgers: newLedgerEntities
    });

    addLog('Stock Adjusted', `Audited inventory for "${adjustingProduct.name}" from ${adjustingProduct.quantity} to ${finalQty}. Reason: ${adjustNotes}`);
    
    setShowAdjustModal(false);
    setAdjustingProduct(null);
    setAdjustQuantity(0);
    setAdjustNotes('');
  };

  // Simple CSV Export Download Trigger
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Product Name,Barcode,SKU,Cost Price,Sale Price,Wholesale Price,Quantity,Minimum Stock,Unit\n";
    
    products.forEach(p => {
      csvContent += `"${p.id}","${p.name}","${p.barcode}","${p.sku}",${p.costPrice},${p.salePrice},${p.wholesalePrice},${p.quantity},${p.minStock},"${p.unit}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "retail_products_catalog.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Export Catalog', 'Downloaded physical CSV backup spreadsheet of products checklist');
  };

  // Bulk CSV Mock Import Action
  const handleSimulateCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Simulated bulk spreadsheet parsed! Preloading custom schema templates standard offline CSV.");
    addLog('CSV Import', 'Simulated loading inventory spreadsheet values into SQLite offline layer.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-400">Total catalog collection holds <strong className="text-slate-650 dark:text-slate-200">{products.length} unique SKUs</strong></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-100 transition active:scale-98"
          >
            <FileDown className="w-4.5 h-4.5 text-slate-400" /> Export CSV Sheet
          </button>
          
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-100 transition active:scale-98">
            <FileUp className="w-4.5 h-4.5 text-slate-400" /> Import CSV Sheet
            <input type="file" accept=".csv" className="hidden" onChange={handleSimulateCSVImport} />
          </label>

          <button
            onClick={() => { resetForm(); setShowAddEditModal(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 transition shadow-md active:scale-98"
          >
            <Plus className="w-5 h-5" /> Add New SKU Code
          </button>
        </div>
      </div>

      {/* Catalog search options line */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by barcode value, SKU, custom titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-650 dark:text-slate-300 text-xs rounded-xl px-3.5 py-2 font-bold focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-651 dark:text-slate-301 text-xs rounded-xl px-3.5 py-2 font-bold focus:outline-none"
          >
            <option value="All">All Stocks Levels</option>
            <option value="Low">Low Stock Alerts</option>
            <option value="Out">Out of stock (0)</option>
          </select>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-850 text-slate-450 uppercase font-extrabold tracking-wider border-b border-indigo-50/10">
              <tr>
                <th className="px-5 py-4">Item SKU & Code</th>
                <th className="px-5 py-4">Product Display Name</th>
                <th className="px-5 py-4">Wholesale Supplier</th>
                <th className="px-5 py-4 text-right">Cost Price</th>
                <th className="px-5 py-4 text-right">Retail Sell</th>
                <th className="px-5 py-4 text-center">Remaining Quantity</th>
                <th className="px-5 py-2 text-center">Barcode Label</th>
                <th className="px-5 py-4 text-right">Action Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705/35">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition duration-150">
                    
                    {/* SKU info */}
                    <td className="px-5 py-3.5 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{p.sku}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Brcode: {p.barcode}</div>
                    </td>

                    {/* Display name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/50 dark:border-slate-600/50">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px]">
                              {p.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase mt-0.5">
                            {categories.find(c => c.id === p.categoryId)?.name || 'Misc'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Wholesale Supplier */}
                    <td className="px-5 py-3.5 text-slate-500 font-semibold">
                      {suppliers.find(s => s.id === p.supplierId)?.name || 'Default Supplier'}
                    </td>

                    {/* Pricing cost */}
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                      {currency} {p.costPrice.toLocaleString()}
                    </td>

                    {/* Pricing sell */}
                    <td className="px-5 py-3.5 text-right font-black text-slate-850 dark:text-slate-100">
                      {currency} {p.salePrice.toLocaleString()}
                    </td>

                    {/* Remaining quantity */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center font-bold px-2.5 py-1 rounded-full text-[10.5px] ${p.quantity <= 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20' : p.quantity <= p.minStock ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 font-extrabold' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/10 font-medium'}`}>
                        {p.quantity} {p.unit}
                      </span>
                    </td>

                    {/* Barcode labels generator widget */}
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => { setPrintingProduct(p); setShowBarcodeModal(true); }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-550 border rounded-lg px-2.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                      >
                        <Barcode className="w-3.5 h-3.5 text-indigo-500" /> Label
                      </button>
                    </td>

                    {/* Management actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Audit movement button */}
                        <button
                          onClick={() => { setAdjustingProduct(p); setShowAdjustModal(true); }}
                          title="Stock Adjustment"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-305 rounded-lg transition"
                        >
                          <Plus className="w-4 h-4 text-indigo-500" />
                        </button>

                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          title="Duplicate Copy"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-300 rounded-lg transition"
                        >
                          <Copy className="w-4 h-4 text-emerald-500" />
                        </button>

                        <button
                          onClick={() => {
                            setFormData({
                              name: p.name,
                              barcode: p.barcode,
                              sku: p.sku,
                              categoryId: p.categoryId,
                              brand: p.brand,
                              description: p.description,
                              costPrice: p.costPrice,
                              salePrice: p.salePrice,
                              wholesalePrice: p.wholesalePrice,
                              quantity: p.quantity,
                              minStock: p.minStock,
                              unit: p.unit,
                              supplierId: p.supplierId,
                              image: p.image || ''
                            });
                            setEditingProduct(p);
                            setIsCustomCategory(false);
                            setCustomCategoryName('');
                            setShowAddEditModal(true);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-650 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <AlertTriangle className="w-9 h-9 text-slate-350 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No products found meeting filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT PRODUCT MODAL popup */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-2xl w-full my-8 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-850 dark:text-white text-base">
                {editingProduct ? `Edit SKU Catalog - ${editingProduct.sku}` : 'Add New Retail Product SKU'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-200">✕ Close</button>
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">PRODUCT DISPLAY NAME *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                  placeholder="e.g. Coca Cola 1.5 Litre PET Bottle"
                />
              </div>

              {/* Code Generator row */}
              <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="block text-[10px] font-bold text-slate-400">BARCODE VALUE</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                    placeholder="Auto generated or scanned value..."
                  />
                </div>
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="block text-[10px] font-bold text-slate-400">PRODUCT SKU CODE</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                    placeholder="Auto generated or manual SKU..."
                  />
                </div>
                <button
                  type="button"
                  onClick={autoGenerateCodes}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-3 py-2 text-xs rounded-lg transition py-2 whitespace-nowrap active:scale-98 shadow-sm shrink-0"
                >
                  Auto Generate
                </button>
              </div>

              {/* Pricing section */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">COST PRICE (WHOLESALE BUY) ({currency})</label>
                <input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">RETAIL SALE PRICE ({currency})</label>
                <input
                  type="number"
                  value={formData.salePrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">WHOLESALE CLIENT PRICE ({currency})</label>
                <input
                  type="number"
                  value={formData.wholesalePrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: Number(e.target.value) }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Counts section */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">INITIAL QUANTITY IN STOCKS</label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2 text-xs font-bold text-slate-805 dark:text-slate-200 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">MINIMUM STOCK REACH WARNING</label>
                <input
                  type="number"
                  value={formData.minStock || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2 text-xs font-bold text-slate-805 dark:text-slate-200 focus:outline-none"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">MEASURING UNIT TYPE</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Pcs">Pieces (Pcs)</option>
                  <option value="Kg">Kilogram (Kg)</option>
                  <option value="Ltr">Litre (Ltr)</option>
                  <option value="Box">Carrying Box (Box)</option>
                  <option value="Pack">Bundle Pack (Pack)</option>
                </select>
              </div>              {/* Categorization */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400">CATEGORY</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-400 font-extrabold transition flex items-center gap-0.5"
                  >
                    {isCustomCategory ? "✕ Select List" : "✍️ Write Custom"}
                  </button>
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="Enter custom category name..."
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                ) : (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {categories.map(c => <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">PREFERRED SUPPLIER</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full border border-slate-200 bg-transparent rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none select-none"
                >
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Educational Category Info Banner */}
              <div className="sm:col-span-2 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/30 rounded-2xl flex items-start gap-2.5">
                <Info className="w-4.5 h-4.5 text-indigo-550 shrink-0 mt-0.5" />
                <div className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-350">
                  <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">What is the Category Section & How it Works:</strong>
                  Categories organize your store's inventory. When you select a Category (like <code className="font-mono bg-indigo-100/50 px-1 rounded dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">Groceries</code> or <code className="font-mono bg-indigo-100/50 px-1 rounded dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">Beverages</code>), this product automatically groups into that category on the POS Terminal, making search during checkout lightning-fast. It also routes reporting parameters, stock alerts, and financial sales analytics correctly in the Reports section.
                </div>
              </div>

              {/* Product Image Section */}
              <div className="sm:col-span-2 p-4 bg-slate-50 dark:bg-slate-855 rounded-2xl border border-slate-150 dark:border-slate-750 flex flex-col md:flex-row gap-4 items-center">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden shrink-0 relative group">
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition duration-150"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <Plus className="w-5 h-5 mx-auto mb-0.5 opacity-70" />
                      <span className="text-[8.5px] font-bold block uppercase leading-none">Photo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Image URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
                      placeholder="https://example.com/item-photo.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Or Upload local file</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, image: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block text-[10.5px] text-slate-500
                          file:mr-2 file:py-1 file:px-2.5
                          file:rounded-lg file:border-0
                          file:text-[10px] file:font-bold
                          file:bg-indigo-50 file:text-indigo-750
                          hover:file:bg-indigo-100 transition cursor-pointer"
                      />
                      
                      {Capacitor.isNativePlatform() && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const photo = await Camera.getPhoto({
                                quality: 80,
                                allowEditing: false,
                                resultType: CameraResultType.DataUrl,
                                source: CameraSource.Camera
                              });
                              if (photo.dataUrl) {
                                setFormData(prev => ({ ...prev, image: photo.dataUrl }));
                              }
                            } catch (err) {
                              console.warn('Camera photo capture cancelled or failed:', err);
                            }
                          }}
                          className="py-1 px-2.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition inline-flex items-center gap-1 shrink-0"
                        >
                          📷 Snap Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">SKU DESCRIPTION REMARKS</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. White vanilla hair conditioner active shine"
                />
              </div>

              <div className="sm:col-span-2 flex gap-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-505 text-white font-black rounded-xl transition shadow-lg"
                >
                  Save to Database
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MANUAL STOCK ADJUSTMENT TRIGGER MODAL */}
      {showAdjustModal && adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Audited Stock Move</h3>
              <p className="text-xs text-slate-400">Current Qty for {adjustingProduct.name}: <strong>{adjustingProduct.quantity} {adjustingProduct.unit}</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ADJUST DIRECTION</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('Add')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${adjustType === 'Add' ? 'bg-indigo-650/10 border-indigo-500 text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    Add Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('Subtract')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${adjustType === 'Subtract' ? 'bg-indigo-650/10 border-indigo-500 text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    Subtract Stock (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">CHANGE QUANTITY COUNT</label>
                <input
                  type="number"
                  min={1}
                  value={adjustQuantity || ''}
                  onChange={(e) => setAdjustQuantity(Math.max(Number(e.target.value), 0))}
                  className="w-full border border-slate-250 bg-transparent rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">REASON / NOTES</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border border-slate-250 bg-transparent rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  placeholder="e.g. Expired boxes destroyed or direct shelf count change"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 text-xs pt-2">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-slate-550 dark:text-slate-350 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStockAdjustment}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-505 transition"
              >
                Log Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE TAG GENERATOR PRINT PREVIEW MODAL */}
      {showBarcodeModal && printingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 z-50">
          <div className="bg-white text-slate-801 p-6 md:p-8 rounded-2xl w-full max-w-[560px] shadow-2xl relative border flex flex-col justify-between">
            
            <div className="flex items-center justify-between border-b pb-4 mb-4 print:hidden">
              <div>
                <h3 className="font-extrabold text-base">Barcode Tag Printer</h3>
                <p className="text-xs text-slate-500">Preview and print sheets of standard self-adhesive tags.</p>
              </div>
              <button onClick={() => setShowBarcodeModal(false)} className="text-slate-400 font-bold text-sm">✕ Close</button>
            </div>

            <div className="space-y-4 print:hidden">
              <div className="flex items-center justify-between text-xs text-slate-650 bg-slate-50 p-3 rounded-xl">
                <span>Product Name: <strong>{printingProduct.name}</strong></span>
                <span>Code Value: <strong>{printingProduct.barcode}</strong></span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">TAGS TO REPLICATE IN SHEET</label>
                <div className="flex gap-2">
                  {[4, 8, 12, 16, 24].map(n => (
                    <button
                      key={n}
                      onClick={() => setBarcodeLabelsCount(n)}
                      className={`py-1.5 px-3 border rounded-lg text-xs font-bold transition ${barcodeLabelsCount === n ? 'bg-indigo-650 text-white border-indigo-650' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                      {n} Labels
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BARCODE TAG GRID FOR PRINTING */}
            <div className="my-6 border border-dashed rounded-xl p-4 bg-slate-50/50 flex flex-wrap justify-center gap-4 max-h-[380px] overflow-y-auto" id="barcode-print-grid">
              {Array.from({ length: barcodeLabelsCount }).map((_, idx) => (
                <div key={idx} className="bg-white border rounded p-2.5 w-[140px] text-center flex flex-col items-center justify-between shadow-xs select-none hover:scale-105 transition">
                  <div className="text-[8.5px] font-bold text-slate-500 truncate w-full uppercase">{settings.shopName}</div>
                  <div className="text-[10px] font-extrabold text-slate-800 truncate w-full mt-0.5">{printingProduct.name}</div>
                  
                  {/* Vector simulated classic lines barcode display */}
                  <div className="w-[110px] h-8 flex items-center justify-between px-1.5 mt-2 bg-slate-50 rounded">
                    {[1,3,1,1,2,1,1,1,3,1,2,1,2,1,1,3,1,2,1].map((thickness, index) => (
                      <span 
                        key={index} 
                        className={`block h-6 ${index % 2 === 0 ? 'bg-black' : 'bg-transparent'}`}
                        style={{ width: `${thickness}px` }}
                      ></span>
                    ))}
                  </div>

                  <div className="text-[9px] font-mono font-bold text-slate-700 tracking-wider mt-1">{printingProduct.barcode}</div>
                  <div className="text-[10px] font-black text-slate-900 mt-1">{currency}{printingProduct.salePrice.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 text-xs pt-4 border-t print:hidden">
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="flex-1 py-3 border rounded-xl text-slate-650 font-bold hover:bg-slate-50 transition"
              >
                Close Printer
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-655 text-white font-bold rounded-xl hover:bg-indigo-600 transition shadow-lg flex items-center justify-center gap-1.5"
              >
                Print Barcode Tags Grid
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
