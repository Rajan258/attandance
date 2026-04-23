const logger = require('../config/logger');
const { importAttendanceData, getAttendanceImportTemplate } = require('../services/importService');
const { ImportExportLog } = require('../models');

const logImportActivity = async ({
  userId,
  moduleName,
  status,
  rowCount,
  metadata,
  errorMessage
}) => {
  try {
    await ImportExportLog.create({
      user_id: userId,
      type: 'IMPORT',
      module: moduleName,
      status,
      format: 'csv',
      filters: null,
      row_count: rowCount || 0,
      metadata: metadata || null,
      error_message: errorMessage || null
    });
  } catch (err) {
    logger.warn({ message: 'Failed to persist import activity log', error: err.message });
  }
};

exports.downloadAttendanceTemplate = async (req, res) => {
  const csv = getAttendanceImportTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-import-template.csv"');
  return res.send(Buffer.from(csv, 'utf8'));
};

exports.importAttendance = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Import file is required' });
  }

  const content = req.file.buffer.toString('utf8');
  const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
  const fileType = ext === 'json' ? 'json' : 'csv';

  const result = await importAttendanceData({
    content,
    fileType,
    mode: req.body.mode || 'skip',
    dryRun: req.body.dryRun === true || req.body.dryRun === 'true',
    previewOnly: req.body.previewOnly === true || req.body.previewOnly === 'true',
    actorUserId: req.user.id
  });

  logger.info({
    message: 'Attendance import request processed',
    userId: req.user.id,
    mode: req.body.mode || 'skip',
    dryRun: req.body.dryRun === true || req.body.dryRun === 'true',
    previewOnly: req.body.previewOnly === true || req.body.previewOnly === 'true',
    processedRows: result.result?.processedRows || 0
  });

  await logImportActivity({
    userId: req.user.id,
    moduleName: 'attendance',
    status: result.ok ? 'SUCCESS' : 'FAILED',
    rowCount: result.result?.processedRows || 0,
    metadata: {
      mode: req.body.mode || 'skip',
      dryRun: req.body.dryRun === true || req.body.dryRun === 'true',
      previewOnly: req.body.previewOnly === true || req.body.previewOnly === 'true',
      errors: result.errors?.length || 0
    },
    errorMessage: result.ok ? null : 'Import completed with row-level errors'
  });

  return res.json(result);
};

exports.previewAttendanceImport = async (req, res) => {
  req.body.previewOnly = true;
  return exports.importAttendance(req, res);
};
