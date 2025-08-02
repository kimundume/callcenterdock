const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Starting build process...');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
const distDataDir = path.join(distDir, 'data');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Created dist directory');
}

if (!fs.existsSync(distDataDir)) {
  fs.mkdirSync(distDataDir, { recursive: true });
  console.log('✓ Created dist/data directory');
}

// Run TypeScript compilation
console.log('📝 Compiling TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✓ TypeScript compilation completed');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Verify required files exist
const requiredFiles = [
  'dist/data/persistentStorage.js',
  'dist/sockets/signaling.js',
  'dist/server.js'
];

console.log('🔍 Verifying build output...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.error(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

// If persistentStorage.js is missing, create it manually
if (!fs.existsSync(path.join(__dirname, 'dist/data/persistentStorage.js'))) {
  console.log('⚠️  persistentStorage.js not found, creating manually...');
  
  const sourcePath = path.join(__dirname, 'src/data/persistentStorage.ts');
  const targetPath = path.join(__dirname, 'dist/data/persistentStorage.js');
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Convert TypeScript to JavaScript
    content = content
      .replace(/import.*from.*['"]/g, 'const ')
      .replace(/export /g, '')
      .replace(/const /g, 'var ')
      .replace(/interface.*{[\s\S]*?}/g, '')
      .replace(/type.*=.*;/g, '')
      .replace(/declare global.*{[\s\S]*?}/g, '');
    
    fs.writeFileSync(targetPath, content);
    console.log('✓ persistentStorage.js created manually');
  } else {
    console.error('❌ Source file not found:', sourcePath);
    process.exit(1);
  }
}

if (allFilesExist) {
  console.log('🎉 Build completed successfully!');
} else {
  console.error('❌ Build verification failed');
  process.exit(1);
} 