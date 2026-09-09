import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Calendar, 
  FileText, 
  Store, 
  DollarSign, 
  Tag, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Eye,
  RefreshCw,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ProductCategory, Purchase, ExtractedBillData } from '../types';
import { SAMPLE_BILLS, SampleBillItem } from './SampleBills';
import { getCurrencySymbol } from '../utils/currency';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPurchase: Purchase) => void;
}

type Step = 'UPLOAD' | 'SCANNING' | 'VERIFY';

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [scanningStatus, setScanningStatus] = useState<string>('Reading document...');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState<number | string>(0);
  const [currency, setCurrency] = useState('USD');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [store, setStore] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electronics');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [ocrNotes, setOcrNotes] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto calculate expiry date whenever purchase date or months change
  const recalculateExpiry = (dateStr: string, months: number) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + months);
        setWarrantyExpiryDate(d.toISOString().split('T')[0]);
      }
    } catch {
      // ignore date calculation errors
    }
  };

  const handleFileChange = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setFileType(file.type || 'image/jpeg');
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setFileDataUrl(result);
      startScan(result, file.name, file.type);
    };
    reader.onerror = () => {
      setError('Could not read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const selectSampleBill = (sample: SampleBillItem) => {
    setError(null);
    setFileName(`${sample.name.replace(/\s+/g, '_')}_Bill.svg`);
    setFileType('image/svg+xml');
    setFileSize(38000);
    setFileDataUrl(sample.dataUrl);

    startScan(sample.dataUrl, sample.name, 'image/svg+xml', sample);
  };

  const startScan = async (dataUrl: string, name: string, type: string, prefill?: SampleBillItem) => {
    setStep('SCANNING');
    setError(null);

    // Staggered status messages for reassuring AI experience
    const statuses = [
      'Scanning receipt text & layout...',
      'Extracting brand, product name & model...',
      'Detecting purchase date & invoice number...',
      'Calculating warranty terms...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % statuses.length;
      setScanningStatus(statuses[i]);
    }, 600);

    try {
      const response = await api.scanBill(dataUrl, name, type);
      clearInterval(interval);
      const data: ExtractedBillData = response.data;

      // Fill in extracted details
      setProductName(data.productName || prefill?.name || '');
      setBrand(data.brand || prefill?.brand || '');
      setModel(data.model || '');
      setPurchaseDate(data.purchaseDate || prefill?.date || new Date().toISOString().split('T')[0]);
      setPrice(data.price || prefill?.price || 0);
      setCurrency(data.currency || prefill?.currency || 'USD');
      setInvoiceNumber(data.invoiceNumber || prefill?.invoiceNo || '');
      setStore(data.store || prefill?.store || '');
      setCategory(data.category || (prefill?.category as ProductCategory) || 'Home Appliances');
      setOcrConfidence(data.ocrConfidence || 'High (AI OCR Verified)');
      
      const months = data.warrantyPeriodMonths || prefill?.warrantyMonths || 12;
      setWarrantyMonths(months);

      if (data.warrantyExpiryDate) {
        setWarrantyExpiryDate(data.warrantyExpiryDate);
      } else {
        recalculateExpiry(data.purchaseDate || prefill?.date || new Date().toISOString().split('T')[0], months);
      }

      setNotes(data.rawNotes || '');
      setOcrNotes(data.rawNotes || '');
      setStep('VERIFY');
    } catch (err: unknown) {
      clearInterval(interval);
      console.warn('Scan API fallback:', err);
      // Clean fallback: do not invent random UUIDs or fake model numbers
      const rawName = name.replace(/\.[^/.]+$/, '');
      const cleanName = !/^[a-f0-9-]{12,}$/i.test(rawName)
        ? rawName.replace(/[_-]/g, ' ')
        : '';
      setProductName(cleanName);
      setBrand('');
      setModel('');
      const todayStr = new Date().toISOString().split('T')[0];
      setPurchaseDate(todayStr);
      setPrice(0);
      setCurrency('USD');
      setWarrantyMonths(12);
      setOcrConfidence('Manual Review Required');
      recalculateExpiry(todayStr, 12);
      setStep('VERIFY');
    }
  };

  const handleManualEntry = () => {
    setFileDataUrl('');
    setFileName('');
    setFileType('');
    setFileSize(0);
    setProductName('');
    setBrand('');
    setModel('');
    const todayStr = new Date().toISOString().split('T')[0];
    setPurchaseDate(todayStr);
    setPrice(0);
    setCategory('Electronics');
    setWarrantyMonths(12);
    recalculateExpiry(todayStr, 12);
    setStep('VERIFY');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Product name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newPurchase = await api.createPurchase({
        productName: productName.trim(),
        brand: brand.trim(),
        model: model.trim(),
        purchaseDate,
        price: Number(price) || 0,
        currency,
        invoiceNumber: invoiceNumber.trim(),
        store: store.trim(),
        category,
        warrantyPeriodMonths: Number(warrantyMonths) || 12,
        warrantyExpiryDate,
        notes: notes.trim(),
        document: fileDataUrl ? {
          fileName: fileName || 'uploaded_bill.pdf',
          fileType: fileType || 'image/jpeg',
          fileSize: fileSize || 0,
          fileDataUrl,
          ocrRawText: ocrNotes
        } : undefined
      });

      onSuccess(newPurchase);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm bg-slate-900/40">
      <div 
        id="add-purchase-modal-container"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50/80 via-indigo-50/50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 'UPLOAD' && 'Upload Purchase Bill & Warranty'}
                {step === 'SCANNING' && 'AI OCR Scanner in Progress'}
                {step === 'VERIFY' && 'Verify & Save Purchase Details'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'UPLOAD' && 'Upload a photo, receipt image, or PDF to extract details automatically.'}
                {step === 'SCANNING' && 'Gemini AI is reading and extracting receipt fields...'}
                {step === 'VERIFY' && 'Review extracted information before saving to your personal vault.'}
              </p>
            </div>
          </div>
          <button
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-8 sm:p-10 text-center cursor-pointer bg-gradient-to-b from-indigo-50/40 via-white to-violet-50/20 hover:bg-indigo-50/50 transition-all duration-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-100/70 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Drag &amp; drop your purchase bill, receipt or invoice
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5">
                  Supports JPG, PNG, WEBP and PDF documents. Max 25MB.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm shadow-violet-500/20 transition-all">
                  <FileText className="w-4 h-4" />
                  <span>Choose Bill from Device</span>
                </div>
              </div>

              {/* Sample Invoices Preset for 1-click testing */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    Or test with a sample bill instantly:
                  </span>
                  <button
                    onClick={handleManualEntry}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors underline"
                  >
                    Enter details manually without bill
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SAMPLE_BILLS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => selectSampleBill(sample)}
                      className="text-left p-3.5 rounded-2xl border border-slate-200/80 hover:border-violet-300 bg-white hover:bg-violet-50/40 shadow-2xs transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                          {sample.store}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          ${sample.price}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-violet-700">
                        {sample.name}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{sample.category}</span>
                        <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                          Scan Bill &rarr;
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING */}
          {step === 'SCANNING' && (
            <div className="py-14 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-violet-100 animate-ping opacity-30" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
                  <Sparkles className="w-10 h-10 animate-spin text-violet-200" style={{ animationDuration: '4s' }} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  AI OCR Scanning in Progress
                </h3>
                <p className="text-xs sm:text-sm text-indigo-600 font-semibold mt-1">
                  {scanningStatus}
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  Extracting product name, brand, purchase date, invoice number, and calculating warranty expiry.
                </p>
              </div>

              <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* STEP 3: VERIFY & EDIT DETAILS */}
          {step === 'VERIFY' && (
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Bill Document Preview */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-violet-600" />
                      Original Bill Document
                    </span>
                    {fileName && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {fileName}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-h-[300px] max-h-[480px] bg-slate-50 rounded-2xl border border-slate-200 p-2 overflow-y-auto flex items-center justify-center">
                    {fileDataUrl ? (
                      fileType.includes('pdf') ? (
                        <div className="text-center p-6 text-slate-500">
                          <FileText className="w-16 h-16 text-rose-500 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-800">{fileName}</p>
                          <p className="text-[11px] text-slate-400 mt-1">PDF document loaded and parsed</p>
                        </div>
                      ) : (
                        <img
                          src={fileDataUrl}
                          alt="Bill preview"
                          className="w-full h-auto object-contain rounded-xl shadow-xs"
                        />
                      )
                    ) : (
                      <div className="text-center p-6 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-medium">No document attached (Manual entry)</p>
                      </div>
                    )}
                  </div>

                  {fileDataUrl && (
                    <button
                      type="button"
                      onClick={() => setStep('UPLOAD')}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Upload a different bill</span>
                    </button>
                  )}
                </div>

                {/* Right Column: Editable Verified Form Fields */}
                <div className="lg:col-span-7 space-y-4">
                  {ocrConfidence && (
                    <div className={`p-3 rounded-2xl flex items-center justify-between text-xs border ${
                      ocrConfidence.includes('High')
                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                        : 'bg-amber-50/70 border-amber-200/80 text-amber-800'
                    }`}>
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {ocrConfidence.includes('High')
                            ? 'AI OCR successfully extracted details from your bill. Please review:'
                            : 'Please review and complete the purchase details below:'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white/80 rounded-full shrink-0 shadow-2xs">
                        {ocrConfidence}
                      </span>
                    </div>
                  )}
                  
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      id="input-product-name"
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Sony Bravia 55' 4K OLED TV"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                  </div>

                  {/* Brand and Model */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        id="input-product-brand"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Sony, Apple, Dyson"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Model / Spec
                      </label>
                      <input
                        id="input-product-model"
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. XR-55A80L"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Category & Store */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        id="select-product-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Home Appliances">Home Appliances</option>
                        <option value="Computers">Computers</option>
                        <option value="Vehicles">Vehicles</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Store / Retailer
                      </label>
                      <input
                        id="input-store"
                        type="text"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="e.g. Best Buy, Amazon, Apple Store"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Purchase Date & Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Purchase Date *
                      </label>
                      <input
                        id="input-purchase-date"
                        type="date"
                        required
                        value={purchaseDate}
                        onChange={(e) => {
                          setPurchaseDate(e.target.value);
                          recalculateExpiry(e.target.value, warrantyMonths);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Price &amp; Currency ({getCurrencySymbol(currency)})
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          id="select-currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD (CA$)</option>
                          <option value="AUD">AUD (AU$)</option>
                        </select>
                        <input
                          id="input-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice / Receipt Number
                    </label>
                    <input
                      id="input-invoice-number"
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-882194 or Order ID"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                  </div>

                  {/* Warranty Period with Quick Duration Pills */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-600" />
                        Warranty Period (Months)
                      </label>
                      <span className="text-xs font-bold text-violet-700">
                        Expires: {warrantyExpiryDate || 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      {[6, 12, 24, 36, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setWarrantyMonths(m);
                            recalculateExpiry(purchaseDate, m);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            warrantyMonths === m
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {m < 12 ? `${m} Mos` : `${m / 12} ${m === 12 ? 'Year' : 'Years'}`}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                          Custom Months
                        </span>
                        <input
                          id="input-warranty-months"
                          type="number"
                          min="1"
                          max="120"
                          value={warrantyMonths}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setWarrantyMonths(val);
                            recalculateExpiry(purchaseDate, val);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                          Calculated Expiry Date
                        </span>
                        <input
                          id="input-warranty-expiry-date"
                          type="date"
                          value={warrantyExpiryDate}
                          onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notes / Serial Number / Coverage Details
                    </label>
                    <textarea
                      id="input-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Serial #SN-998421, covers replacement of parts & labor."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-purchase-btn"
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving to Vault...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save &amp; Protect in Vault</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
