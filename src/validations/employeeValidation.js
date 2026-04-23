const Joi = require('joi');

const employeeStatus = ['ACTIVE', 'ON_NOTICE', 'RESIGNED', 'TERMINATED'];

const createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role_id: Joi.number().integer().valid(1, 2, 3, 4).required(),
  employee_code: Joi.string().trim().min(1).required(),
  first_name: Joi.string().trim().allow('', null),
  last_name: Joi.string().trim().allow('', null),
  status: Joi.string().valid(...employeeStatus).optional()
});

const updateEmployeeSchema = Joi.object({
  employee_code: Joi.string().trim().min(1),
  first_name: Joi.string().trim().allow('', null),
  last_name: Joi.string().trim().allow('', null),
  status: Joi.string().valid(...employeeStatus)
}).min(1);

const resetEmployeePasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required()
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  resetEmployeePasswordSchema
};
