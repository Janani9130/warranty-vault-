import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Purchase, PurchaseDocument, User, WarrantyReminder, DashboardStats, ProductCategory, WarrantyStatus } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'warranty_vault.json');

interface Schema {
  users: (User & { passwordHash: string })[];
  purchases: Omit<Purchase, 'status' | 'daysRemaining' | 'document'>[];
  documents: PurchaseDocument[];
  reminders: WarrantyReminder[];
}

// Utility to calculate days remaining and warranty status
export function computeWarrantyMetrics(expiryDateStr: string): { status: WarrantyStatus; daysRemaining: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: WarrantyStatus = 'ACTIVE';
  if (daysRemaining < 0) {
    status = 'EXPIRED';
  } else if (daysRemaining <= 30) {
    status = 'EXPIRING_SOON';
  } else {
    status = 'ACTIVE';
  }

  return { status, daysRemaining };
}

// Helper to format sample date offsets
function getOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// SVG-based invoice data URL generator for realistic visual documents
function generateSampleReceiptSvg(item: { store: string; invoiceNo: string; product: string; price: string; date: string }): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fcfdff" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <rect width="600" height="750" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="16"/>
    <rect x="0" y="0" width="600" height="110" fill="#f5f3ff"/>
    <circle cx="50" cy="55" r="28" fill="#8b5cf6" fill-opacity="0.2"/>
    <text x="50" y="62" font-size="22" font-weight="bold" fill="#7c3aed" text-anchor="middle">WV</text>
    
    <text x="95" y="50" font-size="22" font-weight="bold" fill="#1e1b4b">${item.store}</text>
    <text x="95" y="72" font-size="13" fill="#6b7280">Official Purchase Invoice &amp; Warranty Certificate</text>
    
    <rect x="420" y="35" width="145" height="34" rx="8" fill="#ede9fe"/>
    <text x="492" y="57" font-size="12" font-weight="600" fill="#6d28d9" text-anchor="middle">VERIFIED BILL</text>

    <!-- Invoice info grid -->
    <g transform="translate(45, 140)">
      <text x="0" y="0" font-size="12" fill="#9ca3af" font-weight="600">INVOICE NUMBER</text>
      <text x="0" y="24" font-size="16" fill="#111827" font-weight="bold">${item.invoiceNo}</text>

      <text x="320" y="0" font-size="12" fill="#9ca3af" font-weight="600">PURCHASE DATE</text>
      <text x="320" y="24" font-size="16" fill="#111827" font-weight="bold">${item.date}</text>
    </g>

    <!-- Divider -->
    <line x1="45" y1="200" x2="555" y2="200" stroke="#f1f5f9" stroke-width="2"/>

    <!-- Table Header -->
    <g transform="translate(45, 230)">
      <rect width="510" height="36" rx="6" fill="#f8fafc"/>
      <text x="15" y="23" font-size="12" font-weight="bold" fill="#475569">ITEM DESCRIPTION</text>
      <text x="350" y="23" font-size="12" font-weight="bold" fill="#475569">QTY</text>
      <text x="440" y="23" font-size="12" font-weight="bold" fill="#475569">AMOUNT</text>
    </g>

    <!-- Item Row -->
    <g transform="translate(45, 290)">
      <text x="15" y="0" font-size="15" font-weight="600" fill="#1e293b">${item.product}</text>
      <text x="15" y="22" font-size="12" fill="#64748b">Manufacturer Standard Warranty Included</text>
      <text x="360" y="10" font-size="14" fill="#334155">1</text>
      <text x="440" y="10" font-size="15" font-weight="bold" fill="#0f172a">${item.price}</text>
    </g>

    <!-- Calculations -->
    <line x1="45" y1="360" x2="555" y2="360" stroke="#f1f5f9" stroke-width="1.5"/>

    <g transform="translate(300, 390)">
      <text x="0" y="0" font-size="13" fill="#64748b">Subtotal:</text>
      <text x="210" y="0" font-size="13" fill="#334155" text-anchor="end">${item.price}</text>

      <text x="0" y="25" font-size="13" fill="#64748b">Tax / VAT (incl):</text>
      <text x="210" y="25" font-size="13" fill="#334155" text-anchor="end">$0.00</text>

      <line x1="0" y1="40" x2="210" y2="40" stroke="#e2e8f0" stroke-width="1"/>

      <text x="0" y="65" font-size="16" font-weight="bold" fill="#0f172a">Total Paid:</text>
      <text x="210" y="65" font-size="18" font-weight="bold" fill="#7c3aed" text-anchor="end">${item.price}</text>
    </g>

    <!-- Warranty Stamp -->
    <g transform="translate(45, 500)">
      <rect width="510" height="110" rx="12" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
      <circle cx="45" cy="55" r="22" fill="#22c55e" fill-opacity="0.15"/>
      <text x="45" y="61" font-size="18" fill="#15803d" text-anchor="middle">✓</text>
      <text x="85" y="45" font-size="14" font-weight="bold" fill="#166534">Authorized Warranty Coverage Registered</text>
      <text x="85" y="68" font-size="12" fill="#15803d">Retain this invoice and document in WarrantyVault for claim eligibility.</text>
      <text x="85" y="88" font-size="11" fill="#4ade80">Authorized Signature &amp; Cashier Stamp #8849-WV</text>
    </g>

    <!-- Footer -->
    <text x="300" y="705" font-size="11" fill="#94a3b8" text-anchor="middle">WarrantyVault Digital Archive • Generated for claim retrieval</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

