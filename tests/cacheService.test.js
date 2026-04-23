const test = require('node:test');
const assert = require('node:assert/strict');

const cacheService = require('../src/services/cacheService');

test('cacheService set/get works with TTL', async () => {
  await cacheService.set('unit:key:1', { ok: true }, 1);
  const value = await cacheService.get('unit:key:1');
  assert.deepEqual(value, { ok: true });
});

test('cacheService expires values after ttl', async () => {
  await cacheService.set('unit:key:expire', { ok: true }, 1);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const value = await cacheService.get('unit:key:expire');
  assert.equal(value, null);
});

test('cacheService delete removes values', async () => {
  await cacheService.set('unit:key:delete', { ok: true }, 5);
  await cacheService.del('unit:key:delete');
  const value = await cacheService.get('unit:key:delete');
  assert.equal(value, null);
});
