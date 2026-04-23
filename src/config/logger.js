const { createLogger, transports, format } = require('winston');
const { LOG_LEVEL, NODE_ENV } = require('./config');

const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'ems-server', env: NODE_ENV },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: NODE_ENV === 'development'
        ? format.combine(format.colorize(), format.simple())
        : format.json()
    })
  ]
});

module.exports = logger;
