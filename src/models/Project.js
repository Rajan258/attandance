const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
    defaultValue: 'ACTIVE'
  },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY }
}, {
  tableName: 'projects',
  underscored: true
});

module.exports = Project;
