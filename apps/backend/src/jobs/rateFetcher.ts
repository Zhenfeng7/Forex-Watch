import { type Currency } from '@forex-watch/shared';
import { config } from '../config/index.js';
import { rateProvider } from '../services/rates/index.js';
import { getRate, saveRates } from '../services/rates/rateStore.js';
import { createChildLogger } from '../utils/logger.js';

type IntervalHandle = ReturnType<typeof setInterval>;

const log = createChildLogger({ module: 'jobs:rate-fetcher' });

function groupByBase(
  pairs: Array<{ base: Currency; quote: Currency }>
): Map<Currency, Currency[]> {
  const grouped = new Map<Currency, Currency[]>();

  for (const pair of pairs) {
    if (!grouped.has(pair.base)) {
      grouped.set(pair.base, []);
    }
    grouped.get(pair.base)!.push(pair.quote);
  }

  return grouped;
}

function getHourInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });

  const formatted = formatter.format(new Date());
  return parseInt(formatted, 10);
}

function withinActiveWindow(): boolean {
  const { startHour, endHour, timezone } = config.rates.activeHours;
  const currentHour = getHourInTimezone(timezone);

  return currentHour >= startHour && currentHour < endHour;
}

async function fetchForBase(base: Currency, quotes: Currency[]): Promise<void> {
  try {
    if (rateProvider.getLatestRates) {
      const rates = await rateProvider.getLatestRates(base, quotes);
      saveRates(rates, false);
      log.info({ base, quotes }, 'Fetched rates successfully');
      return;
    }

    // Fallback: fetch sequentially
    const results = [];
    for (const quote of quotes) {
      // eslint-disable-next-line no-await-in-loop
      const rate = await rateProvider.getLatestRate(base, quote);
      results.push(rate);
    }
    saveRates(results, false);
    log.info({ base, quotes }, 'Fetched rates successfully');
  } catch (error) {
    log.error(
      {
        error,
        base,
        quotes,
      },
      'Rate fetch failed'
    );

    // If we have previous rates, mark them stale so consumers know they are old.
    for (const quote of quotes) {
      const cached = getRate(base, quote, config.rates.cacheTtlMs);
      if (cached) {
        saveRates(
          [
            {
              base,
              quote,
              rate: cached.rate,
              timestamp: cached.timestamp,
              provider: cached.provider,
            },
          ],
          true
        );
      }
    }
  }
}

async function runFetch(): Promise<void> {
  if (!withinActiveWindow()) {
    log.debug('Skipping rate fetch (outside active window)');
    return;
  }

  const grouped = groupByBase(config.rates.pairs);
  for (const [base, quotes] of grouped.entries()) {
    // eslint-disable-next-line no-await-in-loop
    await fetchForBase(base, quotes);
  }
}

export function startRateFetcher(): () => void {
  const intervalMs = config.rates.fetchIntervalMinutes * 60 * 1000;
  log.info(
    {
      intervalMinutes: config.rates.fetchIntervalMinutes,
      activeWindow: config.rates.activeHours,
      pairs: config.rates.pairs,
    },
    'Starting rate fetcher'
  );

  // Run once on startup to warm the cache.
  void runFetch();

  const handle: IntervalHandle = setInterval(() => {
    void runFetch();
  }, intervalMs);

  return () => {
    clearInterval(handle);
    log.info('Stopped rate fetcher');
  };
}
