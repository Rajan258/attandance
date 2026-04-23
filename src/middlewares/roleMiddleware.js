const logger = require('../config/logger');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoleId = Number(req.user?.role_id);
    if (!Number.isInteger(userRoleId)) {
      logger.warn({
        message: 'Access denied: missing role on token',
        path: req.originalUrl,
        requestId: req.requestId
      });
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!allowedRoles.includes(userRoleId)) {
      logger.warn({
        message: 'Access denied: role not allowed',
        path: req.originalUrl,
        requestId: req.requestId,
        userRoleId,
        allowedRoles
      });
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = roleMiddleware;
