const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  employee_code: { type: DataTypes.STRING, unique: true },
  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('ACTIVE', 'ON_NOTICE', 'RESIGNED', 'TERMINATED'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'employees',
  underscored: true
});

Employee.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Employee;
