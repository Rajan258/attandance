const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const {
  Employee,
  User,
  Role,
  AttendanceLog,
  Leave,
  LeaveType,
  Payroll,
  Project,
  Task,
  ActivityLog
} = require('../models');
const logger = require('../config/logger');
const { toCsv } = require('../utils/csvUtil');

const EXPORT_SCOPES = {
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  LEAVES: 'leaves',
  PAYROLL: 'payroll',
  PROJECTS_TASKS: 'projects_tasks',
  AUDIT_LOGS: 'audit_logs'
};

const EXPORT_TEMPLATES = {
  monthly_attendance: {
    scope: EXPORT_SCOPES.ATTENDANCE,
    groupBy: 'employee',
    columns: ['employee_code', 'employee_name', 'date', 'punch_in', 'punch_out', 'total_hours']
  },
  yearly_payroll: {
    scope: EXPORT_SCOPES.PAYROLL,
    groupBy: 'employee',
    columns: ['employee_code', 'employee_name', 'month', 'gross_salary', 'total_deductions', 'net_salary', 'status']
  }
};

const resolveDateWindow = (filters = {}) => {
  if (filters.from || filters.to) {
    return {
      from: filters.from || null,
      to: filters.to || null
    };
  }
  if (filters.year) {
    const mm = filters.month ? String(filters.month).padStart(2, '0') : null;
    if (mm) {
      return {
        from: `${filters.year}-${mm}-01`,
        to: `${filters.year}-${mm}-31`
      };
    }
    return {
      from: `${filters.year}-01-01`,
      to: `${filters.year}-12-31`
    };
  }
  return { from: null, to: null };
};

const parseDateRangeFilter = (filters, fieldFrom, fieldTo = fieldFrom) => {
  const { from, to } = resolveDateWindow(filters);
  const where = {};
  if (from || to) {
    where[fieldFrom] = {};
    if (from) where[fieldFrom][Op.gte] = from;
    if (to) where[fieldFrom][Op.lte] = to;
    if (fieldTo !== fieldFrom) {
      where[fieldTo] = {};
      if (from) where[fieldTo][Op.gte] = from;
      if (to) where[fieldTo][Op.lte] = to;
    }
  }
  return where;
};

const normalizeRow = (row) => {
  if (!row) return row;
  return JSON.parse(JSON.stringify(row));
};

const flattenRecords = (scope, records) => {
  if (scope === EXPORT_SCOPES.EMPLOYEES) {
    return records.map((emp) => ({
      employee_id: emp.id,
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      status: emp.status,
      email: emp.User?.email || null,
      role: emp.User?.Role?.name || null
    }));
  }

  if (scope === EXPORT_SCOPES.ATTENDANCE) {
    return records.map((log) => ({
      attendance_id: log.id,
      employee_id: log.employee_id,
      employee_code: log.Employee?.employee_code || null,
      employee_name: `${log.Employee?.first_name || ''} ${log.Employee?.last_name || ''}`.trim(),
      date: log.date,
      punch_in: log.punch_in,
      punch_out: log.punch_out,
      total_hours: log.total_hours,
      late_flag: log.late_flag,
      early_exit_flag: log.early_exit_flag
    }));
  }

  if (scope === EXPORT_SCOPES.LEAVES) {
    return records.map((lv) => ({
      leave_id: lv.id,
      employee_id: lv.employee_id,
      employee_code: lv.employee?.employee_code || null,
      employee_name: `${lv.employee?.first_name || ''} ${lv.employee?.last_name || ''}`.trim(),
      leave_type: lv.leaveType?.name || null,
      leave_code: lv.leaveType?.code || null,
      start_date: lv.start_date,
      end_date: lv.end_date,
      days: lv.days,
      status: lv.status,
      reason: lv.reason
    }));
  }

  if (scope === EXPORT_SCOPES.PAYROLL) {
    return records.map((pr) => ({
      payroll_id: pr.id,
      employee_id: pr.employee_id,
      employee_code: pr.employee?.employee_code || null,
      employee_name: `${pr.employee?.first_name || ''} ${pr.employee?.last_name || ''}`.trim(),
      month: pr.month,
      present_days: pr.present_days,
      absent_days: pr.absent_days,
      paid_leaves: pr.paid_leaves,
      unpaid_leaves: pr.unpaid_leaves,
      gross_salary: pr.gross_salary,
      total_deductions: pr.total_deductions,
      net_salary: pr.net_salary,
      status: pr.status
    }));
  }

  if (scope === EXPORT_SCOPES.PROJECTS_TASKS) {
    const out = [];
    records.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        out.push({
          project_id: project.id,
          project_name: project.name,
          project_status: project.status,
          task_id: task.id,
          task_title: task.title,
          task_status: task.status,
          task_priority: task.priority,
          task_deadline: task.deadline,
          assigned_employee_id: task.employee?.id || null,
          assigned_employee_name: `${task.employee?.first_name || ''} ${task.employee?.last_name || ''}`.trim()
        });
      });
    });
    return out;
  }

  if (scope === EXPORT_SCOPES.AUDIT_LOGS) {
    return records.map((log) => ({
      id: log.id,
      task_id: log.task_id,
      user_id: log.user_id,
      action: log.action,
      meta: log.meta,
      created_at: log.createdAt
    }));
  }

  return records.map(normalizeRow);
};

