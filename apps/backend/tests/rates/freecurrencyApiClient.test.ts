import { describe, expect, afterEach, beforeEach, test, vi } from 'vitest';

const baseEnv = {
  MONGODB_URI: 'mongodb://localhost:27017/forex-watch-test',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_SECRET: 'x'.repeat(32),
  JWT_REFRESH_SECRET: 'y'.repeat(32),
  RATE_PROVIDER: 'freecurrencyapi',
  FREECURRENCYAPI_KEY: 'test-key',
  FREECURRENCYAPI_BASE_URL: 'https://api.freecurrencyapi.com',
  RATE_PROVIDER_TIMEOUT_MS: '100',
  RATE_PROVIDER_RETRY_COUNT: '1',
};

async function loadClient() {
  vi.resetModules();
  const module = await import(
    '../../src/services/rates/freecurrencyApiClient.js'
  );
  return module.createFreecurrencyApiClient();
}

function mockFetchOnce(response: Response | Promise<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
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

describe('Freecurrencyapi client', () => {
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
          data: {
            JPY: 150.5,
          },
          meta: {
            last_updated_at: '2024-05-01T00:00:00Z',
          },
        }),
        { status: 200 }
      )
    );

    const client = await loadClient();
    const result = await client.getLatestRate('USD', 'JPY');

    expect(result).toMatchObject({
      base: 'USD',
      quote: 'JPY',
      rate: 150.5,
      provider: 'freecurrencyapi',
    });
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('batch fetches multiple quotes in one call', async () => {
    mockFetchOnce(
      new Response(
        JSON.stringify({
          data: {
            JPY: 150.5,
            EUR: 0.92,
          },
        }),
        { status: 200 }
      )
    );

    const client = await loadClient();
    const result = await client.getLatestRates('USD', ['JPY', 'EUR']);

    expect(result).toHaveLength(2);
  });

  test('surfaces provider 4xx errors as AppError', async () => {
    mockFetchOnce(
      new Response(JSON.stringify({ message: 'not found' }), { status: 404 })
    );

    const client = await loadClient();

    await expect(client.getLatestRate('USD', 'JPY')).rejects.toMatchObject({
      code: 'RATE_PROVIDER_ERROR',
    });
  });

  test('times out when provider is too slow', async () => {
    mockFetchTimeout();

    const client = await loadClient();

    await expect(client.getLatestRate('USD', 'JPY')).rejects.toMatchObject({
      code: 'RATE_PROVIDER_TIMEOUT',
    });
  });
});
