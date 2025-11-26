import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { createChildLogger } from '../../utils/logger.js';
import { createExchangeRateApiClient } from './exchangeRateApiClient.js';
import { createFreecurrencyApiClient } from './freecurrencyApiClient.js';
import { createMockRateProvider } from './mockRateProvider.js';
import { type RateProvider } from './types.js';

const log = createChildLogger({ module: 'rates:provider-selector' });

function buildProvider(): RateProvider {
  switch (config.rates.provider) {
    case 'freecurrencyapi':
      log.info('Using Freecurrencyapi provider');
      return createFreecurrencyApiClient();
    case 'exchangerate-api':
      log.info('Using ExchangeRate-API provider');
      return createExchangeRateApiClient();
    case 'mock':
      log.info('Using mock rate provider');
      return createMockRateProvider();
    default:
      throw new AppError(
        `Rate provider ${config.rates.provider} is not implemented`,
        500,
        'RATE_PROVIDER_NOT_IMPLEMENTED'
      );
  }
}

// Chosen provider instance for the app. It is created once at startup.
export const rateProvider: RateProvider = buildProvider();
