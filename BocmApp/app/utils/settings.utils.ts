export const CARRIER_OPTIONS = [
  { value: 'verizon', label: 'Verizon' },
  { value: 'att', label: 'AT&T' },
  { value: 'tmobile', label: 'T-Mobile' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'boost', label: 'Boost Mobile' },
  { value: 'uscellular', label: 'US Cellular' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'metro', label: 'MetroPCS' },
  { value: 'googlefi', label: 'Google Fi' },
];

export const PRICE_RANGES = [
  { value: 'Budget ($15-$30)', label: 'Budget ($15-$30)' },
  { value: 'Mid-range ($30-$60)', label: 'Mid-range ($30-$60)' },
  { value: 'Premium ($60+)', label: 'Premium ($60+)' }
];

export const BARBER_SPECIALTIES = [
  'Fades',
  'Beard Trims',
  'Line Ups',
  'Tapers',
  'Afros',
  'Mohawks',
  'Designs',
  'Kids Cuts',
  'Senior Cuts',
  'Long Hair',
  'Braiding',
  'Coloring',
  'Hot Towel Shaves',
  'Facials',
  'Hair Treatments'
];

export function extractHandle(input: string): string {
  if (!input) return '';
  input = input.trim();
  try {
    const url = new URL(input);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      let handle = pathParts[pathParts.length - 1];
      if (handle.startsWith('@')) handle = handle.slice(1);
      return '@' + handle;
    }
  } catch {
    // Not a URL
  }
  if (input.startsWith('@')) return input;
  return '@' + input;
}