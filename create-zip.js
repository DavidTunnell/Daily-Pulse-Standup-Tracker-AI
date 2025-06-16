
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = createWriteStream('daily-pulse-code.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archive has been finalized and the output file descriptor has closed.');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
archive.glob('**/*', {
  ignore: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    '.config/**',
    '*.zip',
    '*.tar.gz',
    'create-zip.js'
  ]
});

// Finalize the archive
archive.finalize();
