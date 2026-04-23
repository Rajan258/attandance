const { CACHE_TTL_SECONDS, REDIS_URL } = require('../config/config');
const logger = require('../config/logger');

const memoryStore = new Map();
let redisClient = null;

const tryInitRedis = async () => {
  if (!REDIS_URL || redisClient) return;

  try {
    // Optional dependency: if redis package is installed and REDIS_URL is configured.
    // eslint-disable-next-line global-require
    const { createClient } = require('redis');
    const client = createClient({ url: REDIS_URL });
    client.on('error', (err) => logger.warn({ message: 'Redis cache error', error: err.message }));
    await client.connect();
    redisClient = client;
    logger.info({ message: 'Redis cache connected' });
  } catch (err) {
    logger.warn({ message: 'Redis unavailable, falling back to in-memory cache', error: err.message });
  }
};

const getMemory = (key) => {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
};

const setMemory = (key, value, ttlSeconds = CACHE_TTL_SECONDS) => {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
};

const delMemory = (key) => {
  memoryStore.delete(key);
};

const get = async (key) => {
  await tryInitRedis();
  if (redisClient) {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  }
  return getMemory(key);
};

const set = async (key, value, ttlSeconds = CACHE_TTL_SECONDS) => {
  await tryInitRedis();
  if (redisClient) {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }
  setMemory(key, value, ttlSeconds);
};

const del = async (key) => {
  await tryInitRedis();
  if (redisClient) {
    await redisClient.del(key);
    return;
  }
  delMemory(key);
};

const clearMemory = () => {
  memoryStore.clear();
};

module.exports = {
  get,
  set,
  del,
  clearMemory
};
