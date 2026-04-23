/**
 * Wrap async route handlers so rejected promises are forwarded
 * to the centralized Express error middleware.
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
