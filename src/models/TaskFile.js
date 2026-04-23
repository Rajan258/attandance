const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TaskFile = sequelize.define('TaskFile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  task_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },

  filename: { type: DataTypes.STRING, allowNull: false },
  original_name: { type: DataTypes.STRING, allowNull: false },
  file_type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER }
}, {
  tableName: 'task_files',
  underscored: true
});

module.exports = TaskFile;
