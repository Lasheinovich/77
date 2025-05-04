// Bundle size analysis script for Next.js production builds
// Run with: NODE_ENV=production ANALYZE=true node analyze-bundles.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the analysis directory exists
const analysisDir = path.join(__dirname, '.ark7_hyperlogs', 'bundle-analysis');
if (!fs.existsSync(analysisDir)) {
  fs.mkdirSync(analysisDir, { recursive: true });
}

// Get current date for the report filename
const date = new Date().toISOString().split('T')[0];

console.log('Building Next.js application with bundle analyzer...');
try {
  // Set environment variables for the build
  process.env.ANALYZE = 'true';
  process.env.NODE_ENV = 'production';
  
  // Run the build command
  execSync('npx cross-env ANALYZE=true next build', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      ANALYZE: 'true',
      NODE_ENV: 'production'
    }
  });
  
  console.log('\nBundle analysis complete!');
  console.log(`Bundle analysis files saved to ${analysisDir}`);
  
  // Copy the bundle analysis files to our logs directory
  const analysisFiles = [
    '.next/analyze/client.html',
    '.next/analyze/server.html',
    '.next/analyze/edge.html'
  ].filter(file => fs.existsSync(path.join(__dirname, file)));
  
  analysisFiles.forEach(file => {
    const baseName = path.basename(file);
    const destPath = path.join(analysisDir, `${date}-${baseName}`);
    fs.copyFileSync(path.join(__dirname, file), destPath);
    console.log(`Saved: ${destPath}`);
  });
  
} catch (error) {
  console.error('Error running bundle analysis:', error);
  process.exit(1);
}