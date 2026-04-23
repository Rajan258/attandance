const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

/**
 * Cache JSON responses for GET endpoints.
 */
const cacheMiddleware = ({ keyBuilder, ttlSeconds }) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const cacheKey = keyBuilder(req);
  if (!cacheKey) return next();

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, payload, ttlSeconds).catch((err) => {
          logger.warn({ message: 'Failed to cache response payload', cacheKey, error: err.message });
        });
      }
      return originalJson(payload);
    };

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = cacheMiddleware;
