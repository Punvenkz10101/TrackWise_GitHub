// Node.js script to generate a static favicon.ico file
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Draw gradient background
const gradient = ctx.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, '#6366F1'); // Indigo
gradient.addColorStop(1, '#8B5CF6'); // Violet
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 32, 32);

// Draw "T" letter
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('T', 16, 16);

// Save as PNG (we'll use this for favicon.ico)
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'favicon.png'), buffer);

console.log('favicon.png created successfully!');
console.log('Note: To convert to .ico format, you\'ll need to use an online converter or install additional packages.');
console.log('For now, we can use the PNG as favicon in modern browsers.');

// Copy the PNG file to favicon.ico for compatibility
fs.copyFileSync(
  path.join(__dirname, 'favicon.png'),
  path.join(__dirname, 'favicon.ico')
);

console.log('favicon.ico (PNG copy) created for compatibility.'); 