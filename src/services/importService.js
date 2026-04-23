const { AttendanceLog, Employee } = require('../models');
const logger = require('../config/logger');
const { parseCsv, toCsv } = require('../utils/csvUtil');

const ATTENDANCE_TEMPLATE_HEADERS = [
  'employee_code',
  'date',
  'punch_in',
  'punch_out',
  'attendance_status'
];

const normalizeDate = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
};

const normalizeDateTime = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const validateHeaders = (headers) => {
  const missing = ATTENDANCE_TEMPLATE_HEADERS.filter((h) => !headers.includes(h));
  return {
    valid: missing.length === 0,
    missing
  };
};

const mapAttendanceRows = async (rows) => {
  const errors = [];
  const normalized = [];
  const employeeCodes = [...new Set(rows.map((r) => r.employee_code).filter(Boolean))];
  const employees = await Employee.findAll({ where: { employee_code: employeeCodes } });
  const byCode = new Map(employees.map((e) => [e.employee_code, e]));

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const employee = byCode.get(row.employee_code);
    if (!employee) {
      errors.push({ line, reason: `Unknown employee_code: ${row.employee_code}` });
      return;
    }

    const date = normalizeDate(row.date);
    if (!date) {
      errors.push({ line, reason: `Invalid date: ${row.date}` });
      return;
    }

    const punchIn = normalizeDateTime(row.punch_in);
    const punchOut = normalizeDateTime(row.punch_out);
    if (row.punch_in && !punchIn) {
      errors.push({ line, reason: `Invalid punch_in datetime: ${row.punch_in}` });
      return;
    }
    if (row.punch_out && !punchOut) {
      errors.push({ line, reason: `Invalid punch_out datetime: ${row.punch_out}` });
      return;
    }

    normalized.push({
      line,
      employee_id: employee.id,
      employee_code: employee.employee_code,
      date,
      punch_in: punchIn,
      punch_out: punchOut,
      attendance_status: row.attendance_status || null
    });
  });

  return { normalized, errors };
};

const detectFileDuplicates = (rows) => {
  const seen = new Set();
  const duplicates = [];
  rows.forEach((row) => {
    const key = `${row.employee_id}:${row.date}`;
    if (seen.has(key)) duplicates.push({ line: row.line, reason: 'Duplicate row in file (employee_id + date)' });
    seen.add(key);
  });
  return duplicates;
};

const importAttendanceData = async ({
  content,
  fileType = 'csv',
  mode = 'skip',
  dryRun = false,
  previewOnly = false,
  actorUserId = null
}) => {
  let parsed;
  if (fileType === 'json') {
    const data = JSON.parse(content);
    parsed = {
      headers: ATTENDANCE_TEMPLATE_HEADERS,
      rows: Array.isArray(data) ? data : []
    };
  } else {
    parsed = parseCsv(content);
  }

  const headerCheck = validateHeaders(parsed.headers);
  if (!headerCheck.valid) {
    return {
      ok: false,
      headerValidation: headerCheck,
      preview: [],
      result: null,
      errors: headerCheck.missing.map((h) => ({ line: 1, reason: `Missing required header: ${h}` }))
    };
  }

  const { normalized, errors } = await mapAttendanceRows(parsed.rows);
  const fileDuplicateErrors = detectFileDuplicates(normalized);
  const allErrors = [...errors, ...fileDuplicateErrors];

  const preview = normalized.slice(0, 50);
  if (previewOnly || dryRun) {
    return {
      ok: allErrors.length === 0,
      headerValidation: headerCheck,
      preview,
      result: {
        processedRows: normalized.length,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failed: allErrors.length
      },
      errors: allErrors
    };
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const runtimeErrors = [...allErrors];

  for (const row of normalized) {
    if (allErrors.find((e) => e.line === row.line)) continue;
    const existing = await AttendanceLog.findOne({
      where: { employee_id: row.employee_id, date: row.date }
    });

    if (!existing) {
      await AttendanceLog.create({
        employee_id: row.employee_id,
        date: row.date,
        punch_in: row.punch_in,
        punch_out: row.punch_out
      });
      inserted += 1;
      continue;
    }

    if (mode === 'skip') {
      skipped += 1;
      continue;
    }

    if (mode === 'fail') {
      runtimeErrors.push({
        line: row.line,
        reason: `Duplicate attendance exists for employee_code=${row.employee_code} and date=${row.date}`
      });
      continue;
    }

    // mode === update
    await existing.update({
      punch_in: row.punch_in,
      punch_out: row.punch_out
    });
    updated += 1;
  }

  logger.info({
    message: 'Attendance import completed',
    actorUserId,
    mode,
    inserted,
    updated,
    skipped,
    failed: runtimeErrors.length,
    processedRows: normalized.length
  });

  return {
    ok: runtimeErrors.length === 0,
    headerValidation: headerCheck,
    preview,
    result: {
      processedRows: normalized.length,
      inserted,
      updated,
      skipped,
      failed: runtimeErrors.length
    },
    errors: runtimeErrors
  };
};

const getAttendanceImportTemplate = () =>
  toCsv([], ATTENDANCE_TEMPLATE_HEADERS);

module.exports = {
  importAttendanceData,
  getAttendanceImportTemplate,
  ATTENDANCE_TEMPLATE_HEADERS
};
