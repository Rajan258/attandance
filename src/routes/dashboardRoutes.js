const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { CACHE_TTL_SECONDS } = require('../config/config');

router.get(
  '/overview',
  auth,
  cacheMiddleware({
    keyBuilder: (req) => `dashboard:overview:role:${req.user?.role_id || 'unknown'}`,
    ttlSeconds: CACHE_TTL_SECONDS
  }),
  asyncHandler(dashboardController.getOverview)
);

module.exports = router;
