const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const targets = [
  path.join(rootDir, 'apps', 'frontend', '.next', 'cache'),
  path.join(rootDir, '_next'),
  path.join(rootDir, '.turbo'),
  path.join(rootDir, 'apps', 'frontend', '.turbo'),
  path.join(rootDir, 'apps', 'backend', '.turbo'),
];

console.log('🧹 Cleaning cache and build folders...');

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    console.log(`🗑️ Removing ${path.relative(rootDir, target)}...`);
    try {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`✅ Successfully removed ${path.relative(rootDir, target)}`);
    } catch (err) {
      console.error(`❌ Failed to remove ${path.relative(rootDir, target)}:`, err.message);
    }
  } else {
    console.log(`📁 ${path.relative(rootDir, target)} does not exist, skipping.`);
  }
});

console.log('✨ Clean operation finished.\n');
