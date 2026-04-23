const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: {
    type: DataTypes.ENUM('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'),
    allowNull: false
  }
}, {
  tableName: 'roles',
  underscored: true
});

module.exports = Role;
