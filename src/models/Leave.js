const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Leave = sequelize.define('Leave', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  leave_type_id: { type: DataTypes.INTEGER, allowNull: false },

  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },

  days: { type: DataTypes.DECIMAL(4, 1), allowNull: false },   // 0.5, 1, 2 etc.
  reason: { type: DataTypes.TEXT, allowNull: true },

  // PENDING / APPROVED / REJECTED / CANCELLED
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },

  approved_by_id: { type: DataTypes.INTEGER, allowNull: true }, // user_id of manager/HR
  approved_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'leaves',
  underscored: true
});

module.exports = Leave;
