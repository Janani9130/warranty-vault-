import React from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  DollarSign 
} from 'lucide-react';
import { DashboardStats, WarrantyStatus } from '../types';

interface StatsOverviewProps {
  stats: DashboardStats;
  currentStatusFilter: string;
  onFilterStatus: (status: WarrantyStatus | 'ALL') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  currentStatusFilter,
  onFilterStatus,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      {/* 1. Total Purchases */}
      <button
        id="stat-total-purchases-card"
        onClick={() => onFilterStatus('ALL')}
        className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
          currentStatusFilter === 'ALL'
            ? 'bg-gradient-to-br from-indigo-50/90 to-violet-50/90 border-indigo-200 ring-2 ring-indigo-400/30 shadow-md shadow-indigo-100'
            : 'bg-white/80 hover:bg-indigo-50/40 border-slate-100 hover:border-indigo-100 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
            All Items
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalPurchases}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-medium text-slate-500">
              Total Purchases
            </p>
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <DollarSign className="w-3 h-3 -mr-0.5" />
              {stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </button>

      {/* 2. Active Warranties */}
      <button
        id="stat-active-warranties-card"
        onClick={() => onFilterStatus('ACTIVE')}
        className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
          currentStatusFilter === 'ACTIVE'
            ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border-emerald-200 ring-2 ring-emerald-400/30 shadow-md shadow-emerald-100'
            : 'bg-white/80 hover:bg-emerald-50/40 border-slate-100 hover:border-emerald-100 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Protected
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.activeWarranties}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Active Warranties
          </p>
        </div>
      </button>

      {/* 3. Expiring Soon */}
      <button
        id="stat-expiring-soon-card"
        onClick={() => onFilterStatus('EXPIRING_SOON')}
        className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
          currentStatusFilter === 'EXPIRING_SOON'
            ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-200 ring-2 ring-amber-400/30 shadow-md shadow-amber-100'
            : 'bg-white/80 hover:bg-amber-50/40 border-slate-100 hover:border-amber-100 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Within 30d
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.expiringSoon}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-medium text-slate-500">
              Expiring Soon
            </p>
            {stats.expiringUrgent > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-1.5 py-0.5 rounded-md">
                {stats.expiringUrgent} in ≤7d
              </span>
            )}
          </div>
        </div>
      </button>

      {/* 4. Expired */}
      <button
        id="stat-expired-card"
        onClick={() => onFilterStatus('EXPIRED')}
        className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
          currentStatusFilter === 'EXPIRED'
            ? 'bg-gradient-to-br from-rose-50/90 to-pink-50/90 border-rose-200 ring-2 ring-rose-400/30 shadow-md shadow-rose-100'
            : 'bg-white/80 hover:bg-rose-50/40 border-slate-100 hover:border-rose-100 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Lapsed
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.expiredWarranties}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Expired Warranties
          </p>
        </div>
      </button>

    </div>
  );
};
