const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const SRC_DIR = path.join(__dirname, '..');
const FILES_TO_COPY = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'rules.html',
  'rules.css',
  'rules.js',
  'storage.js',
  'translations.js',
  'pattern-matcher.js',
  'rule-optimizer.js',
  'cloud.js',
  'icons',
  '_locales'
];

function build(env) {
  console.log(`Building for ${env}...`);
  const outDir = path.join(DIST_DIR, env);
  
  // Create clean output directory
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Copy files
  FILES_TO_COPY.forEach(file => {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(outDir, file);
    
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      console.warn(`Warning: ${file} not found.`);
    }
  });

  // Process manifest based on env
  const manifestPath = path.join(outDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (env === 'prod') {
      // Remove 'DEV' suffix from name if present
      manifest.name = manifest.name.replace(' (DEV)', '');
    } else {
      // Ensure DEV suffix
      if (!manifest.name.includes('(DEV)')) {
        manifest.name += ' (DEV)';
      }
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Zip (requires 7-zip or zip installed, or we can skip for now)
  // execSync(`7z a -tzip ${path.join(DIST_DIR, `autofill-plugin-${env}.zip`)} ${outDir}/*`);
  
  console.log(`Build ${env} complete at ${outDir}`);
}

const args = process.argv.slice(2);
const targetEnv = args[0];

// Ensure dist exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

if (!targetEnv) {
  // Default: Build both
  build('dev');
  build('prod');
} else {
  build(targetEnv);
}