const applyColumnSelection = (rows, columns) => {
  if (!columns || !columns.length) return rows;
  return rows.map((row) => {
    const pruned = {};
    columns.forEach((col) => { pruned[col] = row[col]; });
    return pruned;
  });
};

const groupRows = (rows, groupBy) => {
  if (!groupBy) return rows;
  const keyMap = {
    employee: 'employee_name',
    date: 'date',
    department: 'department'
  };
  const keyField = keyMap[groupBy];
  if (!keyField) return rows;

  return rows.reduce((acc, row) => {
    const key = row[keyField] || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
};

const calculateAggregates = (scope, rows) => {
  if (scope === EXPORT_SCOPES.ATTENDANCE) {
    return {
      total_rows: rows.length,
      total_present: rows.filter((r) => r.punch_in).length,
      total_leave_marked: rows.filter((r) => !r.punch_in && !r.punch_out).length,
      total_hours_sum: rows.reduce((sum, r) => sum + Number(r.total_hours || 0), 0)
    };
  }

  if (scope === EXPORT_SCOPES.LEAVES) {
    return {
      total_rows: rows.length,
      total_days: rows.reduce((sum, r) => sum + Number(r.days || 0), 0),
      approved_count: rows.filter((r) => r.status === 'APPROVED').length
    };
  }

  if (scope === EXPORT_SCOPES.PAYROLL) {
    return {
      total_rows: rows.length,
      net_pay_total: rows.reduce((sum, r) => sum + Number(r.net_salary || 0), 0),
      gross_pay_total: rows.reduce((sum, r) => sum + Number(r.gross_salary || 0), 0)
    };
  }

  return { total_rows: rows.length };
};

const buildQueryByScope = (scope, filters) => {
  if (scope === EXPORT_SCOPES.EMPLOYEES) {
    const where = {};
    if (filters.employee_status) where.status = filters.employee_status;
    if (filters.employee_id) where.id = filters.employee_id;
    const userInclude = { model: User, include: [Role] };
    if (filters.role) {
      userInclude.include = [{ model: Role, where: { name: filters.role } }];
      userInclude.required = true;
    }

    return {
      model: Employee,
      query: {
        where,
        include: [userInclude],
        order: [['employee_code', 'ASC']]
      }
    };
  }

  if (scope === EXPORT_SCOPES.ATTENDANCE) {
    const where = {};
    if (filters.employee_id) where.employee_id = filters.employee_id;
    const dateWindow = resolveDateWindow(filters);
    if (dateWindow.from || dateWindow.to) {
      where.date = {};
      if (dateWindow.from) where.date[Op.gte] = dateWindow.from;
      if (dateWindow.to) where.date[Op.lte] = dateWindow.to;
    }
    if (filters.attendance_status === 'Present') {
      where.punch_in = { [Op.ne]: null };
    } else if (filters.attendance_status === 'WO') {
      where.punch_in = null;
      where.punch_out = null;
    } else if (filters.attendance_status === 'Half day') {
      where.total_hours = { [Op.lt]: 5 };
    }
    return {
      model: AttendanceLog,
      query: {
        where,
        include: [{ model: Employee }],
        order: [['date', 'ASC']]
      }
    };
  }

  if (scope === EXPORT_SCOPES.LEAVES) {
    const where = {};
    if (filters.leave_status) where.status = filters.leave_status;
    if (filters.employee_id) where.employee_id = filters.employee_id;
    Object.assign(where, parseDateRangeFilter(filters, 'start_date', 'end_date'));
    return {
      model: Leave,
      query: {
        where,
        include: [
          { model: LeaveType, as: 'leaveType' },
          { model: Employee, as: 'employee' }
        ],
        order: [['start_date', 'ASC']]
      }
    };
  }

  if (scope === EXPORT_SCOPES.PAYROLL) {
    const where = {};
    if (filters.employee_id) where.employee_id = filters.employee_id;
    if (filters.payroll_status) where.status = filters.payroll_status;
    if (filters.payroll_month) where.month = filters.payroll_month;
    if (filters.year && !filters.payroll_month) where.month = { [Op.like]: `${filters.year}-%` };
    return {
      model: Payroll,
      query: {
        where,
        include: [{ model: Employee, as: 'employee' }],
        order: [['month', 'ASC']]
      }
    };
  }

  if (scope === EXPORT_SCOPES.PROJECTS_TASKS) {
    const where = {};
    if (filters.project_status) where.status = filters.project_status;
    return {
      model: Project,
      query: {
        where,
        include: [{ model: Task, as: 'tasks', include: [{ model: Employee, as: 'employee' }] }],
        order: [['name', 'ASC']]
      }
    };
  }

  if (scope === EXPORT_SCOPES.AUDIT_LOGS) {
    const where = {};
    if (filters.user_id) where.user_id = filters.user_id;
    const dateWindow = resolveDateWindow(filters);
    if (dateWindow.from || dateWindow.to) {
      where.createdAt = {};
      if (dateWindow.from) where.createdAt[Op.gte] = new Date(`${dateWindow.from}T00:00:00Z`);
      if (dateWindow.to) where.createdAt[Op.lte] = new Date(`${dateWindow.to}T23:59:59Z`);
    }
    return {
      model: ActivityLog,
      query: {
        where,
        order: [['createdAt', 'DESC']]
      }
    };
  }

  const err = new Error(`Unsupported export scope: ${scope}`);
  err.statusCode = 400;
  throw err;
};

const renderPdfSummary = ({ scope, rows, filters, aggregates }) => {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(18).text('EMS Export Summary', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12).text(`Scope: ${scope}`);
  doc.text(`Generated At: ${new Date().toISOString()}`);
  doc.text(`Total Rows: ${rows.length}`);
  doc.moveDown(0.5);

  doc.fontSize(13).text('Filters', { underline: true });
  Object.entries(filters || {}).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      doc.fontSize(11).text(`${key}: ${val}`);
    }
  });
  doc.moveDown(0.5);

  doc.fontSize(13).text('Aggregates', { underline: true });
  Object.entries(aggregates || {}).forEach(([key, val]) => {
    doc.fontSize(11).text(`${key}: ${val}`);
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const renderXlsx = async ({ rows, columns }) => {
  try {
    // Optional dependency. Install with: npm i exceljs
    // eslint-disable-next-line global-require
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Export');
    const selectedCols = columns && columns.length ? columns : Object.keys(rows[0] || {});
    sheet.columns = selectedCols.map((key) => ({ header: key, key }));
    rows.forEach((row) => sheet.addRow(row));
    return workbook.xlsx.writeBuffer();
  } catch (err) {
    const e = new Error('XLSX export requires optional dependency "exceljs". Run: npm i exceljs');
    e.statusCode = 501;
    throw e;
  }
};

/**
 * exportData is the main reusable export function.
 * It supports filters, templates, grouping, aggregates and output formats.
 */
const exportData = async ({
  scope,
  format = 'csv',
  filters = {},
  columns = [],
  groupBy = null,
  template = null
}) => {
  const effectiveTemplate = template ? EXPORT_TEMPLATES[template] : null;
  if (template && !effectiveTemplate) {
    const err = new Error(`Unknown export template: ${template}`);
    err.statusCode = 400;
    throw err;
  }

  const effectiveScope = effectiveTemplate?.scope || scope;
  const effectiveColumns = effectiveTemplate?.columns || columns;
  const effectiveGroupBy = effectiveTemplate?.groupBy || groupBy;

  const query = buildQueryByScope(effectiveScope, filters);
  const rawRecords = await query.model.findAll(query.query);
  const normalized = flattenRecords(effectiveScope, rawRecords.map(normalizeRow));
  const selected = applyColumnSelection(normalized, effectiveColumns);
  const aggregates = calculateAggregates(effectiveScope, selected);
  const grouped = groupRows(selected, effectiveGroupBy);

  logger.info({
    message: 'Export generated',
    scope: effectiveScope,
    format,
    rowCount: selected.length,
    filters
  });

  if (format === 'json') {
    const payload = {
      scope: effectiveScope,
      filters,
      aggregates,
      groupedBy: effectiveGroupBy,
      data: grouped
    };
    return {
      mimeType: 'application/json',
      fileExt: 'json',
      buffer: Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
      rowCount: selected.length
    };
  }

  if (format === 'csv') {
    const csvRows = Array.isArray(grouped) ? grouped : Object.entries(grouped).flatMap(([group, rows]) =>
      rows.map((row) => ({ group, ...row }))
    );
    const csv = toCsv(csvRows, csvRows[0] ? Object.keys(csvRows[0]) : effectiveColumns);
    return {
      mimeType: 'text/csv',
      fileExt: 'csv',
      buffer: Buffer.from(csv, 'utf8'),
      rowCount: selected.length
    };
  }

  if (format === 'pdf') {
    const buffer = await renderPdfSummary({
      scope: effectiveScope,
      rows: selected,
      filters,
      aggregates
    });
    return {
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      buffer,
      rowCount: selected.length
    };
  }

  if (format === 'xlsx') {
    const buffer = await renderXlsx({ rows: selected, columns: effectiveColumns });
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExt: 'xlsx',
      buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      rowCount: selected.length
    };
  }

  const err = new Error(`Unsupported export format: ${format}`);
  err.statusCode = 400;
  throw err;
};

module.exports = {
  exportData,
  EXPORT_SCOPES,
  EXPORT_TEMPLATES
};
