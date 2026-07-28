const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist-cpanel');

console.log('🚀 Starting cPanel Build Preparation...');

try {
  // 1. Run build to export Next.js static files
  console.log('📦 Building frontend (Next.js static export)...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

  // 2. Clean and create dist-cpanel folder
  if (fs.existsSync(distDir)) {
    console.log('🗑️ Cleaning old dist-cpanel directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'backend'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'frontend'), { recursive: true });

  // 3. Copy backend files
  console.log('📂 Copying backend files...');
  const backendSrc = path.join(rootDir, 'apps', 'backend');
  const backendDest = path.join(distDir, 'backend');

  // Copy server files
  fs.copyFileSync(path.join(backendSrc, 'server.js'), path.join(backendDest, 'server.js'));
  fs.copyFileSync(path.join(backendSrc, 'cleanup_outputs.js'), path.join(backendDest, 'cleanup_outputs.js'));
  fs.copyFileSync(path.join(backendSrc, 'package.json'), path.join(backendDest, 'package.json'));

  // Copy services directory recursively
  fs.cpSync(path.join(backendSrc, 'services'), path.join(backendDest, 'services'), { recursive: true });

  // 4. Copy frontend files
  console.log('📂 Copying frontend static build...');
  const frontendSrc = path.join(rootDir, 'apps', 'frontend', 'out');
  const frontendDest = path.join(distDir, 'frontend');
  fs.cpSync(frontendSrc, frontendDest, { recursive: true });

  console.log('\n✅ Build completed successfully!');
  console.log(`📁 Deployment files are ready in: ${distDir}`);
  console.log('   - backend/: Zip this folder and upload to your cPanel Node.js Application root.');
  console.log('   - frontend/: Upload these files directly to your cPanel public_html directory.\n');

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
