const Joi = require('joi');

const moneyField = Joi.number().min(0).required();

const createSalaryStructureSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  basic: moneyField,
  hra: moneyField,
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  pf: Joi.number().min(0).default(0),
  esi: Joi.number().min(0).default(0),
  tds: Joi.number().min(0).default(0),
  effective_from: Joi.date().iso().required()
});

const generatePayrollSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required()
});

const payrollAdminQuerySchema = Joi.object({
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).optional()
});

module.exports = {
  createSalaryStructureSchema,
  generatePayrollSchema,
  payrollAdminQuerySchema
};
