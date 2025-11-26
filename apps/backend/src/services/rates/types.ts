import { type Currency, type ExchangeRate } from '@forex-watch/shared';

// Providers must fetch one rate and can optionally batch fetch many quotes for the same base.
export interface RateProvider {
  getLatestRate(base: Currency, quote: Currency): Promise<ExchangeRate>;
  getLatestRates?(base: Currency, quotes: Currency[]): Promise<ExchangeRate[]>;
}
