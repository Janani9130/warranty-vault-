export interface SampleBillItem {
  id: string;
  name: string;
  brand: string;
  store: string;
  price: number;
  currency: string;
  invoiceNo: string;
  date: string;
  warrantyMonths: number;
  category: string;
  dataUrl: string;
}

function createSampleSvg(data: { store: string; title: string; price: string; date: string; invoiceNo: string; warranty: string }): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="550" height="700" viewBox="0 0 550 700" fill="#ffffff" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <rect width="550" height="700" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="16"/>
    <rect width="550" height="110" fill="#ede9fe" rx="16"/>
    <circle cx="50" cy="55" r="26" fill="#8b5cf6" fill-opacity="0.25"/>
    <text x="50" y="62" font-size="20" font-weight="bold" fill="#6d28d9" text-anchor="middle">RECEIPT</text>
    <text x="95" y="48" font-size="22" font-weight="bold" fill="#1e1b4b">${data.store}</text>
    <text x="95" y="72" font-size="13" fill="#6b7280">Official Proof of Purchase &amp; Warranty Certificate</text>

    <!-- Details Box -->
    <g transform="translate(40, 140)">
      <text x="0" y="0" font-size="11" fill="#9ca3af" font-weight="bold">INVOICE NUMBER</text>
      <text x="0" y="24" font-size="16" fill="#111827" font-weight="bold">${data.invoiceNo}</text>
      <text x="280" y="0" font-size="11" fill="#9ca3af" font-weight="bold">DATE</text>
      <text x="280" y="24" font-size="16" fill="#111827" font-weight="bold">${data.date}</text>
    </g>

    <line x1="40" y1="195" x2="510" y2="195" stroke="#f1f5f9" stroke-width="2"/>

    <g transform="translate(40, 220)">
      <rect width="470" height="34" rx="6" fill="#f8fafc"/>
      <text x="12" y="22" font-size="11" font-weight="bold" fill="#64748b">DESCRIPTION</text>
      <text x="400" y="22" font-size="11" font-weight="bold" fill="#64748b">TOTAL</text>
    </g>

    <g transform="translate(40, 280)">
      <text x="12" y="0" font-size="15" font-weight="bold" fill="#0f172a">${data.title}</text>
      <text x="12" y="22" font-size="12" fill="#64748b">Manufacturer Coverage: ${data.warranty}</text>
      <text x="400" y="10" font-size="16" font-weight="bold" fill="#0f172a">${data.price}</text>
    </g>

    <line x1="40" y1="340" x2="510" y2="340" stroke="#f1f5f9" stroke-width="2"/>

    <g transform="translate(280, 370)">
      <text x="0" y="0" font-size="13" fill="#64748b">Total Paid:</text>
      <text x="190" y="0" font-size="18" font-weight="bold" fill="#6d28d9" text-anchor="end">${data.price}</text>
    </g>

    <g transform="translate(40, 460)">
      <rect width="470" height="110" rx="12" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1.5"/>
      <text x="20" y="35" font-size="14" font-weight="bold" fill="#5b21b6">★ Official Warranty Terms Registered</text>
      <text x="20" y="60" font-size="12" fill="#6d28d9">Keep this digital bill copy in WarrantyVault for express claim processing.</text>
      <text x="20" y="85" font-size="11" fill="#7c3aed">Authorized Retail POS Registration Code #WV-9821</text>
    </g>

    <text x="275" y="660" font-size="11" fill="#94a3b8" text-anchor="middle">WarrantyVault Verified Document</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_BILLS: SampleBillItem[] = [
  {
    id: 'sample_s24',
    name: 'Samsung Galaxy S24 Ultra (512GB)',
    brand: 'Samsung',
    store: 'Best Buy Electronics',
    price: 1299.99,
    currency: 'USD',
    invoiceNo: 'BBY-993214',
    date: '2025-10-15',
    warrantyMonths: 12,
    category: 'Electronics',
    dataUrl: createSampleSvg({
      store: 'Best Buy Electronics',
      title: 'Samsung Galaxy S24 Ultra (512GB Titanium Gray)',
      price: '$1,299.99',
      date: '2025-10-15',
      invoiceNo: 'BBY-993214',
      warranty: '12 Months Limited Manufacturer Warranty'
    })
  },
  {
    id: 'sample_ps5',
    name: 'Sony PlayStation 5 Pro Console',
    brand: 'Sony',
    store: 'Target Supercenter',
    price: 699.99,
    currency: 'USD',
    invoiceNo: 'TGT-884920',
    date: '2025-11-20',
    warrantyMonths: 12,
    category: 'Electronics',
    dataUrl: createSampleSvg({
      store: 'Target Supercenter',
      title: 'Sony PlayStation 5 Pro 2TB Console',
      price: '$699.99',
      date: '2025-11-20',
      invoiceNo: 'TGT-884920',
      warranty: '12 Months Hardware Protection'
    })
  },
  {
    id: 'sample_nespresso',
    name: 'Nespresso Vertuo Next Espresso Machine',
    brand: 'Nespresso',
    store: 'Williams Sonoma',
    price: 219.95,
    currency: 'USD',
    invoiceNo: 'WS-550192',
    date: '2025-08-10',
    warrantyMonths: 24,
    category: 'Home Appliances',
    dataUrl: createSampleSvg({
      store: 'Williams Sonoma',
      title: 'Nespresso Vertuo Next Deluxe Coffee & Espresso Maker',
      price: '$219.95',
      date: '2025-08-10',
      invoiceNo: 'WS-550192',
      warranty: '24 Months Replacement Guarantee'
    })
  }
];
