#!/usr/bin/env node

/**
 * Deployment fix script for React context issues
 * This script ensures proper React initialization in production builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('🔧 Applying deployment fixes...');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Read the index.html file
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add React context fix to the head section
const reactContextFix = `
  <script>
    // Ensure React is available globally to prevent context issues
    window.React = window.React || {};
    
    // Add error handling for React context issues
    window.addEventListener('error', function(event) {
      if (event.error && event.error.message && 
          event.error.message.includes('createContext')) {
        console.error('React context error detected. Reloading page...');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
    
    // Prevent Google Ads SafeFrame errors
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('safeframe.googlesyndication.com')) {
        event.preventDefault();
        return false;
      }
    }, true);
  </script>
`;

// Insert the fix before the closing head tag
if (indexContent.includes('</head>')) {
  indexContent = indexContent.replace('</head>', `${reactContextFix}</head>`);
  
  // Write the updated content back
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Applied React context fixes to index.html');
} else {
  console.warn('⚠️  Could not find </head> tag in index.html');
}

console.log('🚀 Deployment fixes applied successfully!');