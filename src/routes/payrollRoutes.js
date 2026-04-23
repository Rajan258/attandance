const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../validations/commonValidation');
const {
  createSalaryStructureSchema,
  generatePayrollSchema,
  payrollAdminQuerySchema
} = require('../validations/payrollValidation');

router.use(auth);

// Salary structure create/update
router.post('/structure', role(1, 2), validate(createSalaryStructureSchema), asyncHandler(payrollController.createSalaryStructure));

// Generate monthly payroll for one employee
router.post('/generate', role(1, 2), validate(generatePayrollSchema), asyncHandler(payrollController.generateMonthlyPayroll));

// Logged-in employee ka payroll
router.get('/me', role(1, 2, 3, 4), asyncHandler(payrollController.getMyPayrolls));

// Admin/HR ka payroll list
router.get('/admin', role(1, 2), validate(payrollAdminQuerySchema, 'query'), asyncHandler(payrollController.getPayrollsAdmin));

router.get('/slip/:id/pdf', role(1, 2, 3, 4), validate(idParamSchema, 'params'), asyncHandler(payrollController.getSalarySlipPDF));


module.exports = router;
