const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'refresh_tokens',
  underscored: true
});

RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = RefreshToken;
