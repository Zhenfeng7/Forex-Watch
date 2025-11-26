import { type Currency, type ExchangeRate } from '@forex-watch/shared';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { createChildLogger } from '../../utils/logger.js';
import { type RateProvider } from './types.js';

type FreecurrencyApiSuccess = {
  data: Record<string, number>;
  meta?: {
    last_updated_at?: string;
  };
};

type FreecurrencyApiError = {
  message?: string;
};

const log = createChildLogger({ module: 'rates:freecurrencyapi' });

const providerConfig = config.rates;
const baseUrl = providerConfig.baseUrl ?? 'https://api.freecurrencyapi.com';
const timeoutMs = providerConfig.timeoutMs ?? 5000;
const retryCount = providerConfig.retryCount ?? 1;

// Make sure we have what we need to talk to the provider.
function ensureApiKey(): string {
  if (!providerConfig.apiKey) {
    throw new AppError(
      'Freecurrencyapi key is missing',
      500,
      'RATE_PROVIDER_CONFIG_ERROR'
    );
  }
  return providerConfig.apiKey;
}

// Basic fetch with a timeout so slow upstreams do not hang our jobs.
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(
        'Rate provider request timed out',
        504,
        'RATE_PROVIDER_TIMEOUT'
      );
    }
    throw new AppError(
      'Rate provider request failed',
      503,
      'RATE_PROVIDER_REQUEST_FAILED',
      { error: error instanceof Error ? error.message : String(error) }
    );
  } finally {
    clearTimeout(timer);
  }
}

function buildUrl(base: Currency, quotes: Currency[]): string {
  const apiKey = ensureApiKey();
  const currencies = quotes.join(',');
  const searchParams = new URLSearchParams({
    apikey: apiKey,
    base_currency: base,
    currencies,
  });
  return `${baseUrl}/v1/latest?${searchParams.toString()}`;
}

function parseTimestamp(meta?: FreecurrencyApiSuccess['meta']): Date {
  if (meta?.last_updated_at) {
    const parsed = new Date(meta.last_updated_at);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

// Turn the provider payload into our ExchangeRate shape and surface bad responses.
async function parseResponse(
  response: Response,
  base: Currency,
  quotes: Currency[]
): Promise<ExchangeRate[]> {
  let body: FreecurrencyApiSuccess | FreecurrencyApiError;

  try {
    body = (await response.json()) as
      | FreecurrencyApiSuccess
      | FreecurrencyApiError;
  } catch (error) {
    // If provider returned a bad body on an error status, treat as provider error, not fatal parsing.
    if (!response.ok) {
      throw new AppError(
        'Rate provider request failed',
        response.status >= 500 ? 503 : response.status,
        'RATE_PROVIDER_ERROR',
        {
          status: response.status,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
    throw new AppError(
      'Invalid response from rate provider',
      502,
      'RATE_PROVIDER_INVALID_JSON',
      {
        status: response.status,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }

  if (response.ok && 'data' in body) {
    const timestamp = parseTimestamp(body.meta);
    const rates: ExchangeRate[] = [];

    for (const quote of quotes) {
      const rate = body.data[quote];
      if (typeof rate !== 'number') {
        throw new AppError(
          'Rate provider returned invalid rate',
          502,
          'RATE_PROVIDER_INVALID_RATE',
          { quote }
        );
      }
      rates.push({
        base,
        quote,
        rate,
        timestamp,
        provider: 'freecurrencyapi',
      });
    }

    return rates;
  }

  const details = {
    status: response.status,
    message: 'message' in body ? body.message : undefined,
  };

  const statusCode =
    response.status >= 500 ? 503 : response.status === 404 ? 404 : 502;

  throw new AppError(
    'Rate provider request failed',
    statusCode,
    'RATE_PROVIDER_ERROR',
    details
  );
}

// Main fetch flow with simple retry on 5xx errors.
async function requestLatestRates(
  base: Currency,
  quotes: Currency[]
): Promise<ExchangeRate[]> {
  if (quotes.some(quote => quote === base)) {
    throw new AppError(
      'Base and quote currencies must differ',
      400,
      'RATE_VALIDATION_ERROR'
    );
  }

  const url = buildUrl(base, quotes);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryCount) {
    try {
      const response = await fetchWithTimeout(url);

      if (response.ok || response.status < 500 || attempt === retryCount) {
        return await parseResponse(response, base, quotes);
      }

      log.warn(
        { attempt, status: response.status, base, quotes },
        'Rate provider returned server error, retrying'
      );
    } catch (error) {
      lastError = error;
      if (attempt === retryCount) {
        throw error;
      }

      log.warn(
        {
          attempt,
          error: error instanceof Error ? error.message : String(error),
          base,
          quotes,
        },
        'Rate provider request failed, retrying'
      );
    }

    attempt += 1;
  }

  // This should not be reachable due to the loop logic
  throw new AppError(
    'Rate provider request failed after retries',
    503,
    'RATE_PROVIDER_RETRIES_EXHAUSTED',
    {
      error: lastError instanceof Error ? lastError.message : String(lastError),
    }
  );
}

export function createFreecurrencyApiClient(): RateProvider {
  return {
    // Public entry point: fetch the latest rate for a pair.
    async getLatestRate(
      base: Currency,
      quote: Currency
    ): Promise<ExchangeRate> {
      const [single] = await requestLatestRates(base, [quote]);
      return single;
    },
    // Batch fetch for the same base currency to save quota.
    async getLatestRates(
      base: Currency,
      quotes: Currency[]
    ): Promise<ExchangeRate[]> {
      return requestLatestRates(base, quotes);
    },
  };
}
