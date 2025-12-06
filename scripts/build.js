const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist'); // For prod builds
const SRC_DIR = path.join(__dirname, '..'); // Root directory for dev build

const FILES_TO_COPY = [
  'manifest.json', // Manifest is handled specially for dev/prod names
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
  'icons', // This is a directory
  '_locales' // This is a directory
];

function processManifest(manifestPath, env) {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest file not found at ${manifestPath}`);
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (env === 'prod') {
    manifest.name = manifest.name.replace(' (DEV)', '');
  } else { // dev
    if (!manifest.name.includes('(DEV)')) {
      manifest.name += ' (DEV)';
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function build(env) {
  console.log(`Building for ${env}...`);
  
  let currentOutDir;
  let isZipping = false;

  if (env === 'dev') {
    currentOutDir = SRC_DIR; // Dev build directly in root
    // Just modify manifest.json in place
    processManifest(path.join(currentOutDir, 'manifest.json'), 'dev');
    console.log(`Dev configuration applied to ${currentOutDir}`);
    console.log('Dev build complete (unpacked, not zipped).');
    return; // No copying or zipping for dev
  } else if (env === 'prod') {
    currentOutDir = path.join(DIST_DIR, 'prod');
    isZipping = true;
    
    // 1. Clean and create output directory
    if (fs.existsSync(currentOutDir)) {
      fs.rmSync(currentOutDir, { recursive: true, force: true });
    }
    fs.mkdirSync(currentOutDir, { recursive: true });

    // 2. Copy files
    FILES_TO_COPY.forEach(file => {
      const src = path.join(SRC_DIR, file);
      const dest = path.join(currentOutDir, file);
      
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        console.warn(`Warning: ${file} not found.`);
      }
    });

    // 3. Process manifest
    processManifest(path.join(currentOutDir, 'manifest.json'), 'prod');
    console.log(`Files copied to ${currentOutDir}`);

    // 4. Zip the output (only for prod builds, Windows specific using PowerShell)
    if (isZipping) {
      const zipName = `autofill-plugin-${env}.zip`;
      const zipPath = path.join(DIST_DIR, zipName);
      
      // Ensure DIST_DIR exists for zip
      if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR);
      }

      // Remove existing zip if it exists
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      console.log(`Creating ${zipName}...`);
      
      try {
        const absOutDir = path.resolve(currentOutDir);
        const absZipPath = path.resolve(zipPath);
        
        const command = `powershell -Command "Compress-Archive -Path '${absOutDir}\*' -DestinationPath '${absZipPath}' -Force"`;
        
        execSync(command, { stdio: 'inherit' });
        console.log(`Successfully created ${zipName}`);
      } catch (error) {
        console.error(`Failed to zip ${env} build. Ensure PowerShell is available.`);
        console.error(error.message);
      }
    }
  } else {
    console.error('Invalid environment specified. Use "dev" or "prod".');
    return;
  }

  console.log(`Build ${env} complete.`);
}

const args = process.argv.slice(2);
const targetEnv = args[0];

// Ensure dist exists if prod build is chosen or default
if (targetEnv === 'prod' || !targetEnv) {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
  }
}

if (!targetEnv) {
  // Default: Build both (dev unpacked in root, prod zipped in dist)
  build('dev');
  build('prod');
} else {
  build(targetEnv);
}
