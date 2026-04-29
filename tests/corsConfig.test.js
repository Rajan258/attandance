const test = require('node:test');
const assert = require('node:assert/strict');

const { parseAllowedOrigins, isOriginAllowed } = require('../src/config/cors');

test('parseAllowedOrigins accepts urls, hosts and trims path noise', () => {
  const origins = parseAllowedOrigins(' https://attendance.altido.co/ , attendance.altido.co/login , http://localhost:5173 ');

  assert.deepEqual(origins, [
    {
      raw: 'https://attendance.altido.co/',
      origin: 'https://attendance.altido.co',
      host: 'attendance.altido.co'
    },
    {
      raw: 'attendance.altido.co/login',
      origin: null,
      host: 'attendance.altido.co'
    },
    {
      raw: 'http://localhost:5173',
      origin: 'http://localhost:5173',
      host: 'localhost:5173'
    }
  ]);
});

test('isOriginAllowed matches exact origin and same host with different scheme', () => {
  const allowedOrigins = parseAllowedOrigins('https://attendance.altido.co,localhost:5173');

  assert.equal(isOriginAllowed('https://attendance.altido.co', allowedOrigins), true);
  assert.equal(isOriginAllowed('http://attendance.altido.co', allowedOrigins), true);
  assert.equal(isOriginAllowed('http://localhost:5173', allowedOrigins), true);
  assert.equal(isOriginAllowed('http://evil.example.com', allowedOrigins), false);
});
