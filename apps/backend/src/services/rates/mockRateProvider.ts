import { type Currency, type ExchangeRate } from '@forex-watch/shared';
import { AppError } from '../../utils/errors.js';
import { createChildLogger } from '../../utils/logger.js';
import { type RateProvider } from './types.js';

const log = createChildLogger({ module: 'rates:mock' });

// Simple mock: returns a fixed 1:1 rate so other parts of the app can run without a real API.
export function createMockRateProvider(): RateProvider {
  return {
    async getLatestRate(
      base: Currency,
      quote: Currency
    ): Promise<ExchangeRate> {
      if (base === quote) {
        throw new AppError(
          'Base and quote currencies must differ',
          400,
          'RATE_VALIDATION_ERROR'
        );
      }

      log.warn({ base, quote }, 'Using mock rate provider (returns 1:1 rate)');

      return {
        base,
        quote,
        rate: 1,
        timestamp: new Date(),
        provider: 'mock',
      };
    },
    async getLatestRates(
      base: Currency,
      quotes: Currency[]
    ): Promise<ExchangeRate[]> {
      return Promise.all(quotes.map(quote => this.getLatestRate(base, quote)));
    },
  };
}
