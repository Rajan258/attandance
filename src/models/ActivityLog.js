const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  task_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },

  action: { type: DataTypes.STRING, allowNull: false },  // e.g. "Status changed", "Comment added"
  meta: { type: DataTypes.JSON },                        // optional: {from: "TODO", to: "IN_PROGRESS"}
}, {
  tableName: 'activity_logs',
  underscored: true
});

module.exports = ActivityLog;
