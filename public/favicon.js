// Simple script to create a favicon for TrackWise
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Draw a gradient background
  const gradient = ctx.createLinearGradient(0, 0, 32, 32);
  gradient.addColorStop(0, '#6366F1');  // Indigo
  gradient.addColorStop(1, '#8B5CF6');  // Violet
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  // Draw the "T" letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', 16, 16);
  
  // Convert to favicon and set it
  const link = document.querySelector('link[rel="icon"]');
  if (link) {
    link.href = canvas.toDataURL('image/png');
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = canvas.toDataURL('image/png');
    document.head.appendChild(newLink);
  }
}); 