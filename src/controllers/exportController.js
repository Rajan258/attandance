const logger = require('../config/logger');
const { exportData, EXPORT_TEMPLATES } = require('../services/exportService');
const exportJobService = require('../services/exportJobService');
const { ImportExportLog, User } = require('../models');

const parseColumns = (columnsString) =>
  columnsString
    ? columnsString.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

const buildExportRequestFromQuery = (query) => ({
  scope: query.scope,
  format: query.format || 'csv',
  filters: {
    from: query.from,
    to: query.to,
    month: query.month,
    year: query.year,
    employee_id: query.employee_id,
    department: query.department,
    employee_status: query.employee_status,
    role: query.role,
    attendance_status: query.attendance_status,
    leave_status: query.leave_status,
    payroll_month: query.payroll_month,
    payroll_status: query.payroll_status,
    project_status: query.project_status,
    user_id: query.user_id
  },
  columns: parseColumns(query.columns),
  groupBy: query.group_by || null,
  template: query.template || null
});

const logExportActivity = async ({ userId, scope, format, filters, status, rowCount, metadata, errorMessage }) => {
  try {
    await ImportExportLog.create({
      user_id: userId,
      type: 'EXPORT',
      module: scope,
      status,
      format,
      filters,
      row_count: rowCount || 0,
      metadata: metadata || null,
      error_message: errorMessage || null
    });
  } catch (err) {
    logger.warn({ message: 'Failed to persist export activity log', error: err.message });
  }
};

exports.getExportTemplatesHandler = async (req, res) => {
  return res.json({
    templates: Object.entries(EXPORT_TEMPLATES).map(([key, val]) => ({
      key,
      ...val
    }))
  });
};

exports.exportDataHandler = async (req, res) => {
  const payload = buildExportRequestFromQuery(req.query);

  if (req.query.async) {
    const job = exportJobService.createJob({
      userId: req.user.id,
      scope: payload.scope,
      format: payload.format,
      filters: payload.filters
    });

    setImmediate(async () => {
      try {
        const output = await exportData(payload);
        exportJobService.completeJob(job.id, {
          fileName: `${payload.scope}-export-${Date.now()}.${output.fileExt}`,
          mimeType: output.mimeType,
          buffer: output.buffer,
          rowCount: output.rowCount
        });
        await logExportActivity({
          userId: req.user.id,
          scope: payload.scope,
          format: payload.format,
          filters: payload.filters,
          status: 'SUCCESS',
          rowCount: output.rowCount,
          metadata: { async: true, jobId: job.id }
        });
      } catch (err) {
        exportJobService.failJob(job.id, err);
        await logExportActivity({
          userId: req.user.id,
          scope: payload.scope,
          format: payload.format,
          filters: payload.filters,
          status: 'FAILED',
          rowCount: 0,
          metadata: { async: true, jobId: job.id },
          errorMessage: err.message
        });
      }
    });

    return res.status(202).json({
      message: 'Export job queued',
      jobId: job.id,
      status: job.status
    });
  }

  const output = await exportData(payload);
  const fileName = `${payload.scope}-export-${Date.now()}.${output.fileExt}`;

  logger.info({
    message: 'Export downloaded',
    userId: req.user.id,
    fileName,
    scope: payload.scope,
    format: payload.format,
    rowCount: output.rowCount
  });
  await logExportActivity({
    userId: req.user.id,
    scope: payload.scope,
    format: payload.format,
    filters: payload.filters,
    status: 'SUCCESS',
    rowCount: output.rowCount,
    metadata: { async: false }
  });

  res.setHeader('Content-Type', output.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.send(output.buffer);
};

exports.getExportJobHandler = async (req, res) => {
  const job = exportJobService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Export job not found' });
  }

  if (job.status !== 'completed') {
    return res.json({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      rowCount: job.rowCount,
      error: job.error
    });
  }

  const buffer = Buffer.from(job.payloadBase64, 'base64');
  res.setHeader('Content-Type', job.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
  return res.send(buffer);
};

exports.getImportExportLogsHandler = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.type) where.type = req.query.type;
  if (req.query.module) where.module = req.query.module;
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await ImportExportLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['email'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return res.json({
    data: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  });
};
