const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    message: 'API route not found',
    path: req.originalUrl,
    requestId: req.requestId
  });
};

module.exports = notFoundMiddleware;
