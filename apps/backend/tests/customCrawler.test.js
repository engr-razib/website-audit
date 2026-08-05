const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const ExcelJS = require('exceljs');

// Simple helper to make HTTP requests during tests
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

test('Backend Custom Crawler REST API Tests', async (t) => {
  let server;
  const PORT = 3098;
  let xlsxBase64 = '';

  t.before(async () => {
    // Generate a valid mock xlsx base64 template
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Template');
    worksheet.addRow(['Product Title', 'Product Price', 'Image Link']);
    const buffer = await workbook.xlsx.writeBuffer();
    xlsxBase64 = buffer.toString('base64');

    // Start backend server on test port
    process.env.PORT = PORT;
    delete require.cache[require.resolve('../server.js')];
    const instance = require('../server.js');
    server = instance.server;
  });

  t.after(() => {
    if (server) {
      server.close();
    }
  });

  await t.test('POST /api/custom-crawler/parse-headers successfully extracts column names', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/parse-headers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fileBase64: xlsxBase64 });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.headers, ['Product Title', 'Product Price', 'Image Link']);
  });

  await t.test('POST /api/custom-crawler/parse-headers fails when base64 is missing', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/parse-headers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});

    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  await t.test('POST /api/custom-crawler/start requires url, mappings, and excel template', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/start',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      url: 'https://example.com',
      xlsxBase64: xlsxBase64,
      mappings: {
        'Product Title': { selector: 'h1', type: 'text' }
      }
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.jobId);
    assert.ok(res.body.message);
  });

  await t.test('POST /api/custom-crawler/start fails if url is missing', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/start',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      xlsxBase64: xlsxBase64,
      mappings: {}
    });

    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  await t.test('GET /api/custom-crawler/jobs/:jobId returns 404 for invalid jobId', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/jobs/non-existent-id-1234',
      method: 'GET'
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'Crawl job not found');
  });
});
