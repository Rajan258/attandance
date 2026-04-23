const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../validations/commonValidation');
const {
  applyLeaveSchema,
  updateLeaveStatusSchema,
  myLeavesQuerySchema,
  adminLeavesQuerySchema
} = require('../validations/leaveValidation');

router.use(auth);

// Leave types – sab dekh sakte hain (dropdown ke liye)
router.get('/types', role(1, 2, 3, 4), asyncHandler(leaveController.getLeaveTypes));

// Employee – apni leave apply kare + apni list dekhe
router.post('/apply', role(1, 2, 3, 4), validate(applyLeaveSchema), asyncHandler(leaveController.applyLeave));
router.get('/me', role(1, 2, 3, 4), validate(myLeavesQuerySchema, 'query'), asyncHandler(leaveController.getMyLeaves));

// Admin / HR / Manager – sab ke leaves dekh sakte hain
router.get('/', role(1, 2, 3), validate(adminLeavesQuerySchema, 'query'), asyncHandler(leaveController.getAllLeaves));

// Admin / HR / Manager – approve / reject
router.put(
  '/:id/status',
  role(1, 2, 3),
  validate(idParamSchema, 'params'),
  validate(updateLeaveStatusSchema),
  asyncHandler(leaveController.updateLeaveStatus)
);

module.exports = router;
