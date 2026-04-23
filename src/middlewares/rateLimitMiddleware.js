const logger = require('../config/logger');

const store = new Map();

const cleanupExpired = (now) => {
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) store.delete(key);
  }
};

/**
 * Lightweight in-memory rate limiter.
 * Note: for multi-instance production use Redis-backed limiter.
 */
const rateLimit = ({ keyPrefix, windowMs, max }) => {
  return (req, res, next) => {
    const now = Date.now();
    if (store.size > 10000) cleanupExpired(now);

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const existing = store.get(key);

    if (!existing || existing.expiresAt <= now) {
      store.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      logger.warn({
        message: 'Rate limit exceeded',
        keyPrefix,
        ip,
        path: req.originalUrl
      });
      return res.status(429).json({
        message: 'Too many requests. Please try again later.'
      });
    }

    existing.count += 1;
    return next();
  };
};

module.exports = rateLimit;
