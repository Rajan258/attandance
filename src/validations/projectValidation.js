const Joi = require('joi');

const projectStatus = ['ACTIVE', 'ARCHIVED'];

const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid(...projectStatus).optional(),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null)
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1),
  description: Joi.string().allow('', null),
  status: Joi.string().valid(...projectStatus),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null)
}).min(1);

module.exports = {
  createProjectSchema,
  updateProjectSchema
};
