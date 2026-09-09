import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Store, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Printer,
  Package,
  AlertCircle,
  FileMinus
} from 'lucide-react';
import { Purchase } from '../types';
import { api } from '../services/api';
import { formatPrice, getCurrencySymbol } from '../utils/currency';

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Purchase) => void;
  onDelete: (id: string) => void;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  purchase,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'BILL' | 'CLAIM'>('DETAILS');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // In-app delete confirmation state (bypasses browser's blocked window.confirm)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'PURCHASE' | 'BILL_ONLY'>('PURCHASE');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editStore, setEditStore] = useState('');
  const [editInvoice, setEditInvoice] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen || !purchase) return null;

  const startEdit = () => {
    setEditName(purchase.productName);
    setEditBrand(purchase.brand);
    setEditModel(purchase.model);
    setEditPrice(purchase.price);
    setEditCurrency(purchase.currency || 'USD');
    setEditStore(purchase.store);
    setEditInvoice(purchase.invoiceNumber);
    setEditExpiryDate(purchase.warrantyExpiryDate);
    setEditNotes(purchase.notes || '');
    setIsEditing(true);
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const updated = await api.updatePurchase(purchase.id, {
        productName: editName.trim(),
        brand: editBrand.trim(),
        model: editModel.trim(),
        price: Number(editPrice) || 0,
        currency: editCurrency,
        store: editStore.trim(),
        invoiceNumber: editInvoice.trim(),
        warrantyExpiryDate: editExpiryDate,
        notes: editNotes.trim(),
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update purchase details');
    }
  };

  // Open confirmation for deleting entire purchase
  const promptDeletePurchase = () => {
    setDeleteMode('PURCHASE');
    setActionError(null);
    setShowDeleteConfirm(true);
  };

  // Open confirmation for removing only the bill file
  const promptRemoveBillOnly = () => {
    setDeleteMode('BILL_ONLY');
    setActionError(null);
    setShowDeleteConfirm(true);
  };

  // Execute full purchase deletion
  const executeDeletePurchase = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      await api.deletePurchase(purchase.id);
      setShowDeleteConfirm(false);
      onDelete(purchase.id);
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete purchase from vault.');
      setIsDeleting(false);
    }
  };

  // Execute removing bill document only
  const executeRemoveBillOnly = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await api.removePurchaseDocument(purchase.id);
      if (res.purchase) {
        onUpdate(res.purchase);
      }
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove bill document.');
      setIsDeleting(false);
    }
  };

  const copyClaimSummary = () => {
    const text = `WARRANTY CLAIM DETAILS
Product: ${purchase.brand} ${purchase.productName}
Model / Spec: ${purchase.model || 'N/A'}
Store / Seller: ${purchase.store || 'Authorized Retailer'}
Invoice / Receipt #: ${purchase.invoiceNumber || 'N/A'}
Purchase Date: ${purchase.purchaseDate}
Warranty Duration: ${purchase.warrantyPeriodMonths} Months
Warranty Expiry Date: ${purchase.warrantyExpiryDate}
Current Status: ${purchase.status} (${purchase.daysRemaining > 0 ? `${purchase.daysRemaining} days remaining` : 'Expired'})
Notes: ${purchase.notes || 'None'}
Archived in WarrantyVault.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBill = () => {
    if (!purchase.document) return;

    const link = document.createElement('a');
    link.href = purchase.document.fileDataUrl;
    link.download = purchase.document.fileName || `${purchase.productName.replace(/\s+/g, '_')}_Bill.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printClaimSheet = () => {
    window.print();
  };

  // Calculate timeline
  const purchaseTime = new Date(purchase.purchaseDate).getTime();
  const expiryTime = new Date(purchase.warrantyExpiryDate).getTime();
  const now = Date.now();
  const totalDuration = Math.max(1, expiryTime - purchaseTime);
  const elapsed = Math.max(0, Math.min(totalDuration, now - purchaseTime));
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm bg-slate-900/40 print:p-0 print:bg-white">
      <div 
        id="purchase-detail-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all print:shadow-none print:border-none print:m-0"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-white border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
              {purchase.category}
            </span>
            <span className="text-xs font-medium text-slate-400">
              • Added {new Date(purchase.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <>
                <button
                  id="detail-edit-btn"
                  onClick={startEdit}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Edit details"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  id="detail-delete-btn"
                  onClick={promptDeletePurchase}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Delete from vault"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
            <button
              id="detail-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/50 print:hidden">
          <button
            id="tab-product-details"
            onClick={() => { setActiveTab('DETAILS'); setIsEditing(false); }}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'DETAILS'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Product &amp; Warranty
          </button>
          <button
            id="tab-original-bill"
            onClick={() => { setActiveTab('BILL'); setIsEditing(false); }}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'BILL'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original Bill ({purchase.document ? '1' : '0'})</span>
          </button>
          <button
            id="tab-claim-helper"
            onClick={() => { setActiveTab('CLAIM'); setIsEditing(false); }}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'CLAIM'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Claim Helper</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* TAB 1: PRODUCT & WARRANTY DETAILS */}
          {activeTab === 'DETAILS' && (
            isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Edit Purchase Information</h3>
                  <span className="text-xs text-slate-400">All fields are editable</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Brand</label>
                    <input
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Model</label>
                    <input
                      type="text"
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Price &amp; Currency ({getCurrencySymbol(editCurrency)})
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value)}
                        className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (CA$)</option>
                        <option value="AUD">AUD (AU$)</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Store / Retailer</label>
                    <input
                      type="text"
                      value={editStore}
                      onChange={(e) => setEditStore(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={editInvoice}
                      onChange={(e) => setEditInvoice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Warranty Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={promptDeletePurchase}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Purchase</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Title and Top Status Card */}
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    {purchase.brand || 'Item'}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    {purchase.productName}
                  </h1>
                  {purchase.model && purchase.model !== 'N/A' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Model / Serial: <span className="font-semibold text-slate-700">{purchase.model}</span>
                    </p>
                  )}
                </div>

                {/* Warranty Timeline Card */}
                <div className={`p-4 sm:p-5 rounded-2xl border ${
                  purchase.status === 'ACTIVE'
                    ? 'bg-emerald-50/50 border-emerald-200/80'
                    : purchase.status === 'EXPIRING_SOON'
                    ? 'bg-amber-50/50 border-amber-200/80'
                    : 'bg-rose-50/50 border-rose-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {purchase.status === 'ACTIVE' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      )}
                      {purchase.status === 'EXPIRING_SOON' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      {purchase.status === 'EXPIRED' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      )}

                      <span className="text-sm font-bold text-slate-800">
                        {purchase.status === 'ACTIVE' && 'Active Warranty Coverage'}
                        {purchase.status === 'EXPIRING_SOON' && 'Warranty Expiring Soon!'}
                        {purchase.status === 'EXPIRED' && 'Warranty Coverage Expired'}
                      </span>
                    </div>

                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      purchase.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : purchase.status === 'EXPIRING_SOON'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {purchase.daysRemaining > 0 
                        ? `${purchase.daysRemaining} days remaining` 
                        : `Lapsed on ${purchase.warrantyExpiryDate}`}
                    </span>
                  </div>

                  {/* Visual timeline bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-white/80 p-0.5 border border-slate-200/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          purchase.status === 'ACTIVE'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : purchase.status === 'EXPIRING_SOON'
                            ? 'bg-amber-500'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Purchased: {purchase.purchaseDate}</span>
                      <span>Expires: {purchase.warrantyExpiryDate}</span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Store / Seller</span>
                    <span className="text-slate-800 font-bold text-sm mt-0.5 block truncate">
                      {purchase.store || 'Retailer'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Price Paid</span>
                    <span className="text-slate-800 font-bold text-sm mt-0.5 block">
                      {formatPrice(purchase.price, purchase.currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Invoice #</span>
                    <span className="text-slate-800 font-bold text-sm mt-0.5 block truncate">
                      {purchase.invoiceNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Category</span>
                    <span className="text-slate-800 font-semibold mt-0.5 block">
                      {purchase.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Warranty Duration</span>
                    <span className="text-slate-800 font-semibold mt-0.5 block">
                      {purchase.warrantyPeriodMonths} Months ({Math.round(purchase.warrantyPeriodMonths / 12 * 10) / 10} yrs)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Bill Attachment</span>
                    <span className="text-indigo-600 font-semibold mt-0.5 block">
                      {purchase.document ? 'Verified & Stored' : 'No file attached'}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {purchase.notes && (
                  <div className="p-3.5 rounded-2xl bg-violet-50/40 border border-violet-100 text-xs">
                    <span className="font-bold text-violet-900 block mb-1">Notes &amp; Coverage Terms</span>
                    <p className="text-slate-700 leading-relaxed">{purchase.notes}</p>
                  </div>
                )}

                {/* Bottom Management Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Manage Vault Record</span>
                    <span className="text-slate-500">Need to remove this purchase or replace its documents?</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {purchase.document && (
                      <button
                        onClick={promptRemoveBillOnly}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors"
                      >
                        <FileMinus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Remove Bill Only</span>
                      </button>
                    )}
                    <button
                      id="card-footer-delete-btn"
                      onClick={promptDeletePurchase}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-2xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete from Vault</span>
                    </button>
                  </div>
                </div>

              </div>
            )
          )}

          {/* TAB 2: ORIGINAL BILL DOCUMENT VIEWER */}
          {activeTab === 'BILL' && (
            <div className="space-y-4">
              {purchase.document ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {purchase.document.fileName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Uploaded on {new Date(purchase.document.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="download-original-bill-btn"
                        onClick={downloadBill}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Bill</span>
                      </button>

                      <button
                        id="remove-bill-btn"
                        onClick={promptRemoveBillOnly}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs transition-colors"
                        title="Remove attached bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* Viewer */}
                  <div className="w-full min-h-[420px] max-h-[550px] bg-slate-100 rounded-2xl border border-slate-200 overflow-y-auto p-4 flex items-center justify-center">
                    {purchase.document.fileDataUrl ? (
                      purchase.document.fileType.includes('pdf') ? (
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-sm">
                          <FileText className="w-16 h-16 text-rose-500 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-800">{purchase.document.fileName}</p>
                          <p className="text-xs text-slate-500 mt-1">PDF document archived securely in vault.</p>
                          <div className="mt-4 flex flex-col gap-2">
                            <button
                              onClick={downloadBill}
                              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                            <button
                              onClick={promptRemoveBillOnly}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete this PDF from vault</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={purchase.document.fileDataUrl}
                          alt="Original Purchase Receipt"
                          className="max-w-full h-auto object-contain rounded-xl shadow-md"
                        />
                      )
                    ) : (
                      <p className="text-xs text-slate-400">Bill document preview unavailable.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <FileText className="w-12 h-12 mx-auto opacity-40 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">No original bill currently attached</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    The bill document for this item was deleted or entered manually. You can still track warranties or click Edit to update.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WARRANTY CLAIM HELPER */}
          {activeTab === 'CLAIM' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-violet-600" />
                      Ready for Warranty Claim Submission
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Everything needed to file a claim with {purchase.brand || 'the manufacturer'} or {purchase.store || 'store'} customer support is consolidated below.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="copy-claim-summary-btn"
                      onClick={copyClaimSummary}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-700 bg-white hover:bg-violet-100 border border-violet-200 shadow-2xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Info'}</span>
                    </button>
                    <button
                      onClick={printClaimSheet}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors"
                      title="Print claim sheet"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-100/80 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed select-all">
                  {`WARRANTY CLAIM SHEET
----------------------------------------
Item: ${purchase.brand} ${purchase.productName}
Model / Spec: ${purchase.model || 'N/A'}
Store / Seller: ${purchase.store || 'Authorized Retailer'}
Invoice / Receipt #: ${purchase.invoiceNumber || 'N/A'}
Date of Purchase: ${purchase.purchaseDate}
Warranty Term: ${purchase.warrantyPeriodMonths} Months
Expiry Date: ${purchase.warrantyExpiryDate}
Claim Status: ${purchase.status} (${purchase.daysRemaining > 0 ? `${purchase.daysRemaining} days left` : 'Expired'})
Proof of Purchase: Archived & Verified in WarrantyVault
----------------------------------------`}
                </div>
              </div>

              {/* Steps for filing claim */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <h5 className="text-xs font-bold text-slate-700 mb-2">
                  Quick Steps to File Your Claim:
                </h5>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Click <strong>Download Bill</strong> to retrieve the original invoice receipt.</li>
                  <li>Copy the warranty claim sheet using the <strong>Copy Info</strong> button above.</li>
                  <li>Visit the official <strong>{purchase.brand || 'manufacturer'}</strong> support portal or contact <strong>{purchase.store || 'retailer'}</strong>.</li>
                  <li>Provide invoice number <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-bold">{purchase.invoiceNumber || 'N/A'}</code> and attach the bill document.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* IN-APP CONFIRMATION MODAL OVERLAY (Safe in iframes) */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 text-center">
                {deleteMode === 'PURCHASE' ? 'Delete Purchase from Vault?' : 'Remove Attached Bill?'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 text-center mt-2 leading-relaxed">
                {deleteMode === 'PURCHASE' ? (
                  <>
                    Are you sure you want to permanently delete <strong>{purchase.productName}</strong>? This will remove its purchase record, warranty tracking, and attached receipt.
                  </>
                ) : (
                  <>
                    Are you sure you want to remove the bill document for <strong>{purchase.productName}</strong>? The purchase details and warranty countdown will remain in your vault.
                  </>
                )}
              </p>

              {actionError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs">
                  {actionError}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2.5">
                {deleteMode === 'PURCHASE' ? (
                  <>
                    <button
                      id="confirm-delete-purchase-btn"
                      onClick={executeDeletePurchase}
                      disabled={isDeleting}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Deleting Purchase...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Yes, Delete Everything</span>
                        </>
                      )}
                    </button>

                    {purchase.document && (
                      <button
                        onClick={executeRemoveBillOnly}
                        disabled={isDeleting}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <FileMinus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Remove Attached Bill Only</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    id="confirm-remove-bill-btn"
                    onClick={executeRemoveBillOnly}
                    disabled={isDeleting}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Removing Bill...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Yes, Remove Bill Document</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  id="cancel-delete-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
