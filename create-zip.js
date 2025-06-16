const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createZip() {
  console.log('Creating zip archive...');

  const output = fs.createWriteStream('daily-pulse-code.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function() {
    console.log(`Archive created: ${archive.pointer()} total bytes`);
    console.log('✅ daily-pulse-code.zip created successfully!');
  });

  archive.on('error', function(err) {
    console.error('❌ Archive error:', err);
    throw err;
  });

  archive.pipe(output);

  // Add all files and directories, excluding unwanted ones
  archive.glob('**/*', {
    cwd: process.cwd(),
    ignore: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      '.config/**',
      '*.zip',
      '*.tar.gz',
      'create-zip.js',
      '.replit',
      'replit.nix'
    ]
  });

  await archive.finalize();
}

createZip().catch(console.error);