const { comparePassword, hashPassword } = require('../utils/passwordUtil');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtil');
const { User, RefreshToken } = require('../models');
const jwt = require('jsonwebtoken');
const { JWT_REFRESH_SECRET } = require('../config/config');

const updatePasswordAndInvalidateSessions = async (user, newPassword) => {
  const password_hash = await hashPassword(newPassword);
  await user.update({ password_hash });
  await RefreshToken.destroy({ where: { user_id: user.id } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role_id: Number(user.role_id) }
  });
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  const stored = await RefreshToken.findOne({ where: { token } });
  if (!stored) return res.status(401).json({ message: 'Invalid refresh token' });

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccessToken = generateAccessToken(user);
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

exports.logout = async (req, res) => {
  const { token } = req.body;
  if (token) {
    await RefreshToken.destroy({ where: { token } });
  }
  res.json({ message: 'Logged out' });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user || !user.is_active) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await comparePassword(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  await updatePasswordAndInvalidateSessions(user, newPassword);

  return res.json({ message: 'Password updated successfully. Please login again.' });
};

exports.forgotPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) {
    return res.status(404).json({ message: 'No active user found with this email' });
  }
  if (user.role_id === 1) {
    return res.status(403).json({ message: 'Admin password cannot be reset from this endpoint' });
  }

  await updatePasswordAndInvalidateSessions(user, newPassword);

  return res.json({ message: 'Password reset successful. Please login with your new password.' });
};
