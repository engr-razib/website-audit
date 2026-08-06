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

  await t.test('POST /api/custom-crawler/parse-headers restores embedded _CRAWL_CONFIG_ rules and existing data', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Crawled Data');
    ws.addRow(['Item', 'Price']);
    ws.addRow(['Widget A', '$10.00']);
    ws.addRow(['Widget B', '$20.00']);

    const configWs = workbook.addWorksheet('_CRAWL_CONFIG_');
    configWs.addRow(['Column Name', 'CSS Selector', 'Extract Type', 'Attribute Name', 'Domain Overrides']);
    configWs.addRow(['Item', '.item-title', 'text', '', '']);
    configWs.addRow(['Price', '.item-price', 'text', '', JSON.stringify({ 'myshopify.com': '.price-val' })]);
    configWs.addRow(['__URLS__', JSON.stringify(['https://shop.example.com']), 'urls', '', '']);

    const buf = await workbook.xlsx.writeBuffer();
    const b64 = buf.toString('base64');

    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/parse-headers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fileBase64: b64 });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.headers, ['Item', 'Price']);
    assert.equal(res.body.hasConfigSheet, true);
    assert.equal(res.body.existingData.length, 2);
    assert.equal(res.body.existingData[0].Item, 'Widget A');
    assert.equal(res.body.mappings.Item.selector, '.item-title');
    assert.equal(res.body.mappings.Price.domainOverrides['myshopify.com'], '.price-val');
    assert.deepEqual(res.body.savedUrls, ['https://shop.example.com']);
  });

  await t.test('POST /api/custom-crawler/parse-headers extracts Row 1 as headers and Row 2 as selectors', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Template');
    ws.addRow(['Product Name', 'Price Tag', 'Photo']);
    ws.addRow(['h1.title', 'span.amount', 'img.src']);
    ws.addRow(['Laptop', '$999', 'https://example.com/pic.png']);

    const buf = await workbook.xlsx.writeBuffer();
    const b64 = buf.toString('base64');

    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/parse-headers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fileBase64: b64 });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.headers, ['Product Name', 'Price Tag', 'Photo']);
    assert.equal(res.body.mappings['Product Name'].selector, 'h1.title');
    assert.equal(res.body.mappings['Price Tag'].selector, 'span.amount');
    assert.equal(res.body.mappings['Photo'].selector, 'img.src');
    assert.equal(res.body.existingData.length, 1);
    assert.equal(res.body.existingData[0]['Product Name'], 'Laptop');
  });

  await t.test('GET /api/custom-crawler/download-sample-template generates valid Excel binary', async () => {
    const res = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/custom-crawler/download-sample-template',
      method: 'GET'
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('spreadsheetml'));
  });
});
