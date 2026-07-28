const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// Simple helper to make HTTP GET/POST requests during tests
function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

test('Backend REST API Tests', async (t) => {
  let server;
  const PORT = 3099;

  t.before(() => {
    // Start backend server on test port
    process.env.PORT = PORT;
    delete require.cache[require.resolve('../server.js')];
    // Require server
    const instance = require('../server.js');
    server = instance.server;
  });

  t.after(() => {
    if (server) {
      server.close();
    }
  });

  await t.test('GET /api/health returns 200 OK and UP status', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'UP');
    assert.equal(res.body.service, 'Website Audit Microservice REST API');
    assert.ok(res.body.timestamp);
  });

  await t.test('POST /api/audit/full requires sitemapUrl', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit/full',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});

    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  await t.test('POST /api/audit/quick-scan requires url', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit/quick-scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});

    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  await t.test('GET /api/audit/jobs/non-existent returns 404', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit/jobs/invalid-job-id-12345',
      method: 'GET'
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'Audit job not found');
  });

  await t.test('POST /api/audit/outputs/cleanup returns 200 OK and status success', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit/outputs/cleanup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { maxAgeHours: 24 });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
    assert.ok(res.body.message);
  });
});

