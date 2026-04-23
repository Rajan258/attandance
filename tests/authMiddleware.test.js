const test = require('node:test');
const assert = require('node:assert/strict');

const authMiddleware = require('../src/middlewares/authMiddleware');

test('authMiddleware rejects missing authorization header', () => {
  const req = { headers: {} };
  let statusCode;
  let payload;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    }
  };

  authMiddleware(req, res, () => {});
  assert.equal(statusCode, 401);
  assert.equal(payload.message, 'Authorization header is missing');
});

test('authMiddleware rejects non-bearer authorization header', () => {
  const req = { headers: { authorization: 'Token abc' } };
  let statusCode;
  let payload;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    }
  };

  authMiddleware(req, res, () => {});
  assert.equal(statusCode, 401);
  assert.equal(payload.message, 'Authorization header must use Bearer token format');
});
