const normalizeTableName = (table) => {
  if (!table) return '';
  if (typeof table === 'string') return table.toLowerCase();
  if (Array.isArray(table)) return String(table[table.length - 1] || '').toLowerCase();
  if (typeof table === 'object') {
    if (table.tableName) return String(table.tableName).toLowerCase();
    if (table.name) return String(table.name).toLowerCase();
  }

  return String(table).toLowerCase();
};

const findMissingTables = (existingTables, requiredTables) => {
  const existing = new Set((existingTables || []).map(normalizeTableName).filter(Boolean));

  return [...new Set((requiredTables || []).map((table) => String(table).toLowerCase()))]
    .filter((table) => !existing.has(table));
};

module.exports = {
  normalizeTableName,
  findMissingTables
};
