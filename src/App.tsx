import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  SlidersHorizontal, 
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
  Laptop,
  Tv,
  Car,
  Home as HomeIcon,
  Package,
  Layers,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { RemindersBanner } from './components/RemindersBanner';
import { PurchaseCard } from './components/PurchaseCard';
import { AddPurchaseModal } from './components/AddPurchaseModal';
import { PurchaseDetailModal } from './components/PurchaseDetailModal';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { DashboardStats, ProductCategory, Purchase, WarrantyReminder, WarrantyStatus } from './types';

function DashboardContent() {
  const { user, demoLogin, loading: authLoading } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reminders, setReminders] = useState<WarrantyReminder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPurchases: 0,
    activeWarranties: 0,
    expiringSoon: 0,
    expiringUrgent: 0,
    expiredWarranties: 0,
    totalSpent: 0
  });

  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Load data function
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [purchasesRes, statsRes, remindersRes] = await Promise.all([
        api.getPurchases({
          search: searchQuery.trim() || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          sortBy
        }),
        api.getStats(),
        api.getReminders()
      ]);

      setPurchases(purchasesRes);
      setStats(statsRes);
      setReminders(remindersRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoadingData(false);
    }
  }, [user, searchQuery, selectedCategory, statusFilter, sortBy]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Handle select purchase from reminder
  const handleSelectPurchaseById = async (purchaseId: string) => {
    try {
      const item = await api.getPurchase(purchaseId);
      setSelectedPurchase(item);
    } catch (err) {
      console.error('Failed to get purchase', err);
    }
  };

  const handleMarkReminderRead = async (id: string) => {
    try {
      await api.markReminderRead(id);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRemindersRead = async () => {
    try {
      await api.markAllRemindersRead();
      setReminders(prev => prev.map(r => ({ ...r, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const categories: { label: string; icon: React.ReactNode }[] = [
    { label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'Electronics', icon: <Tv className="w-3.5 h-3.5" /> },
    { label: 'Home Appliances', icon: <HomeIcon className="w-3.5 h-3.5" /> },
    { label: 'Computers', icon: <Laptop className="w-3.5 h-3.5" /> },
    { label: 'Vehicles', icon: <Car className="w-3.5 h-3.5" /> },
    { label: 'Other', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Unlocking WarrantyVault...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show premium pastel hero page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f8faff] via-[#f5f3ff] to-[#f0f9ff]">
        <Navbar
          onOpenAddModal={() => setIsAuthOpen(true)}
          onOpenAuthModal={() => setIsAuthOpen(true)}
          reminders={[]}
          onSelectPurchase={() => {}}
          onMarkReminderRead={() => {}}
          onMarkAllRemindersRead={() => {}}
        />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col items-center text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-violet-100/80 text-violet-800 border border-violet-200/80 shadow-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI/OCR Powered Digital Bill &amp; Warranty Vault</span>
          </div>

          {/* Hero title */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
            Never lose a bill or miss a{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              warranty claim
            </span>{' '}
            again.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
            Snap a photo or upload a PDF receipt. Our intelligent AI extracts the product, brand, invoice number, and expiry date, automatically alerting you 30 days and 7 days before warranties lapse.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
            <button
              id="hero-demo-account-btn"
              onClick={demoLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Demo Account (Instant)</span>
            </button>
            <button
              id="hero-signin-btn"
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-colors"
            >
              <span>Sign In / Create Account</span>
            </button>
          </div>

          {/* Features preview cards */}
          <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
            <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xs border border-violet-100/80 shadow-sm shadow-violet-500/5">
              <div className="w-12 h-12 rounded-2xl bg-violet-100/70 text-violet-700 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Upload Bill or Receipt</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Take a photo or upload a PDF receipt from Best Buy, Apple, Amazon, Target, or any store.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xs border border-sky-100/80 shadow-sm shadow-sky-500/5">
              <div className="w-12 h-12 rounded-2xl bg-sky-100/70 text-sky-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. AI/OCR Auto Extraction</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Gemini OCR automatically scans brand, model, price, purchase date, invoice number, and warranty period.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xs border border-emerald-100/80 shadow-sm shadow-emerald-500/5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Claim Helper &amp; Alerts</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Get notified 30 &amp; 7 days before coverage expires. Instant 1-click claim sheets ready for support.
              </p>
            </div>
          </div>
        </main>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  // Logged-in Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faff]">
      <Navbar
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        reminders={reminders}
        onSelectPurchase={handleSelectPurchaseById}
        onMarkReminderRead={handleMarkReminderRead}
        onMarkAllRemindersRead={handleMarkAllRemindersRead}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Welcome message & Add CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hello, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Your personal digital vault is protecting {stats.totalPurchases} purchases.
            </p>
          </div>

          <button
            id="dashboard-upload-bill-btn"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload New Bill</span>
          </button>
        </div>

        {/* Reminders Banner for items expiring soon (30d and 7d) */}
        <RemindersBanner
          reminders={reminders}
          onSelectPurchase={handleSelectPurchaseById}
        />

        {/* Pastel Stat Cards */}
        <StatsOverview
          stats={stats}
          currentStatusFilter={statusFilter}
          onFilterStatus={(st) => setStatusFilter(st)}
        />

        {/* Search, Categories, Filters Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          {/* Top row: Search input + Sort By */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="search-purchases-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, brand, model, invoice #, or store..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold hidden md:inline">Sort:</span>
              <select
                id="sort-purchases-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="date_desc">Purchase Date (Newest)</option>
                <option value="expiry_asc">Warranty Expiry (Soonest)</option>
                <option value="price_desc">Price (Highest First)</option>
              </select>
            </div>
          </div>

          {/* Categories Pill Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.label}
                id={`category-pill-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat.label)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.label
                    ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/20'
                    : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Active status filter banner indicator */}
          {statusFilter !== 'ALL' && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
              <span className="text-violet-900 font-medium">
                Filtering by status: <strong>{statusFilter}</strong>
              </span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className="font-bold text-violet-700 hover:text-violet-900 underline"
              >
                Reset filter
              </button>
            </div>
          )}

        </div>

        {/* Purchases Grid / List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <span>Purchases in Vault</span>
              <span className="text-xs font-medium text-slate-400">
                ({purchases.length})
              </span>
            </h2>

            {loadingData && (
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-violet-600" />
                Syncing...
              </span>
            )}
          </div>

          {purchases.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 opacity-70" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery || selectedCategory !== 'All' || statusFilter !== 'ALL'
                  ? 'No matching purchases found'
                  : 'Your warranty vault is empty'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5">
                {searchQuery || selectedCategory !== 'All' || statusFilter !== 'ALL'
                  ? 'Try adjusting your search terms or clearing category filters.'
                  : 'Upload your first purchase bill or receipt to track warranty expirations and store claim documents.'}
              </p>
              
              <div className="mt-5 flex justify-center gap-2">
                {searchQuery || selectedCategory !== 'All' || statusFilter !== 'ALL' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setStatusFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Purchase Bill</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {purchases.map((purchase) => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onSelect={(p) => setSelectedPurchase(p)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modals */}
      <AddPurchaseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={(newP) => {
          loadDashboardData();
          setSelectedPurchase(newP);
        }}
      />

      <PurchaseDetailModal
        purchase={selectedPurchase}
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onUpdate={(updated) => {
          setSelectedPurchase(updated);
          loadDashboardData();
        }}
        onDelete={() => {
          setSelectedPurchase(null);
          loadDashboardData();
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
