const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/', asyncHandler(healthController.getHealth));

module.exports = router;
