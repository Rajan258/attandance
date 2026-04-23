const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger');
const { CORS_ORIGINS, NODE_ENV } = require('./config/config');
const { errorHandler } = require('./middlewares/errorMiddleware');
const requestContextMiddleware = require('./middlewares/requestContextMiddleware');
const securityHeadersMiddleware = require('./middlewares/securityHeadersMiddleware');
const rateLimit = require('./middlewares/rateLimitMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const apiRoutes = require('./routes');
const setupSwagger = require('./docs/swagger');

const app = express();

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = CORS_ORIGINS
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(securityHeadersMiddleware);
app.use(express.json());
app.use(requestContextMiddleware);
app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info({ message: message.trim() })
    }
  })
);

app.use('/api', rateLimit({ keyPrefix: 'api', windowMs: 60 * 1000, max: 120 }));
app.use('/api', apiRoutes);
app.use('/api', notFoundMiddleware);

setupSwagger(app);

app.use(errorHandler);

module.exports = app;
