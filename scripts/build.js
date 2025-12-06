const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'dev';
const configPath = path.join(__dirname, `../config/${env}.json`);

if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log(`Building for environment: ${env} (${config.extension_name})`);

const rootDir = path.join(__dirname, '../');
const distDir = path.join(__dirname, '../.plugin');

let targetDir;

if (env === 'prod') {
    // --- PROD BUILD: Copy to .plugin ---
    targetDir = distDir;
    console.log(`Target: Distribution folder (${targetDir})`);

    // 1. Clean dist dir (preserve screens)
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      files.forEach(file => {
        if (file === 'screens') return; // Skip screens directory
        const curPath = path.join(distDir, file);
        fs.rmSync(curPath, { recursive: true, force: true });
      });
    } else {
      fs.mkdirSync(distDir);
    }

    // 2. Copy files
    const ignoreList = [
      '.git', '.gitignore', '.plugin', 'archive', 'config', 'scripts', 'tests', 
      'node_modules', 'package.json', 'package-lock.json', 'manifest.template.json', 
      'cloud.template.js', 'README.md', 'PRIVACY_POLICY.md', 'PRIVACY_JUSTIFICATIONS.md',
      'manifest.json', 'cloud.js' // Don't copy generated files, we regenerate them
    ];

    function copyRecursive(src, dest) {
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(child => {
          if (!ignoreList.includes(child)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
          }
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    fs.readdirSync(rootDir).forEach(child => {
      if (!ignoreList.includes(child)) {
        copyRecursive(path.join(rootDir, child), path.join(distDir, child));
      }
    });
    console.log('Copied files to .plugin/');

} else {
    // --- DEV BUILD: Update Root ---
    targetDir = rootDir;
    console.log(`Target: Root folder (In-place update)`);
    // No copying needed, just regenerating manifest/cloud.js
}

// 3. Generate manifest.json
const manifestTemplate = fs.readFileSync(path.join(rootDir, 'manifest.template.json'), 'utf8');
let manifest = manifestTemplate
  .replace('{{GOOGLE_CLIENT_ID}}', config.google_client_id)
  .replace('{{EXTENSION_NAME}}', config.extension_name);

fs.writeFileSync(path.join(targetDir, 'manifest.json'), manifest);
console.log('Generated manifest.json');

// 4. Generate cloud.js
const cloudTemplate = fs.readFileSync(path.join(rootDir, 'cloud.template.js'), 'utf8');
let cloud = cloudTemplate
  .replace('{{GOOGLE_CLIENT_ID}}', config.google_client_id)
  .replace('{{GOOGLE_CLIENT_SECRET}}', config.google_client_secret || '')
  .replace('{{GOOGLE_AUTH_METHOD}}', config.google_auth_method);

fs.writeFileSync(path.join(targetDir, 'cloud.js'), cloud);
console.log('Generated cloud.js');

console.log(`\nBuild complete! 🚀`);
if (env === 'prod') {
    console.log('Your release version is ready in: .plugin/');
} else {
    console.log('Your working directory is updated with dev config.');
}
