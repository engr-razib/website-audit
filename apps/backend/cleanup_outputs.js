const fs = require('fs');
const path = require('path');

const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day)

function cleanOutputs(maxAgeMs = DEFAULT_MAX_AGE_MS, forceAll = false) {
  if (!fs.existsSync(OUTPUTS_DIR)) {
    console.log('[🧹] Outputs directory does not exist.');
    return 0;
  }

  const now = Date.now();
  const items = fs.readdirSync(OUTPUTS_DIR);
  let cleanedCount = 0;

  console.log(`[🧹] Output Cleanup: ${items.length} item(s) found in ${OUTPUTS_DIR}`);

  items.forEach((item) => {
    const itemPath = path.join(OUTPUTS_DIR, item);
    try {
      const stats = fs.statSync(itemPath);
      const ageMs = now - stats.mtimeMs;
      const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(2);

      if (forceAll || ageMs >= maxAgeMs) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`  [✓] Deleted: ${item} (Age: ${ageHours} hrs)`);
        cleanedCount++;
      } else {
        console.log(`  [-] Retained: ${item} (Age: ${ageHours} hrs)`);
      }
    } catch (err) {
      console.error(`  [!] Error removing ${item}:`, err.message);
    }
  });

  console.log(`[🧹] Cleanup complete. Removed ${cleanedCount} item(s).\n`);
  return cleanedCount;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--all') || args.includes('-a');
  
  let maxAgeMs = DEFAULT_MAX_AGE_MS;
  const ageArg = args.find(a => a.startsWith('--max-age-hours='));
  if (ageArg) {
    const hours = parseFloat(ageArg.split('=')[1]);
    if (!isNaN(hours)) {
      maxAgeMs = hours * 60 * 60 * 1000;
    }
  }

  cleanOutputs(maxAgeMs, forceAll);
}

module.exports = { cleanOutputs, OUTPUTS_DIR };
