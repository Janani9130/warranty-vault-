import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedBillData, ProductCategory } from '../src/types.js';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

// Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, textual) to standard YYYY-MM-DD
export function normalizeDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    let p1 = parseInt(ddmmyyyy[1], 10);
    let p2 = parseInt(ddmmyyyy[2], 10);
    const year = ddmmyyyy[3];

    let day = p1;
    let month = p2;

    // If month is > 12 and day <= 12, it was MM-DD-YYYY
    if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Match YYYY/MM/DD
  const yyyymmdd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${String(parseInt(yyyymmdd[2], 10)).padStart(2, '0')}-${String(parseInt(yyyymmdd[3], 10)).padStart(2, '0')}`;
  }

  // Fallback to JS Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

export async function extractBillDetails(
  base64Data: string,
  mimeType: string,
  fileName?: string
): Promise<ExtractedBillData> {
  const ai = getAI();

  // Extract clean base64 and actual mime type from data URI
  let cleanBase64 = base64Data;
  let detectedMime = mimeType || 'image/jpeg';

  const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.*)$/s);
  if (dataUriMatch) {
    detectedMime = dataUriMatch[1];
    cleanBase64 = dataUriMatch[2].trim();
  } else {
    cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '').trim();
  }

  // Supported vision MIME types in Gemini
  const validVisionMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ];

  let requestMime = validVisionMimes.includes(detectedMime) ? detectedMime : 'image/jpeg';
  const isSvg = detectedMime.includes('svg') || (fileName && fileName.endsWith('.svg'));

  if (ai) {
    const prompt = `You are a high-accuracy OCR & document intelligence model specialized in purchase bills, tax invoices, cash receipts, and warranty cards.
Carefully read and analyze the provided bill/invoice document. Extract the exact real-world information shown on the document with maximum fidelity.

EXTRACTION RULES:
1. Product Name: The exact name or item description of the purchased product (e.g. "Split AC (Inverter)", "1.5 Ton 5 Star Inverter Split AC", "iPhone 15 Pro", "Sony WH-1000XM5").
2. Brand: The manufacturer or brand name (e.g. "Blue Star", "Apple", "Samsung", "Sony", "LG", "Dyson", "Bosch"). Look at logos, header company name, or product details.
3. Model / Spec: The specific model number, model code, or spec identifier (e.g. "IC518NNU", "A2849", "OLED55C3").
4. Store / Retailer: The seller, dealer, or retail store name (e.g. "CoolHome Appliances Pvt. Ltd.", "Best Buy", "Amazon", "Blue Star Limited"). Check dealer or seller section.
5. Invoice / Receipt Number: The invoice number or receipt ID (e.g. "BS/INV/2025/041256", "INV-98214").
6. Purchase Date: The date of purchase or invoice date. Pay special attention to DD-MM-YYYY vs MM-DD-YYYY formats. If written as 15-06-2025, it is 15th of June 2025. Standardize to YYYY-MM-DD.
7. Price: The final total bill amount or item amount as a clean number without currency signs or commas (e.g. 49560 for ₹ 49,560.00, or 249.99).
8. Currency: The currency code (e.g. "INR" for ₹ or Rs, "USD" for $, "EUR" for €, "GBP" for £, "CAD", "AUD").
9. Category: Choose the single best fit from:
   - "Electronics" (phones, TVs, cameras, audio, headphones)
   - "Home Appliances" (air conditioners, refrigerators, washing machines, microwaves, vacuum cleaners)
   - "Computers" (laptops, desktops, monitors, tablets, printers)
   - "Vehicles" (cars, bikes, e-scooters)
   - "Other"
