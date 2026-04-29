const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./Role');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role_id: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'users',
  underscored: true
});

// Keep the application-level association without forcing MySQL to recreate
// a foreign-key constraint on messy legacy/shared schemas during startup sync.
User.belongsTo(Role, { foreignKey: 'role_id', constraints: false });

module.exports = User;
