const Joi = require('joi');

const attendanceImportBodySchema = Joi.object({
  mode: Joi.string().valid('skip', 'update', 'fail').default('skip'),
  dryRun: Joi.boolean().truthy('true').falsy('false').default(false),
  previewOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

module.exports = {
  attendanceImportBodySchema
};
