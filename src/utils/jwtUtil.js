const jwt = require('jsonwebtoken');
const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
} = require('../config/config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role_id: user.role_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, role_id: user.role_id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
