/**
 * Validate request payload using Joi.
 * `target` can be: body | params | query
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const payload = req[target] || {};
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.details.map((d) => d.message)
    });
  }

  req[target] = value;
  next();
};

module.exports = validate;
