const Joi = require('joi');

const scopeValues = ['employees', 'attendance', 'leaves', 'payroll', 'projects_tasks', 'audit_logs'];
const formatValues = ['csv', 'xlsx', 'pdf', 'json'];
const groupByValues = ['employee', 'date', 'department'];

const exportQuerySchema = Joi.object({
  scope: Joi.string().valid(...scopeValues),
  format: Joi.string().valid(...formatValues).default('csv'),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(3000),
  employee_id: Joi.number().integer().positive(),
  department: Joi.string(),
  employee_status: Joi.string().valid('ACTIVE', 'ON_NOTICE', 'RESIGNED', 'TERMINATED'),
  role: Joi.string().valid('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'),
  attendance_status: Joi.string().valid('Present', 'WO', 'Leave', 'Half day'),
  leave_status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'),
  payroll_month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/),
  payroll_status: Joi.string().valid('PENDING', 'PAID'),
  project_status: Joi.string().valid('ACTIVE', 'ARCHIVED'),
  user_id: Joi.number().integer().positive(),
  columns: Joi.string(),
  group_by: Joi.string().valid(...groupByValues),
  template: Joi.string().valid('monthly_attendance', 'yearly_payroll'),
  async: Joi.boolean().truthy('true').falsy('false').default(false),
  email: Joi.string().email().optional()
});

const exportJobParamsSchema = Joi.object({
  id: Joi.string().required()
});

const exportLogsQuerySchema = Joi.object({
  type: Joi.string().valid('IMPORT', 'EXPORT'),
  module: Joi.string(),
  status: Joi.string().valid('QUEUED', 'SUCCESS', 'FAILED'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  exportQuerySchema,
  exportJobParamsSchema,
  exportLogsQuerySchema
};
