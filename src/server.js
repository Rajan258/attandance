const http = require('http');
const app = require('./app');
const { syncDb } = require('./models');
const { PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER, getMissingProductionEnv } = require('./config/config');
const logger = require('./config/logger');
const server = http.createServer(app);

const missingEnv = getMissingProductionEnv();
if (missingEnv.length > 0) {
  logger.error({
    message: 'Failed to start server: missing required production environment variables',
    missingEnv
  });
  process.exit(1);
}

syncDb().then(() => {
  server.listen(PORT, () => {
    logger.info({ message: `Server running on port ${PORT}` });
  });
}).catch((err) => {
  logger.error({
    message: 'Failed to start server',
    error: err.message || 'Unknown startup error',
    dbTarget: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER
    },
    dbErrorCode: err?.original?.code || err?.parent?.code || null,
    dbErrorMessage: err?.original?.message || err?.parent?.message || null,
    stack: err.stack
  });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ message: 'Uncaught exception', error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ message: 'Unhandled rejection', reason: String(reason) });
});
