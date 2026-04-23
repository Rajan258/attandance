const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const logger = require('../config/logger');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    logger.warn({ message: 'Unauthorized request: missing Authorization header', path: req.originalUrl, requestId: req.requestId });
    return res.status(401).json({ message: 'Authorization header is missing' });
  }
  if (!authHeader.startsWith('Bearer ')) {
    logger.warn({ message: 'Unauthorized request: invalid auth scheme', path: req.originalUrl, requestId: req.requestId });
    return res.status(401).json({ message: 'Authorization header must use Bearer token format' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    logger.warn({ message: 'Unauthorized request: empty bearer token', path: req.originalUrl, requestId: req.requestId });
    return res.status(401).json({ message: 'Bearer token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ message: 'Unauthorized request: token verification failed', path: req.originalUrl, requestId: req.requestId });
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};

module.exports = authMiddleware;
