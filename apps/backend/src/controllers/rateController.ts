import { CurrencySchema } from '@forex-watch/shared';
import { type Request, type Response } from 'express';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import { getRate } from '../services/rates/rateStore.js';

// Return the last fetched rate from cache/storage. Never hits the provider directly.
export function getLatestRateHandler(req: Request, res: Response) {
  const baseRaw = req.query.base;
  const quoteRaw = req.query.quote;

  const baseResult = CurrencySchema.safeParse(baseRaw);
  const quoteResult = CurrencySchema.safeParse(quoteRaw);

  if (!baseResult.success || !quoteResult.success) {
    throw new AppError(
      'Invalid or missing currency codes',
      400,
      'RATE_VALIDATION_ERROR'
    );
  }

  const base = baseResult.data;
  const quote = quoteResult.data;

  if (base === quote) {
    throw new AppError(
      'Base and quote currencies must differ',
      400,
      'RATE_VALIDATION_ERROR'
    );
  }

  const latest = getRate(base, quote, config.rates.cacheTtlMs);

  if (!latest) {
    throw new AppError(
      'No rate available yet for this pair',
      404,
      'RATE_NOT_AVAILABLE'
    );
  }

  res.json({
    message: 'Latest rate',
    data: latest,
  });
}
