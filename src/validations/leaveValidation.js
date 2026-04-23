const Joi = require('joi');

const leaveStatus = ['APPROVED', 'REJECTED', 'CANCELLED'];
const allLeaveStatuses = ['PENDING', ...leaveStatus];

const applyLeaveSchema = Joi.object({
  leave_type_id: Joi.number().integer().positive().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  days: Joi.number().positive().required(),
  reason: Joi.string().trim().allow('', null)
});

const updateLeaveStatusSchema = Joi.object({
  status: Joi.string().valid(...leaveStatus).required()
});

const myLeavesQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional()
});

const adminLeavesQuerySchema = Joi.object({
  status: Joi.string().valid(...allLeaveStatuses).optional()
});

module.exports = {
  applyLeaveSchema,
  updateLeaveStatusSchema,
  myLeavesQuerySchema,
  adminLeavesQuerySchema
};
