const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(8).required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema
};
