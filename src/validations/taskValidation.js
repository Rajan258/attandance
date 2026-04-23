const Joi = require('joi');

const taskPriority = ['LOW', 'MEDIUM', 'HIGH'];
const taskStatus = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

const createTaskSchema = Joi.object({
  project_id: Joi.number().integer().positive().required(),
  assigned_to: Joi.number().integer().positive().required(),
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().allow('', null),
  deadline: Joi.date().iso().allow(null),
  priority: Joi.string().valid(...taskPriority).optional(),
  status: Joi.string().valid(...taskStatus).optional()
});

const updateTaskSchema = Joi.object({
  project_id: Joi.number().integer().positive(),
  assigned_to: Joi.number().integer().positive(),
  title: Joi.string().trim().min(1),
  description: Joi.string().allow('', null),
  deadline: Joi.date().iso().allow(null),
  priority: Joi.string().valid(...taskPriority),
  status: Joi.string().valid(...taskStatus)
}).min(1);

const addCommentSchema = Joi.object({
  task_id: Joi.number().integer().positive().required(),
  comment: Joi.string().trim().min(1).required()
});

const uploadTaskFileSchema = Joi.object({
  task_id: Joi.number().integer().positive().required()
});

const taskListQuerySchema = Joi.object({
  project_id: Joi.number().integer().positive().optional()
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  addCommentSchema,
  uploadTaskFileSchema,
  taskListQuerySchema
};
