const crypto = require('crypto');

const requestContextMiddleware = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const requestId = incoming || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

module.exports = requestContextMiddleware;
