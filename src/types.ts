export type WarrantyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export type ProductCategory = 
  | 'Electronics'
  | 'Home Appliances'
  | 'Computers'
  | 'Vehicles'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface PurchaseDocument {
  id: string;
  purchaseId?: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileDataUrl: string; // Base64 or URL
  ocrRawText?: string;
  uploadedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  productName: string;
  brand: string;
  model: string;
  purchaseDate: string; // YYYY-MM-DD
  price: number;
  currency: string;
  invoiceNumber: string;
  store: string;
  category: ProductCategory;
  warrantyPeriodMonths: number;
  warrantyExpiryDate: string; // YYYY-MM-DD
  notes?: string;
  status: WarrantyStatus;
  daysRemaining: number;
  document?: PurchaseDocument;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyReminder {
  id: string;
  purchaseId: string;
  userId: string;
  productName: string;
  brand: string;
  reminderType: '30_DAYS' | '7_DAYS' | 'EXPIRED';
  title: string;
  message: string;
  expiryDate: string;
  daysRemaining: number;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPurchases: number;
  activeWarranties: number;
  expiringSoon: number; // <= 30 days
  expiringUrgent: number; // <= 7 days
  expiredWarranties: number;
  totalSpent: number;
}

export interface ExtractedBillData {
  productName: string;
  brand: string;
  model: string;
  purchaseDate: string;
  price: number;
  currency: string;
  invoiceNumber: string;
  store: string;
  category: ProductCategory;
  warrantyPeriodMonths: number;
  warrantyExpiryDate: string;
  ocrConfidence: string;
  rawNotes?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
