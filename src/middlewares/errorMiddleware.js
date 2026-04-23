const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message || 'Unhandled server error',
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    stack: err.stack
  });

  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Multer known errors -> user-friendly 400
  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large. Maximum size is 10 MB.';
    } else {
      message = 'File upload failed. Please check the file and try again.';
    }
  }

  res.status(status).json({
    message,
    requestId: req.requestId
  });
};

module.exports = { errorHandler };
