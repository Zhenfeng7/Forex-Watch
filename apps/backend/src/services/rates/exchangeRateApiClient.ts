import { type Currency, type ExchangeRate } from '@forex-watch/shared';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { createChildLogger } from '../../utils/logger.js';
import { type RateProvider } from './types.js';

type ExchangeRateApiResponse =
  | {
      result: 'success';
      base_code: Currency;
      target_code: Currency;
      conversion_rate: number;
      time_last_update_unix?: number;
    }
  | {
      result: 'error';
      'error-type': string;
    };

const log = createChildLogger({ module: 'rates:exchangerate-api' });

const providerConfig = config.rates;
const baseUrl = providerConfig.baseUrl ?? 'https://v6.exchangerate-api.com';
const timeoutMs = providerConfig.timeoutMs ?? 5000;
const retryCount = providerConfig.retryCount ?? 1;

// Make sure we have what we need to talk to the provider.
function ensureApiKey(): string {
  if (!providerConfig.apiKey) {
    throw new AppError(
      'ExchangeRate-API key is missing',
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

// Turn the provider payload into our ExchangeRate shape and surface bad responses.
async function parseResponse(
  response: Response,
  base: Currency,
  quote: Currency
): Promise<ExchangeRate> {
  let body: ExchangeRateApiResponse;

  try {
    body = (await response.json()) as ExchangeRateApiResponse;
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

  if (response.ok && body.result === 'success') {
    if (typeof body.conversion_rate !== 'number') {
      throw new AppError(
        'Rate provider returned invalid rate',
        502,
        'RATE_PROVIDER_INVALID_RATE'
      );
    }

    const timestamp = body.time_last_update_unix
      ? new Date(body.time_last_update_unix * 1000)
      : new Date();

    return {
      base,
      quote,
      rate: body.conversion_rate,
      timestamp,
      provider: 'exchangerate-api',
    };
  }

  // Non-2xx or explicit provider error
  const details = {
    status: response.status,
    providerResult: body.result,
    providerError:
      body.result === 'error' && 'error-type' in body
        ? body['error-type']
        : undefined,
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
async function requestLatestRate(
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

  const apiKey = ensureApiKey();
  const url = `${baseUrl}/${apiKey}/pair/${base}/${quote}`;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryCount) {
    try {
      const response = await fetchWithTimeout(url);

      if (response.ok || response.status < 500 || attempt === retryCount) {
        return await parseResponse(response, base, quote);
      }

      log.warn(
        { attempt, status: response.status, base, quote },
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
          quote,
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

export function createExchangeRateApiClient(): RateProvider {
  return {
    // Public entry point: fetch the latest rate for a pair.
    async getLatestRate(
      base: Currency,
      quote: Currency
    ): Promise<ExchangeRate> {
      return requestLatestRate(base, quote);
    },
  };
}
