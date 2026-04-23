const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Employee = require('./Employee');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  punch_in: { type: DataTypes.DATE, allowNull: true },
  punch_out: { type: DataTypes.DATE, allowNull: true },
  late_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
  early_exit_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
  total_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: true }
}, {
  tableName: 'attendance_logs',
  underscored: true
});

AttendanceLog.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = AttendanceLog;
