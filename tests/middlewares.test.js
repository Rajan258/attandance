const test = require('node:test');
const assert = require('node:assert/strict');
const Joi = require('joi');

const asyncHandler = require('../src/middlewares/asyncHandler');
const validate = require('../src/middlewares/validateMiddleware');

test('asyncHandler forwards rejected promise to next', async () => {
  const err = new Error('boom');
  const wrapped = asyncHandler(async () => {
    throw err;
  });

  await new Promise((resolve) => {
    wrapped({}, {}, (received) => {
      assert.equal(received, err);
      resolve();
    });
  });
});

test('validate returns 400 with details on invalid payload', () => {
  const middleware = validate(Joi.object({ name: Joi.string().required() }));
  const req = { body: {} };
  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    }
  };

  middleware(req, res, () => {});

  assert.equal(statusCode, 400);
  assert.equal(responseBody.message, 'Validation failed');
  assert.ok(Array.isArray(responseBody.details));
  assert.ok(responseBody.details.length > 0);
});

test('validate sanitizes payload by stripping unknown keys', () => {
  const middleware = validate(Joi.object({ id: Joi.number().required() }), 'params');
  const req = { params: { id: 12, extra: 'remove-me' } };

  middleware(req, {}, () => {});

  assert.deepEqual(req.params, { id: 12 });
});
