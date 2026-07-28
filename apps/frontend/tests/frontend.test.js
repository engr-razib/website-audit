const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Frontend Project Structure Tests', async (t) => {
  const rootDir = path.join(__dirname, '..');

  await t.test('Verifies key frontend configuration files exist', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'package.json')), 'package.json exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'next.config.js')), 'next.config.js exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'tailwind.config.js')), 'tailwind.config.js exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'tsconfig.json')), 'tsconfig.json exists');
  });

  await t.test('Verifies App Router layout and main page exist', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'layout.tsx')), 'layout.tsx exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'page.tsx')), 'page.tsx exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'globals.css')), 'globals.css exists');
  });

  await t.test('Verifies Shadcn UI & dashboard components exist', () => {
    const compDir = path.join(rootDir, 'src', 'components');
    assert.ok(fs.existsSync(path.join(compDir, 'Navbar.tsx')), 'Navbar.tsx exists');
    assert.ok(fs.existsSync(path.join(compDir, 'QuickScanForm.tsx')), 'QuickScanForm.tsx exists');
    assert.ok(fs.existsSync(path.join(compDir, 'FullAuditForm.tsx')), 'FullAuditForm.tsx exists');
    assert.ok(fs.existsSync(path.join(compDir, 'FontAuditTable.tsx')), 'FontAuditTable.tsx exists');
    assert.ok(fs.existsSync(path.join(compDir, 'ButtonAuditGrid.tsx')), 'ButtonAuditGrid.tsx exists');
    assert.ok(fs.existsSync(path.join(compDir, 'MissingAltTable.tsx')), 'MissingAltTable.tsx exists');
  });
});
