export function getCurrencySymbol(currency?: string): string {
  if (!currency) return '$';
  const c = currency.toUpperCase().trim();
  switch (c) {
    case 'INR':
    case 'RS':
    case 'RUPEES':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
    case 'CNY':
      return '¥';
    case 'CAD':
      return 'CA$';
    case 'AUD':
      return 'AU$';
    case 'USD':
    default:
      return '$';
  }
}

export function formatPrice(amount: number, currency?: string): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = (amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
