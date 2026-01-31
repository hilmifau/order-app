#!/usr/bin/env node

/**
 * Script untuk generate logo dan splash screen
 * Gunakan: node scripts/generate-assets.js
 * 
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Create assets directory jika belum ada
const assetsDir = path.join(__dirname, '../assets/images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('📦 Asset Generation Guide');
console.log('========================\n');

console.log('Karena keterbatasan, berikut cara manual generate assets:\n');

console.log('1. LOGO ICON (1024x1024px - PNG)');
console.log('   Buat icon dengan nama "icon.png" di assets/images/');
console.log('   - Background: #FFD700 (Gold)\n');

console.log('2. SPLASH SCREEN LIGHT (1200x1200px - PNG)');
console.log('   Nama file: "splash-screen.png"');
console.log('   - Background: #ffffff (White)');
console.log('   - Logo di tengah\n');

console.log('3. SPLASH SCREEN DARK (1200x1200px - PNG)');
console.log('   Nama file: "splash-screen-dark.png"');
console.log('   - Background: #1a1a1a (Dark)');
console.log('   - Logo di tengah\n');

console.log('4. ANDROID ICONS');
console.log('   - android-icon-foreground.png (1080x1080px)');
console.log('   - android-icon-background.png (1080x1080px)');
console.log('   - android-icon-monochrome.png (1080x1080px)\n');

console.log('Rekomendasi Tool Online:');
console.log('- Canva (canva.com) - Free design tool');
console.log('- Figma (figma.com) - Professional design');
console.log('- Pixlr (pixlr.com) - Online editor\n');

console.log('atau gunakan generate tools:');
console.log('- https://www.favicon-generator.org/');
console.log('- https://appicon.co/\n');
