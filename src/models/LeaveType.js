const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LeaveType = sequelize.define('LeaveType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },  // SICK, CASUAL...
  name: { type: DataTypes.STRING(100), allowNull: false },
  is_paid: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'leave_types',
  underscored: true
});

module.exports = LeaveType;
