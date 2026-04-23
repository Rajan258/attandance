const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ImportExportLog = sequelize.define('ImportExportLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('IMPORT', 'EXPORT'), allowNull: false },
  module: { type: DataTypes.STRING(64), allowNull: false },
  status: { type: DataTypes.ENUM('QUEUED', 'SUCCESS', 'FAILED'), allowNull: false, defaultValue: 'SUCCESS' },
  format: { type: DataTypes.STRING(16), allowNull: true },
  filters: { type: DataTypes.JSON, allowNull: true },
  row_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  metadata: { type: DataTypes.JSON, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'import_export_logs',
  underscored: true
});

module.exports = ImportExportLog;
