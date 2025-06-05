const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../src/shared/pwa/service-worker.js');
const targetPath = path.join(__dirname, '../public/service-worker.js');

// Ensure the public directory exists
if (!fs.existsSync(path.dirname(targetPath))) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

// Copy the service worker
fs.copyFileSync(sourcePath, targetPath);
console.log('Service worker copied to public directory'); 