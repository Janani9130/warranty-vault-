import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  AlertTriangle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WarrantyReminder } from '../types';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  reminders: WarrantyReminder[];
  onSelectPurchase: (purchaseId: string) => void;
  onMarkReminderRead: (id: string) => void;
  onMarkAllRemindersRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenAuthModal,
  reminders,
  onSelectPurchase,
  onMarkReminderRead,
  onMarkAllRemindersRead,
}) => {
  const { user, logout, demoLogin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadReminders = reminders.filter(r => !r.isRead);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-indigo-100/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-900 bg-clip-text text-transparent">
                WarrantyVault
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200/60">
                AI OCR Protected
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 font-medium">
              Digital Bill Vault &amp; Warranty Claim Tracker
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  id="notifications-bell-btn"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors focus:outline-hidden"
                  title="Warranty Expiration Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadReminders.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadReminders.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-600" />
                        <span className="font-semibold text-sm text-slate-800">
                          Warranty Reminders
                        </span>
                        {unreadReminders.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-xs bg-amber-100 text-amber-800 font-medium">
                            {unreadReminders.length} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadReminders.length > 0 && (
                          <button
                            onClick={onMarkAllRemindersRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                      {reminders.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                          No pending warranty expirations! All protected.
                        </div>
                      ) : (
                        reminders.map((rem) => {
                          const isUrgent = rem.reminderType === '7_DAYS' || rem.daysRemaining <= 7;
                          const isExpired = rem.reminderType === 'EXPIRED';

                          return (
                            <div
                              key={rem.id}
                              className={`p-3 rounded-xl transition-colors cursor-pointer my-1 ${
                                rem.isRead ? 'bg-white hover:bg-slate-50' : 'bg-violet-50/50 hover:bg-violet-50 border border-violet-100/70'
                              }`}
                              onClick={() => {
                                onMarkReminderRead(rem.id);
                                onSelectPurchase(rem.purchaseId);
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                {isExpired ? (
                                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                ) : isUrgent ? (
                                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 animate-bounce">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-semibold text-slate-900 truncate">
                                      {rem.brand} {rem.productName}
                                    </p>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      {rem.daysRemaining > 0 ? `${rem.daysRemaining}d left` : 'Expired'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                    {rem.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Purchase Button */}
              <button
                id="navbar-add-purchase-btn"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Upload Bill</span>
              </button>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  id="navbar-user-avatar-btn"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100/80 transition-colors focus:outline-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:block text-xs font-semibold text-slate-700">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      id="navbar-logout-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="navbar-demo-login-btn"
                onClick={demoLogin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Explore Demo Vault</span>
              </button>
              <button
                id="navbar-signin-btn"
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
