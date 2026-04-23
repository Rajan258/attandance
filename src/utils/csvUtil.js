const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (rows, orderedColumns) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    const columns = orderedColumns || [];
    return columns.join(',') + '\n';
  }

  const columns = orderedColumns && orderedColumns.length
    ? orderedColumns
    : Object.keys(rows[0]);

  const header = columns.map(escapeCell).join(',');
  const body = rows
    .map((row) => columns.map((col) => escapeCell(row[col])).join(','))
    .join('\n');

  return `${header}\n${body}\n`;
};

const splitCsvLine = (line) => {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && inQuotes && line[i + 1] === '"') {
      cur += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};

const parseCsv = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? '';
    });
    return row;
  });

  return { headers, rows };
};

module.exports = {
  toCsv,
  parseCsv
};
