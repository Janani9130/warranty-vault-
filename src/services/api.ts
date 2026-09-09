import { 
  AuthResponse, 
  DashboardStats, 
  ExtractedBillData, 
  Purchase, 
  User, 
  WarrantyReminder 
} from '../types';

const TOKEN_KEY = 'warrantyvault_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async demoLogin(): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/demo-login', {
      method: 'POST',
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  logout() {
    removeStoredToken();
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/stats');
  },

  // Purchases
  async getPurchases(params?: { search?: string; category?: string; status?: string; sortBy?: string }): Promise<Purchase[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Purchase[]>(`/api/purchases${qs}`);
  },

  async getPurchase(id: string): Promise<Purchase> {
    return request<Purchase>(`/api/purchases/${id}`);
  },

  async createPurchase(data: {
    productName: string;
    brand?: string;
    model?: string;
    purchaseDate: string;
    price?: number;
    currency?: string;
    invoiceNumber?: string;
    store?: string;
    category?: string;
    warrantyPeriodMonths?: number;
    warrantyExpiryDate?: string;
    notes?: string;
    document?: {
      fileName: string;
      fileType: string;
      fileSize: number;
      fileDataUrl: string;
      ocrRawText?: string;
    };
  }): Promise<Purchase> {
    return request<Purchase>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    return request<Purchase>(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePurchase(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/purchases/${id}`, {
      method: 'DELETE',
    });
  },

  async removePurchaseDocument(id: string): Promise<{ success: boolean; purchase: Purchase }> {
    return request<{ success: boolean; purchase: Purchase }>(`/api/purchases/${id}/document`, {
      method: 'DELETE',
    });
  },

  // OCR + AI Scan
  async scanBill(fileDataUrl: string, fileName: string, fileType: string): Promise<{ success: boolean; data: ExtractedBillData }> {
    return request<{ success: boolean; data: ExtractedBillData }>('/api/scan-bill', {
      method: 'POST',
      body: JSON.stringify({ fileDataUrl, fileName, fileType }),
    });
  },

  // Reminders
  async getReminders(): Promise<WarrantyReminder[]> {
    return request<WarrantyReminder[]>('/api/reminders');
  },

  async markReminderRead(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/reminders/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllRemindersRead(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/reminders/read-all', {
      method: 'POST',
    });
  },
};
