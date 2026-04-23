require('dotenv').config();

const config = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS || 60),
  REDIS_URL: process.env.REDIS_URL || '',
  DB_SYNC_ALTER: process.env.DB_SYNC_ALTER === 'true',
  DB_SYNC_FORCE: process.env.DB_SYNC_FORCE === 'true',
  ALLOW_DB_SYNC: process.env.ALLOW_DB_SYNC
    ? process.env.ALLOW_DB_SYNC === 'true'
    : process.env.NODE_ENV !== 'production'
};

const getMissingProductionEnv = () => {
  if (config.NODE_ENV !== 'production') return [];

  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGINS'
  ];

  return required.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || String(value).trim() === '';
  });
};

module.exports = {
  ...config,
  getMissingProductionEnv
};
