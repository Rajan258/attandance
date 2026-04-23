const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../validations/commonValidation');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  resetEmployeePasswordSchema
} = require('../validations/employeeValidation');

router.use(auth);

// Assume role IDs: 1=ADMIN, 2=HR, 3=MANAGER, 4=EMPLOYEE
router.get('/', role(1, 2, 3), asyncHandler(employeeController.getEmployees));
router.post('/', role(1, 2), validate(createEmployeeSchema), asyncHandler(employeeController.createEmployee));
router.get('/:id', role(1, 2, 3, 4), validate(idParamSchema, 'params'), asyncHandler(employeeController.getEmployeeById));
router.put('/:id', role(1, 2), validate(idParamSchema, 'params'), validate(updateEmployeeSchema), asyncHandler(employeeController.updateEmployee));

// SOFT DELETE
router.delete('/:id', role(1), validate(idParamSchema, 'params'), asyncHandler(employeeController.deleteEmployee));

// RESTORE
router.put('/:id/restore', role(1), validate(idParamSchema, 'params'), asyncHandler(employeeController.restoreEmployee));
router.put(
  '/:id/reset-password',
  role(1, 2),
  validate(idParamSchema, 'params'),
  validate(resetEmployeePasswordSchema),
  asyncHandler(employeeController.resetEmployeePassword)
);


module.exports = router;