class Database {
  private data: Schema = {
    users: [],
    purchases: [],
    documents: [],
    reminders: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedDemoData();
        this.persist();
      }
    } catch (err) {
      console.error('Failed to load database, initializing empty', err);
      this.seedDemoData();
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  private seedDemoData() {
    const demoUserId = 'usr_demo_warranty_user';
    const demoPasswordHash = bcrypt.hashSync('demo123', 10);

    const demoUser: User & { passwordHash: string } = {
      id: demoUserId,
      name: 'Sarah Jenkins',
      email: 'demo@warrantyvault.app',
      passwordHash: demoPasswordHash,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
    };

    const initialDocs: PurchaseDocument[] = [
      {
        id: 'doc_1',
        purchaseId: 'pur_1',
        userId: demoUserId,
        fileName: 'Sony_Bravia_BestBuy_Receipt.pdf',
        fileType: 'image/svg+xml',
        fileSize: 42100,
        fileDataUrl: generateSampleReceiptSvg({
          store: 'Best Buy Electronics',
          invoiceNo: 'BB-892144-NY',
          product: 'Sony Bravia 55" XR-55A80L OLED TV',
          price: '$1,399.99',
          date: getOffsetDate(-180)
        }),
        ocrRawText: 'BEST BUY Store #421. Sony Bravia 55 OLED TV XR-55A80L. Total: $1,399.99. 24 Months Manufacturer Warranty.',
        uploadedAt: new Date(Date.now() - 180 * 86400000).toISOString()
      },
      {
        id: 'doc_2',
        purchaseId: 'pur_2',
        userId: demoUserId,
        fileName: 'Apple_MacBook_Pro_Invoice.pdf',
        fileType: 'image/svg+xml',
        fileSize: 39500,
        fileDataUrl: generateSampleReceiptSvg({
          store: 'Apple Store Fifth Avenue',
          invoiceNo: 'APL-9021882',
          product: 'Apple MacBook Pro 14" M3 Pro 18GB/512GB',
          price: '$1,999.00',
          date: getOffsetDate(-348) // 17 days before 1 year expiry
        }),
        ocrRawText: 'Apple Store. Item: MacBook Pro 14 M3 Pro. Serial: W99H88X72. Limited 1 Year Hardware Warranty.',
        uploadedAt: new Date(Date.now() - 348 * 86400000).toISOString()
      },
      {
        id: 'doc_3',
        purchaseId: 'pur_3',
        userId: demoUserId,
        fileName: 'Dyson_V15_Detect_Invoice.pdf',
        fileType: 'image/svg+xml',
        fileSize: 38200,
        fileDataUrl: generateSampleReceiptSvg({
          store: 'Dyson Official Direct',
          invoiceNo: 'DYS-772910',
          product: 'Dyson V15 Detect Cordless Vacuum Cleaner',
          price: '$749.99',
          date: getOffsetDate(-725) // 5 days remaining on 2 year warranty
        }),
        ocrRawText: 'Dyson Direct Order #DYS-772910. Dyson V15 Detect Absolute. 2 Year Comprehensive Warranty.',
        uploadedAt: new Date(Date.now() - 725 * 86400000).toISOString()
      },
      {
        id: 'doc_4',
        purchaseId: 'pur_4',
        userId: demoUserId,
        fileName: 'Philips_Sonicare_Target_Receipt.pdf',
        fileType: 'image/svg+xml',
        fileSize: 35600,
        fileDataUrl: generateSampleReceiptSvg({
          store: 'Target Supercenter',
          invoiceNo: 'TGT-448102',
          product: 'Philips Sonicare DiamondClean 9000',
          price: '$199.95',
          date: getOffsetDate(-780) // expired 50 days ago
        }),
        ocrRawText: 'TARGET Store #1029. Philips Sonicare DiamondClean 9000. Total $199.95. 24 Month Limited Warranty.',
        uploadedAt: new Date(Date.now() - 780 * 86400000).toISOString()
      },
      {
        id: 'doc_5',
        purchaseId: 'pur_5',
        userId: demoUserId,
        fileName: 'LG_Washer_HomeDepot.pdf',
        fileType: 'image/svg+xml',
        fileSize: 41200,
        fileDataUrl: generateSampleReceiptSvg({
          store: 'The Home Depot',
          invoiceNo: 'HD-6629910',
          product: 'LG WM4000HWA 4.5 Cu. Ft. Smart Front Load Washer',
          price: '$899.00',
          date: getOffsetDate(-120) // Active, 16 months left on 2 year warranty
        }),
        ocrRawText: 'The Home Depot. LG Smart Front Load Washer WM4000HWA. Total $899.00. 24 Months Warranty.',
        uploadedAt: new Date(Date.now() - 120 * 86400000).toISOString()
      }
    ];

    const initialPurchases: Omit<Purchase, 'status' | 'daysRemaining' | 'document'>[] = [
      {
        id: 'pur_1',
        userId: demoUserId,
        productName: 'Bravia 55" XR-55A80L 4K OLED TV',
        brand: 'Sony',
        model: 'XR-55A80L',
        purchaseDate: getOffsetDate(-180),
        price: 1399.99,
        currency: 'USD',
        invoiceNumber: 'BB-892144-NY',
        store: 'Best Buy Electronics',
        category: 'Electronics',
        warrantyPeriodMonths: 24,
        warrantyExpiryDate: getOffsetDate(-180 + (24 * 30.5)),
        notes: 'Extended manufacturer panel coverage registered online.',
        documentId: 'doc_1',
        createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 86400000).toISOString()
      },
      {
        id: 'pur_2',
        userId: demoUserId,
        productName: 'MacBook Pro 14" M3 Pro (18GB/512GB)',
        brand: 'Apple',
        model: 'MRX33LL/A',
        purchaseDate: getOffsetDate(-348),
        price: 1999.00,
        currency: 'USD',
        invoiceNumber: 'APL-9021882',
        store: 'Apple Store Fifth Avenue',
        category: 'Computers',
        warrantyPeriodMonths: 12,
        warrantyExpiryDate: getOffsetDate(17), // 17 days left!
        notes: 'Serial #W99H88X72. Hardware warranty expires soon. Check keyboard & battery health before expiry.',
        documentId: 'doc_2',
        createdAt: new Date(Date.now() - 348 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 348 * 86400000).toISOString()
      },
      {
        id: 'pur_3',
        userId: demoUserId,
        productName: 'V15 Detect Cordless Vacuum Cleaner',
        brand: 'Dyson',
        model: 'V15 Absolute',
        purchaseDate: getOffsetDate(-725),
        price: 749.99,
        currency: 'USD',
        invoiceNumber: 'DYS-772910',
        store: 'Dyson Official Direct',
        category: 'Home Appliances',
        warrantyPeriodMonths: 24,
        warrantyExpiryDate: getOffsetDate(5), // 5 days left! Urgent reminder
        notes: 'Battery replaced under warranty once in year 1.',
        documentId: 'doc_3',
        createdAt: new Date(Date.now() - 725 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 725 * 86400000).toISOString()
      },
      {
        id: 'pur_4',
        userId: demoUserId,
        productName: 'Sonicare DiamondClean 9000 Smart Toothbrush',
        brand: 'Philips',
        model: 'HX9911/05',
        purchaseDate: getOffsetDate(-780),
        price: 199.95,
        currency: 'USD',
        invoiceNumber: 'TGT-448102',
        store: 'Target Supercenter',
        category: 'Other',
        warrantyPeriodMonths: 24,
        warrantyExpiryDate: getOffsetDate(-50), // expired 50 days ago
        notes: 'Standard 24-month warranty ended.',
        documentId: 'doc_4',
        createdAt: new Date(Date.now() - 780 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 780 * 86400000).toISOString()
      },
      {
        id: 'pur_5',
        userId: demoUserId,
        productName: 'Smart Front Load Washer 4.5 Cu. Ft.',
        brand: 'LG',
        model: 'WM4000HWA',
        purchaseDate: getOffsetDate(-120),
        price: 899.00,
        currency: 'USD',
        invoiceNumber: 'HD-6629910',
        store: 'The Home Depot',
        category: 'Home Appliances',
        warrantyPeriodMonths: 24,
        warrantyExpiryDate: getOffsetDate(-120 + (24 * 30.5)),
        notes: 'Direct drive motor has separate 10-year parts warranty.',
        documentId: 'doc_5',
        createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 120 * 86400000).toISOString()
      }
    ];

    const initialReminders: WarrantyReminder[] = [
      {
        id: 'rem_1',
        purchaseId: 'pur_3',
        userId: demoUserId,
        productName: 'V15 Detect Cordless Vacuum Cleaner',
        brand: 'Dyson',
        reminderType: '7_DAYS',
        title: 'Warranty Expiring in 5 Days!',
        message: 'Your Dyson V15 Detect warranty ends on ' + getOffsetDate(5) + '. If you have any suction or battery issues, claim your service now.',
        expiryDate: getOffsetDate(5),
        daysRemaining: 5,
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rem_2',
        purchaseId: 'pur_2',
        userId: demoUserId,
        productName: 'MacBook Pro 14" M3 Pro',
        brand: 'Apple',
        reminderType: '30_DAYS',
        title: 'Warranty Expiring in 17 Days',
        message: 'Your Apple MacBook Pro 14" warranty ends on ' + getOffsetDate(17) + '. Schedule Apple Genius Bar diagnostics before coverage lapses.',
        expiryDate: getOffsetDate(17),
        daysRemaining: 17,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ];

    this.data.users = [demoUser];
    this.data.purchases = initialPurchases;
    this.data.documents = initialDocs;
    this.data.reminders = initialReminders;
  }

  // --- Users ---
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  public createUser(name: string, email: string, passwordHash: string): User {
    const newUser: User & { passwordHash: string } = {
      id: 'usr_' + crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
  }

  // --- Purchases & Documents ---
  public getPurchases(userId: string, query?: { search?: string; category?: string; status?: string; sortBy?: string }): Purchase[] {
    let list = this.data.purchases.filter(p => p.userId === userId);

    if (query?.category && query.category !== 'All') {
      list = list.filter(p => p.category === query.category);
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p => 
        p.productName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.store.toLowerCase().includes(q)
      );
    }

    // Hydrate computed metrics and attached documents
    const hydrated: Purchase[] = list.map(item => {
      const { status, daysRemaining } = computeWarrantyMetrics(item.warrantyExpiryDate);
      const doc = this.data.documents.find(d => d.id === item.documentId || d.purchaseId === item.id);
      return {
        ...item,
        status,
        daysRemaining,
        document: doc
      };
    });

    if (query?.status && query.status !== 'ALL') {
      return hydrated.filter(p => p.status === query.status);
    }

    // Sorting
    if (query?.sortBy === 'expiry_asc') {
      hydrated.sort((a, b) => new Date(a.warrantyExpiryDate).getTime() - new Date(b.warrantyExpiryDate).getTime());
    } else if (query?.sortBy === 'price_desc') {
      hydrated.sort((a, b) => b.price - a.price);
    } else {
      // Default: purchase date newest first
      hydrated.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    }

    return hydrated;
  }

  public getPurchaseById(id: string, userId: string): Purchase | null {
    const raw = this.data.purchases.find(p => p.id === id && p.userId === userId);
    if (!raw) return null;

    const { status, daysRemaining } = computeWarrantyMetrics(raw.warrantyExpiryDate);
    const doc = this.data.documents.find(d => d.id === raw.documentId || d.purchaseId === raw.id);
    return {
      ...raw,
      status,
      daysRemaining,
      document: doc
    };
  }

  public createPurchase(
    userId: string,
    purchaseData: Omit<Purchase, 'id' | 'userId' | 'status' | 'daysRemaining' | 'document' | 'createdAt' | 'updatedAt'>,
    docData?: { fileName: string; fileType: string; fileSize: number; fileDataUrl: string; ocrRawText?: string }
  ): Purchase {
    const purchaseId = 'pur_' + crypto.randomUUID();
    let documentId: string | undefined = undefined;

    if (docData) {
      documentId = 'doc_' + crypto.randomUUID();
      const newDoc: PurchaseDocument = {
        id: documentId,
        purchaseId,
        userId,
        fileName: docData.fileName,
        fileType: docData.fileType,
        fileSize: docData.fileSize,
        fileDataUrl: docData.fileDataUrl,
        ocrRawText: docData.ocrRawText,
        uploadedAt: new Date().toISOString()
      };
      this.data.documents.push(newDoc);
    }

    const now = new Date().toISOString();
    const newPurchase: Omit<Purchase, 'status' | 'daysRemaining' | 'document'> = {
      id: purchaseId,
      userId,
      ...purchaseData,
      documentId,
      createdAt: now,
      updatedAt: now
    };

    this.data.purchases.push(newPurchase);

    // Auto-generate reminders if warranty is within range
    this.refreshRemindersForPurchase(newPurchase);

    this.persist();

    return this.getPurchaseById(purchaseId, userId)!;
  }

  public updatePurchase(
    id: string,
    userId: string,
    updates: Partial<Omit<Purchase, 'id' | 'userId' | 'document' | 'createdAt' | 'updatedAt'>>
  ): Purchase | null {
    const index = this.data.purchases.findIndex(p => p.id === id && p.userId === userId);
    if (index === -1) return null;

    const existing = this.data.purchases[index];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.data.purchases[index] = updated;
    this.refreshRemindersForPurchase(updated);
    this.persist();

    return this.getPurchaseById(id, userId);
  }

  public deletePurchase(id: string, userId: string): boolean {
    const purchase = this.data.purchases.find(p => p.id === id && p.userId === userId);
    if (!purchase) {
      return false;
    }

    const docId = purchase.documentId;
    this.data.purchases = this.data.purchases.filter(p => !(p.id === id && p.userId === userId));

    // Delete associated documents and reminders
    this.data.documents = this.data.documents.filter(d => 
      !( (d.purchaseId === id || (docId && d.id === docId)) && d.userId === userId )
    );
    this.data.reminders = this.data.reminders.filter(r => !(r.purchaseId === id && r.userId === userId));

    this.persist();
    return true;
  }

  public removeDocumentFromPurchase(purchaseId: string, userId: string): Purchase | null {
    const purchase = this.data.purchases.find(p => p.id === purchaseId && p.userId === userId);
    if (!purchase) return null;

    const docId = purchase.documentId;
    this.data.documents = this.data.documents.filter(d => 
      !( (d.purchaseId === purchaseId || (docId && d.id === docId)) && d.userId === userId )
    );
    purchase.documentId = undefined;
    purchase.updatedAt = new Date().toISOString();
    this.persist();

    return this.getPurchaseById(purchaseId, userId);
  }

  public getDocumentById(id: string, userId: string): PurchaseDocument | null {
    return this.data.documents.find(d => d.id === id && d.userId === userId) || null;
  }

  // --- Reminders & Notifications ---
  private refreshRemindersForPurchase(purchase: Omit<Purchase, 'status' | 'daysRemaining' | 'document'>) {
    // Clear old reminders for this purchase
    this.data.reminders = this.data.reminders.filter(r => r.purchaseId !== purchase.id);

    const { status, daysRemaining } = computeWarrantyMetrics(purchase.warrantyExpiryDate);

    if (status === 'EXPIRING_SOON') {
      const isUrgent = daysRemaining <= 7;
      this.data.reminders.push({
        id: 'rem_' + crypto.randomUUID(),
        purchaseId: purchase.id,
        userId: purchase.userId,
        productName: purchase.productName,
        brand: purchase.brand,
        reminderType: isUrgent ? '7_DAYS' : '30_DAYS',
        title: isUrgent ? `Warranty Expiring in ${Math.max(0, daysRemaining)} Day${daysRemaining === 1 ? '' : 's'}!` : `Warranty Expiring in ${daysRemaining} Days`,
        message: `Warranty for ${purchase.brand} ${purchase.productName} expires on ${purchase.warrantyExpiryDate}. File claims or inspection soon!`,
        expiryDate: purchase.warrantyExpiryDate,
        daysRemaining,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } else if (status === 'EXPIRED') {
      const daysAgo = Math.abs(daysRemaining);
      if (daysAgo <= 14) {
        this.data.reminders.push({
          id: 'rem_' + crypto.randomUUID(),
          purchaseId: purchase.id,
          userId: purchase.userId,
          productName: purchase.productName,
          brand: purchase.brand,
          reminderType: 'EXPIRED',
          title: 'Warranty Expired Recently',
          message: `The warranty for ${purchase.productName} ended on ${purchase.warrantyExpiryDate}.`,
          expiryDate: purchase.warrantyExpiryDate,
          daysRemaining,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  public getReminders(userId: string): WarrantyReminder[] {
    // Dynamic recalculation of days remaining
    return this.data.reminders
      .filter(r => r.userId === userId)
      .map(r => {
        const { daysRemaining } = computeWarrantyMetrics(r.expiryDate);
        return {
          ...r,
          daysRemaining
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  public markReminderRead(id: string, userId: string): boolean {
    const rem = this.data.reminders.find(r => r.id === id && r.userId === userId);
    if (!rem) return false;
    rem.isRead = true;
    this.persist();
    return true;
  }

  public markAllRemindersRead(userId: string): void {
    this.data.reminders.forEach(r => {
      if (r.userId === userId) {
        r.isRead = true;
      }
    });
    this.persist();
  }

  // --- Dashboard Stats ---
  public getDashboardStats(userId: string): DashboardStats {
    const userPurchases = this.data.purchases.filter(p => p.userId === userId);

    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiringUrgentCount = 0;
    let expiredCount = 0;
    let totalSpent = 0;

    userPurchases.forEach(p => {
      totalSpent += p.price || 0;
      const { status, daysRemaining } = computeWarrantyMetrics(p.warrantyExpiryDate);
      if (status === 'ACTIVE') {
        activeCount++;
      } else if (status === 'EXPIRING_SOON') {
        expiringSoonCount++;
        if (daysRemaining <= 7) {
          expiringUrgentCount++;
        }
      } else if (status === 'EXPIRED') {
        expiredCount++;
      }
    });

    return {
      totalPurchases: userPurchases.length,
      activeWarranties: activeCount,
      expiringSoon: expiringSoonCount,
      expiringUrgent: expiringUrgentCount,
      expiredWarranties: expiredCount,
      totalSpent: Math.round(totalSpent * 100) / 100
    };
  }
}

export const db = new Database();
