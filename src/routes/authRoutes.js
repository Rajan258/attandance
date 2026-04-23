const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validateMiddleware');
const {
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema
} = require('../validations/authValidation');
const auth = require('../middlewares/authMiddleware');
const rateLimit = require('../middlewares/rateLimitMiddleware');

router.post('/login', rateLimit({ keyPrefix: 'auth-login', windowMs: 15 * 60 * 1000, max: 20 }), validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', rateLimit({ keyPrefix: 'auth-forgot', windowMs: 15 * 60 * 1000, max: 10 }), validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/change-password', auth, validate(changePasswordSchema), asyncHandler(authController.changePassword));

module.exports = router;
