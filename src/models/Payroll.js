const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payroll = sequelize.define('Payroll', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  employee_id: { type: DataTypes.INTEGER, allowNull: false },

  month: { type: DataTypes.STRING(7), allowNull: false }, // "2025-12"
  present_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  absent_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  paid_leaves: { type: DataTypes.INTEGER, defaultValue: 0 },
  unpaid_leaves: { type: DataTypes.INTEGER, defaultValue: 0 },

  gross_salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  net_salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

  status: { 
    type: DataTypes.ENUM('PENDING', 'PAID'), 
    defaultValue: 'PENDING' 
  }
}, {
  tableName: 'payroll',
  underscored: true
});

module.exports = Payroll;
