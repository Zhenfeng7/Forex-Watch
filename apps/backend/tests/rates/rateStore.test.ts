import { describe, expect, test } from 'vitest';
import { saveRates, getRate } from '../../src/services/rates/rateStore.js';

describe('rateStore', () => {
  test('stores and returns non-stale rate', () => {
    const now = new Date();
    saveRates([
      {
        base: 'USD',
        quote: 'JPY',
        rate: 150,
        timestamp: now,
        provider: 'mock',
      },
    ]);

    const result = getRate('USD', 'JPY', 60_000);
    expect(result).not.toBeNull();
    expect(result?.stale).toBe(false);
  });

  test('marks rate stale when TTL passed', () => {
    const old = new Date(Date.now() - 120_000);
    saveRates([
      {
        base: 'USD',
        quote: 'EUR',
        rate: 0.9,
        timestamp: old,
        provider: 'mock',
      },
    ]);

    const result = getRate('USD', 'EUR', 60_000);
    expect(result?.stale).toBe(true);
  });
});
