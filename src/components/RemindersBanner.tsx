import React from 'react';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { WarrantyReminder } from '../types';

interface RemindersBannerProps {
  reminders: WarrantyReminder[];
  onSelectPurchase: (purchaseId: string) => void;
}

export const RemindersBanner: React.FC<RemindersBannerProps> = ({
  reminders,
  onSelectPurchase,
}) => {
  // Find urgent reminders (within 30 days and not read or critical)
  const activeAlerts = reminders.filter(r => r.daysRemaining >= 0 && r.daysRemaining <= 30);

  if (activeAlerts.length === 0) return null;

  // Pick the most urgent reminder
  const mostUrgent = activeAlerts[0];
  const isCritical = mostUrgent.daysRemaining <= 7;

  return (
    <div
      id="warranty-reminders-banner"
      className={`mb-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
        isCritical
          ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-100/50 border-amber-200/80 shadow-sm shadow-amber-500/5'
          : 'bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-sky-50/70 border-indigo-100/80 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isCritical
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-amber-200/70 text-amber-900'
                    : 'bg-indigo-200/70 text-indigo-900'
                }`}
              >
                {isCritical ? '⚠️ Urgent Warranty Notice' : '⏰ Expiry Reminder'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {activeAlerts.length} item{activeAlerts.length > 1 ? 's' : ''} expiring within 30 days
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              <span className="font-bold text-slate-900">{mostUrgent.brand} {mostUrgent.productName}</span>:{' '}
              {mostUrgent.daysRemaining === 0 ? (
                <span className="text-rose-600 font-bold">Expires today!</span>
              ) : mostUrgent.daysRemaining <= 7 ? (
                <span className="text-amber-700 font-bold">Only {mostUrgent.daysRemaining} day{mostUrgent.daysRemaining === 1 ? '' : 's'} remaining!</span>
              ) : (
                <span className="text-slate-700">{mostUrgent.daysRemaining} days left</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              {mostUrgent.message}
            </p>
          </div>
        </div>

        <button
          id="banner-view-claim-btn"
          onClick={() => onSelectPurchase(mostUrgent.purchaseId)}
          className={`shrink-0 self-end sm:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 ${
            isCritical
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <span>View Item &amp; Bill</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
