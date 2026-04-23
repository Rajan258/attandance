const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const app = require('../src/app');

let server;
let baseUrl;
let skipIntegration = false;
let skipReason = '';

test.before(async () => {
  server = http.createServer(app);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  } catch (err) {
    skipIntegration = true;
    skipReason = `Skipping integration tests: ${err.code || err.message}`;
  }
});

test.after(async () => {
  if (server && server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/health returns service status', async (t) => {
  if (skipIntegration) return t.skip(skipReason);

  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
  assert.ok(data.timestamp);
});

test('GET /api/dashboard/overview without token is unauthorized', async (t) => {
  if (skipIntegration) return t.skip(skipReason);

  const res = await fetch(`${baseUrl}/api/dashboard/overview`);
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.equal(data.message, 'Authorization header is missing');
});
