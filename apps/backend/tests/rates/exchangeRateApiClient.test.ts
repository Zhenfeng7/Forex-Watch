import { describe, expect, afterEach, beforeEach, test, vi } from 'vitest';

const baseEnv = {
  MONGODB_URI: 'mongodb://localhost:27017/forex-watch-test',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_SECRET: 'x'.repeat(32),
  JWT_REFRESH_SECRET: 'y'.repeat(32),
  RATE_PROVIDER: 'exchangerate-api',
  EXCHANGERATE_API_KEY: 'test-key',
  EXCHANGERATE_API_BASE_URL: 'https://v6.exchangerate-api.com',
  RATE_PROVIDER_TIMEOUT_MS: '100',
  RATE_PROVIDER_RETRY_COUNT: '1',
};

async function loadClient() {
  vi.resetModules();
  const module = await import(
    '../../src/services/rates/exchangeRateApiClient.js'
  );
  return module.createExchangeRateApiClient();
}

async function loadSelector() {
  vi.resetModules();
  const module = await import('../../src/services/rates/index.js');
  return module.rateProvider;
}

function mockFetchOnce(response: Response | Promise<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function mockFetchSequence(sequence: Array<Response | Promise<Response>>) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(sequence.shift() as Response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function mockFetchTimeout() {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  const fetchMock = vi.fn().mockRejectedValue(err);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('ExchangeRate-API client', () => {
  beforeEach(() => {
    Object.entries(baseEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches and normalizes a rate successfully', async () => {
    mockFetchOnce(
      new Response(
        JSON.stringify({
          result: 'success',
          base_code: 'USD',
          target_code: 'EUR',
          conversion_rate: 1.2345,
          time_last_update_unix: 1_700_000_000,
        }),
        { status: 200 }
      )
    );

    const client = await loadClient();
    const result = await client.getLatestRate('USD', 'EUR');

    expect(result).toMatchObject({
      base: 'USD',
      quote: 'EUR',
      rate: 1.2345,
      provider: 'exchangerate-api',
    });
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('surfaces provider 4xx errors as AppError', async () => {
    mockFetchOnce(
      new Response(
        JSON.stringify({ result: 'error', 'error-type': 'unsupported-code' }),
        { status: 404 }
      )
    );

    const client = await loadClient();

    await expect(client.getLatestRate('USD', 'EUR')).rejects.toMatchObject({
      code: 'RATE_PROVIDER_ERROR',
    });
  });

  test('retries on 5xx then succeeds', async () => {
    mockFetchSequence([
      new Response(
        JSON.stringify({ result: 'error', 'error-type': 'server-error' }),
        { status: 500 }
      ),
      new Response(
        JSON.stringify({
          result: 'success',
          base_code: 'USD',
          target_code: 'EUR',
          conversion_rate: 1.1,
        }),
        { status: 200 }
      ),
    ]);

    const client = await loadClient();
    const result = await client.getLatestRate('USD', 'EUR');

    expect(result.rate).toBe(1.1);
  });

  test('times out when provider is too slow', async () => {
    mockFetchTimeout();

    const client = await loadClient();

    await expect(client.getLatestRate('USD', 'EUR')).rejects.toMatchObject({
      code: 'RATE_PROVIDER_TIMEOUT',
    });
  });
});

describe('Rate provider selector', () => {
  beforeEach(() => {
    Object.entries(baseEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns mock provider when configured', async () => {
    process.env.RATE_PROVIDER = 'mock';

    const provider = await loadSelector();
    const rate = await provider.getLatestRate('USD', 'EUR');

    expect(rate.provider).toBe('mock');
  });
});
