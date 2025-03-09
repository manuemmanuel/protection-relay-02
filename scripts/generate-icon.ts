const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

async function generateIcons() {
    // Create a canvas
    const size = 512;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, size, size);

    // Draw a stylized "T" for Transformer
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 300px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', size/2, size/2);

    // Add a subtle glow effect
    ctx.shadowColor = '#60A5FA';
    ctx.shadowBlur = 20;
    ctx.fillText('T', size/2, size/2);

    // Save as PNG
    const pngPath = path.join(__dirname, '../electron/assets/icon.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buffer);

    // Convert to ICO
    try {
        const icoBuffer = await pngToIco(pngPath);
        fs.writeFileSync(path.join(__dirname, '../electron/assets/icon.ico'), icoBuffer);
        console.log('Icons generated successfully!');
    } catch (error) {
        console.error('Error generating ICO:', error);
    }
}

generateIcons().catch(console.error); 