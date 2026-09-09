import React from 'react';
import { 
  FileText, 
  Store, 
  Calendar, 
  ChevronRight, 
  Tv, 
  Cpu, 
  Car, 
  Package, 
  Sparkles,
  Home
} from 'lucide-react';
import { Purchase, ProductCategory } from '../types';
import { formatPrice } from '../utils/currency';

interface PurchaseCardProps {
  purchase: Purchase;
  onSelect: (purchase: Purchase) => void;
}

function getCategoryIcon(cat: ProductCategory) {
  switch (cat) {
    case 'Electronics':
      return <Tv className="w-3.5 h-3.5" />;
    case 'Computers':
      return <Cpu className="w-3.5 h-3.5" />;
    case 'Home Appliances':
      return <Home className="w-3.5 h-3.5" />;
    case 'Vehicles':
      return <Car className="w-3.5 h-3.5" />;
    default:
      return <Package className="w-3.5 h-3.5" />;
  }
}

function getCategoryColor(cat: ProductCategory) {
  switch (cat) {
    case 'Electronics':
      return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'Computers':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'Home Appliances':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Vehicles':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100';
  }
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  purchase,
  onSelect,
}) => {
  const { status, daysRemaining } = purchase;

  // Calculate warranty progress percentage (based on purchase date, today, and expiry date)
  const purchaseTime = new Date(purchase.purchaseDate).getTime();
  const expiryTime = new Date(purchase.warrantyExpiryDate).getTime();
  const now = Date.now();
  const totalDuration = Math.max(1, expiryTime - purchaseTime);
  const elapsed = Math.max(0, Math.min(totalDuration, now - purchaseTime));
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  return (
    <div
      id={`purchase-card-${purchase.id}`}
      onClick={() => onSelect(purchase)}
      className="group relative flex flex-col justify-between p-5 rounded-2xl sm:rounded-3xl bg-white/90 hover:bg-white border border-slate-100/90 hover:border-indigo-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top badges bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Category tag */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
              purchase.category
            )}`}
          >
            {getCategoryIcon(purchase.category)}
            <span>{purchase.category}</span>
          </span>

          {/* Status Badge */}
          {status === 'ACTIVE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{daysRemaining > 60 ? `${Math.round(daysRemaining / 30)} mos left` : `${daysRemaining}d left`}</span>
            </span>
          )}

          {status === 'EXPIRING_SOON' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`}
              </span>
            </span>
          )}

          {status === 'EXPIRED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Expired</span>
            </span>
          )}
        </div>

        {/* Product Name & Brand */}
        <div className="mb-2">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            {purchase.brand || 'Item'}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {purchase.productName}
          </h3>
          {purchase.model && purchase.model !== 'N/A' && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              Model: {purchase.model}
            </p>
          )}
        </div>

        {/* Store & Date meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 my-3">
          {purchase.store && (
            <span className="inline-flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[130px]">{purchase.store}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{purchase.purchaseDate}</span>
          </span>
        </div>
      </div>

      {/* Bottom Section: Warranty Timeline Bar & Actions */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
            <span>Warranty: {purchase.warrantyPeriodMonths} mos</span>
            <span className={status === 'EXPIRED' ? 'text-rose-500 font-semibold' : status === 'EXPIRING_SOON' ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
              Exp: {purchase.warrantyExpiryDate}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'EXPIRED'
                  ? 'bg-rose-400'
                  : status === 'EXPIRING_SOON'
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer row: price & view bill action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price Paid</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatPrice(purchase.price, purchase.currency)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 bg-indigo-50/70 group-hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl transition-colors">
            <FileText className="w-3.5 h-3.5" />
            <span>View Bill</span>
            <ChevronRight className="w-3.5 h-3.5 -mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
