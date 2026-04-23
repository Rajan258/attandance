const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalaryStructure = sequelize.define('SalaryStructure', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  employee_id: { type: DataTypes.INTEGER, allowNull: false },

  basic: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  hra: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  allowances: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },

  pf: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  esi: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  tds: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },

  effective_from: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'salary_structure',
  underscored: true
});

module.exports = SalaryStructure;
