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

// If persistentStorage.js is missing, create it manually using tsc for just this file
if (!fs.existsSync(path.join(__dirname, 'dist/data/persistentStorage.js'))) {
  console.log('⚠️  persistentStorage.js not found, creating manually...');
  
  const sourcePath = path.join(__dirname, 'src/data/persistentStorage.ts');
  const targetPath = path.join(__dirname, 'dist/data/persistentStorage.js');
  
  if (fs.existsSync(sourcePath)) {
    try {
      // Create a temporary tsconfig for just this file
      const tempTsConfig = {
        compilerOptions: {
          target: "es2016",
          module: "commonjs",
          outDir: "./dist/data",
          rootDir: "./src/data",
          moduleResolution: "node",
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          strict: false,
          skipLibCheck: true
        },
        include: ["src/data/persistentStorage.ts"]
      };
      
      const tempTsConfigPath = path.join(__dirname, 'temp-tsconfig.json');
      fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));
      
      // Compile just this file
      execSync(`npx tsc --project ${tempTsConfigPath}`, { stdio: 'inherit' });
      
      // Clean up temp config
      fs.unlinkSync(tempTsConfigPath);
      
      console.log('✓ persistentStorage.js created using TypeScript compiler');
    } catch (compileError) {
      console.error('❌ Failed to compile persistentStorage.ts:', compileError.message);
      
      // Fallback: create a simple JavaScript version
      console.log('🔄 Creating fallback JavaScript version...');
      const content = fs.readFileSync(sourcePath, 'utf8');
      
      // More sophisticated conversion
      let jsContent = content
        .replace(/import.*from.*['"]/g, 'const ')
        .replace(/export /g, '')
        .replace(/const /g, 'var ')
        .replace(/interface.*{[\s\S]*?}/g, '')
        .replace(/type.*=.*;/g, '')
        .replace(/declare global.*{[\s\S]*?}/g, '')
        .replace(/export function/g, 'function')
        .replace(/export const/g, 'var')
        .replace(/export interface/g, '// interface')
        .replace(/export type/g, '// type');
      
      // Add module.exports at the end
      jsContent += `
module.exports = {
  companies,
  users,
  agents,
  sessions,
  widgetSettings,
  calls,
  ivrConfigs,
  callQueue,
  chatSessions,
  pendingCompanies,
  saveCompanies,
  saveUsers,
  saveAgents,
  saveSessions,
  saveWidgetSettings,
  findUserByCompanyAndRole,
  findCompanyByEmail,
  findPendingCompanyByEmail
};
`;
      
      fs.writeFileSync(targetPath, jsContent);
      console.log('✓ persistentStorage.js created with fallback conversion');
    }
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