import { type Currency, type ExchangeRate } from '@forex-watch/shared';

type StoredRate = ExchangeRate & { stale: boolean };

const store = new Map<string, StoredRate>();

function key(base: Currency, quote: Currency): string {
  return `${base}-${quote}`;
}

// Save a batch of rates. Mark them stale if we had to reuse old data.
export function saveRates(rates: ExchangeRate[], stale = false): void {
  for (const rate of rates) {
    store.set(key(rate.base, rate.quote), { ...rate, stale });
  }
}

// Return the latest rate if we have it. Mark stale when TTL has passed or the entry was already stale.
export function getRate(
  base: Currency,
  quote: Currency,
  cacheTtlMs: number
): StoredRate | null {
  const entry = store.get(key(base, quote));
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp.getTime() > cacheTtlMs;
  return { ...entry, stale: entry.stale || isExpired };
}

export function getAllRates(cacheTtlMs: number): StoredRate[] {
  return Array.from(store.values()).map(entry => {
    const isExpired = Date.now() - entry.timestamp.getTime() > cacheTtlMs;
    return { ...entry, stale: entry.stale || isExpired };
  });
}
