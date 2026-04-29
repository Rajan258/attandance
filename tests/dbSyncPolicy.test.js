const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeTableName, findMissingTables } = require('../src/models/dbSyncPolicy');

test('normalizeTableName handles sequelize showAllTables variants', () => {
  assert.equal(normalizeTableName('users'), 'users');
  assert.equal(normalizeTableName(['ems', 'users']), 'users');
  assert.equal(normalizeTableName({ tableName: 'refresh_tokens' }), 'refresh_tokens');
});

test('findMissingTables reports only absent required tables', () => {
  const missingTables = findMissingTables(
    ['roles', { tableName: 'users' }, ['ems', 'employees']],
    ['roles', 'users', 'employees', 'refresh_tokens']
  );

  assert.deepEqual(missingTables, ['employees', 'refresh_tokens']);
});
