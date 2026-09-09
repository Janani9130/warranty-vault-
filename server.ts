import express, { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, computeWarrantyMetrics } from './server/db.js';
import { authMiddleware, AuthRequest, generateToken } from './server/auth.js';
import { extractBillDetails } from './server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with ample capacity for image/PDF base64 payloads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ----------------- API ROUTES -----------------

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = db.createUser(name.trim(), email.trim(), passwordHash);
    const token = generateToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userWithHash = db.findUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, userWithHash.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userWithHash.id,
      name: userWithHash.name,
      email: userWithHash.email,
      createdAt: userWithHash.createdAt
    };
    const token = generateToken(user);

    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error.' });
  }
});

// Demo Account Quick Login
app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  try {
    const demoUser = db.findUserByEmail('demo@warrantyvault.app');
    if (!demoUser) {
      return res.status(404).json({ error: 'Demo account not initialized.' });
    }

    const user = {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      createdAt: demoUser.createdAt
    };
    const token = generateToken(user);

    return res.json({ token, user });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Failed to start demo session.' });
  }
});

// Current User profile
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// OCR + AI Scan Bill
app.post('/api/scan-bill', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fileDataUrl, fileName, fileType } = req.body;
    if (!fileDataUrl) {
      return res.status(400).json({ error: 'No bill image or document data provided.' });
    }

    const extracted = await extractBillDetails(fileDataUrl, fileType || 'image/jpeg', fileName);
    return res.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Bill scan error:', error);
    return res.status(500).json({ error: 'Failed to scan document. Please try again or enter details manually.' });
  }
});

// Dashboard Stats
app.get('/api/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const stats = db.getDashboardStats(req.user!.id);
    return res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to load statistics.' });
  }
});

// Purchases List & Search
app.get('/api/purchases', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { search, category, status, sortBy } = req.query;
    const purchases = db.getPurchases(req.user!.id, {
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      status: typeof status === 'string' ? status : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
    });
    return res.json(purchases);
  } catch (error) {
    console.error('Fetch purchases error:', error);
    return res.status(500).json({ error: 'Failed to retrieve purchases.' });
  }
});

// Get Single Purchase
app.get('/api/purchases/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const purchase = db.getPurchaseById(req.params.id, req.user!.id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }
    return res.json(purchase);
  } catch (error) {
    console.error('Get purchase error:', error);
    return res.status(500).json({ error: 'Failed to get purchase details.' });
  }
});

// Create Purchase & Save Bill Document
app.post('/api/purchases', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const {
      productName,
      brand,
      model,
      purchaseDate,
      price,
      currency,
      invoiceNumber,
      store,
      category,
      warrantyPeriodMonths,
      warrantyExpiryDate,
      notes,
      document
    } = req.body;

    if (!productName || !purchaseDate) {
      return res.status(400).json({ error: 'Product name and purchase date are required.' });
    }

    const months = Number(warrantyPeriodMonths) || 12;
    let computedExpiry = warrantyExpiryDate;
    if (!computedExpiry) {
      const d = new Date(purchaseDate);
      d.setMonth(d.getMonth() + months);
      computedExpiry = d.toISOString().split('T')[0];
    }

    const newPurchase = db.createPurchase(
      req.user!.id,
      {
        productName: productName.trim(),
        brand: (brand || '').trim(),
        model: (model || '').trim(),
        purchaseDate,
        price: Number(price) || 0,
        currency: currency || 'USD',
        invoiceNumber: (invoiceNumber || '').trim(),
        store: (store || '').trim(),
        category: category || 'Electronics',
        warrantyPeriodMonths: months,
        warrantyExpiryDate: computedExpiry,
        notes: (notes || '').trim()
      },
      document ? {
        fileName: document.fileName || 'invoice_bill.pdf',
        fileType: document.fileType || 'image/jpeg',
        fileSize: document.fileSize || 0,
        fileDataUrl: document.fileDataUrl,
        ocrRawText: document.ocrRawText
      } : undefined
    );

    return res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Create purchase error:', error);
    return res.status(500).json({ error: 'Failed to save purchase to vault.' });
  }
});

// Update Purchase
app.put('/api/purchases/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      productName,
      brand,
      model,
      purchaseDate,
      price,
      currency,
      invoiceNumber,
      store,
      category,
      warrantyPeriodMonths,
      warrantyExpiryDate,
      notes
    } = req.body;

    let computedExpiry = warrantyExpiryDate;
    if (!computedExpiry && purchaseDate && warrantyPeriodMonths) {
      const d = new Date(purchaseDate);
      d.setMonth(d.getMonth() + Number(warrantyPeriodMonths));
      computedExpiry = d.toISOString().split('T')[0];
    }

    const updated = db.updatePurchase(id, req.user!.id, {
      ...(productName && { productName: productName.trim() }),
      ...(brand !== undefined && { brand: brand.trim() }),
      ...(model !== undefined && { model: model.trim() }),
      ...(purchaseDate && { purchaseDate }),
      ...(price !== undefined && { price: Number(price) }),
      ...(currency && { currency }),
      ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber.trim() }),
      ...(store !== undefined && { store: store.trim() }),
      ...(category && { category }),
      ...(warrantyPeriodMonths !== undefined && { warrantyPeriodMonths: Number(warrantyPeriodMonths) }),
      ...(computedExpiry && { warrantyExpiryDate: computedExpiry }),
      ...(notes !== undefined && { notes: notes.trim() })
    });

    if (!updated) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Update purchase error:', error);
    return res.status(500).json({ error: 'Failed to update purchase.' });
  }
});

// Delete Purchase
app.delete('/api/purchases/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deletePurchase(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }
    return res.json({ success: true, message: 'Purchase and document deleted from vault.' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    return res.status(500).json({ error: 'Failed to delete purchase.' });
  }
});

// Delete Document from Purchase only
app.delete('/api/purchases/:id/document', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const updatedPurchase = db.removeDocumentFromPurchase(req.params.id, req.user!.id);
    if (!updatedPurchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }
    return res.json({ success: true, purchase: updatedPurchase, message: 'Bill document removed from purchase.' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// Download / View Document
app.get('/api/documents/:id/download', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // If data URL, convert to buffer or stream
    if (doc.fileDataUrl.startsWith('data:')) {
      const parts = doc.fileDataUrl.split(',');
      const meta = parts[0];
      const data = parts[1];
      const mime = meta.split(';')[0].replace('data:', '');
      const buffer = Buffer.from(data, 'base64');

      res.setHeader('Content-Type', mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
      return res.send(buffer);
    }

    return res.redirect(doc.fileDataUrl);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to stream document.' });
  }
});

// Reminders & Notifications
app.get('/api/reminders', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const reminders = db.getReminders(req.user!.id);
    return res.json(reminders);
  } catch (error) {
    console.error('Reminders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve warranty reminders.' });
  }
});

app.put('/api/reminders/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const success = db.markReminderRead(req.params.id, req.user!.id);
    return res.json({ success });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update reminder.' });
  }
});

app.post('/api/reminders/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.markAllRemindersRead(req.user!.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear reminders.' });
  }
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WarrantyVault server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
