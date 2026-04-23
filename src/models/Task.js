const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  project_id: { type: DataTypes.INTEGER, allowNull: false },
  assigned_to: { type: DataTypes.INTEGER, allowNull: false }, // employee_id

  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },

  deadline: { type: DataTypes.DATEONLY },

  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    defaultValue: 'MEDIUM'
  },

  status: {
    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'TODO'
  }
}, {
  tableName: 'tasks',
  underscored: true
});

module.exports = Task;