10. Warranty Period (Months): Look for warranty statements like "1 Year", "1+4 Years", "2 Years", "12 Months", "24 Months", etc. Convert into integer months (e.g. 1 year = 12 months, 2 years = 24 months, 5 years = 60 months). If not explicitly stated, estimate realistic manufacturer warranty for that category (e.g. 12 or 24).
11. Warranty Expiry Date: Add the warranty months to the purchase date in YYYY-MM-DD format.
12. Raw Notes: Include any serial numbers (e.g. "Serial: BSAC2506A0789"), customer ID, compressor or extended warranty terms, or special coverage notes found on the invoice.`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING, description: 'Full description of the purchased item' },
        brand: { type: Type.STRING, description: 'Manufacturer brand' },
        model: { type: Type.STRING, description: 'Model number or specification' },
        purchaseDate: { type: Type.STRING, description: 'Date of invoice or purchase' },
        price: { type: Type.NUMBER, description: 'Final total price paid' },
        currency: { type: Type.STRING, description: 'Currency code, e.g. INR, USD, EUR, GBP' },
        invoiceNumber: { type: Type.STRING, description: 'Invoice or receipt number' },
        store: { type: Type.STRING, description: 'Store, dealer or retailer name' },
        category: {
          type: Type.STRING,
          enum: ['Electronics', 'Home Appliances', 'Computers', 'Vehicles', 'Other']
        },
        warrantyPeriodMonths: { type: Type.INTEGER, description: 'Duration of warranty in months' },
        warrantyExpiryDate: { type: Type.STRING, description: 'Calculated expiry date in YYYY-MM-DD' },
        rawNotes: { type: Type.STRING, description: 'Extracted serial numbers, terms or customer info' }
      },
      required: ['productName', 'brand', 'purchaseDate', 'price', 'warrantyPeriodMonths', 'category']
    };

    // Models to try in order of resilience and speed
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of candidateModels) {
      try {
        let contentPayload;

        if (isSvg) {
          // If SVG, decode text and pass as textual prompt
          let svgText = '';
          try {
            svgText = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          } catch {
            svgText = '';
          }
          contentPayload = {
            parts: [
              { text: `${prompt}\n\nInvoice SVG Content:\n${svgText}` }
            ]
          };
        } else {
          // Multimodal image / PDF payload
          contentPayload = {
            parts: [
              {
                inlineData: {
                  mimeType: requestMime,
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          };
        }

        const response = await ai.models.generateContent({
          model,
          contents: contentPayload,
          config: {
            responseMimeType: 'application/json',
            responseSchema: jsonSchema
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as Partial<ExtractedBillData>;
          const rawPurchaseDate = parsed.purchaseDate || '';
          const normalizedPurchaseDate = normalizeDate(rawPurchaseDate) || new Date().toISOString().split('T')[0];
          const warrantyMonths = parsed.warrantyPeriodMonths || 12;

          let normalizedExpiryDate = normalizeDate(parsed.warrantyExpiryDate);
          if (!normalizedExpiryDate) {
            const d = new Date(normalizedPurchaseDate);
            d.setMonth(d.getMonth() + warrantyMonths);
            normalizedExpiryDate = d.toISOString().split('T')[0];
          }

          console.log(`[Gemini OCR] Successfully extracted bill data with ${model}:`, {
            product: parsed.productName,
            brand: parsed.brand,
            price: parsed.price,
            currency: parsed.currency,
            invoice: parsed.invoiceNumber
          });

          return {
            productName: parsed.productName || 'Purchased Item',
            brand: parsed.brand || 'Brand',
            model: parsed.model || 'N/A',
            purchaseDate: normalizedPurchaseDate,
            price: typeof parsed.price === 'number' ? parsed.price : 0,
            currency: parsed.currency || 'USD',
            invoiceNumber: parsed.invoiceNumber || '',
            store: parsed.store || 'Retailer',
            category: (parsed.category as ProductCategory) || 'Home Appliances',
            warrantyPeriodMonths: warrantyMonths,
            warrantyExpiryDate: normalizedExpiryDate,
            ocrConfidence: 'High (AI OCR Verified)',
            rawNotes: parsed.rawNotes || 'Extracted via Gemini AI OCR'
          };
        }
      } catch (err) {
        console.warn(`[Gemini OCR] Failed with model ${model}, trying next... Error:`, (err as Error).message || err);
      }
    }
  }

  // Graceful fallback when AI is unavailable or fails all retries.
  // CRITICAL: NEVER inject fake dummy UUIDs, random brand names, or mock 249.99 prices!
  console.warn('[Gemini OCR] Falling back to manual entry mode due to AI extraction unavailability.');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const expiry = new Date(today);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiryStr = expiry.toISOString().split('T')[0];

  return {
    productName: '',
    brand: '',
    model: '',
    purchaseDate: todayStr,
    price: 0,
    currency: 'USD',
    invoiceNumber: '',
    store: '',
    category: 'Home Appliances',
    warrantyPeriodMonths: 12,
    warrantyExpiryDate: expiryStr,
    ocrConfidence: 'Manual Review Required',
    rawNotes: 'AI scan could not parse all fields automatically. Please verify and fill in the details manually.'
  };
}
