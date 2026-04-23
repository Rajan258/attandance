const test = require('node:test');
const assert = require('node:assert/strict');

const { toCsv, parseCsv } = require('../src/utils/csvUtil');

test('toCsv generates headers and rows', () => {
  const csv = toCsv([
    { a: 1, b: 'x' },
    { a: 2, b: 'y' }
  ], ['a', 'b']);

  assert.ok(csv.startsWith('a,b'));
  assert.ok(csv.includes('1,x'));
  assert.ok(csv.includes('2,y'));
});

test('parseCsv parses quoted values', () => {
  const input = 'name,remark\n"Rajan","Hello, world"\n';
  const out = parseCsv(input);

  assert.deepEqual(out.headers, ['name', 'remark']);
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].name, 'Rajan');
  assert.equal(out.rows[0].remark, 'Hello, world');
});
