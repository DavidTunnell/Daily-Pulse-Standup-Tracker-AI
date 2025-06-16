
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

console.log('Starting archive creation...');

// Create a file to stream archive data to
const output = createWriteStream('daily-pulse-code.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archive has been finalized and the output file descriptor has closed.');
  console.log('daily-pulse-code.zip created successfully!');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  console.error('Archive error:', err);
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files and directories to the archive
console.log('Adding files to archive...');

// Add specific directories and files
archive.directory('client/', 'client/');
archive.directory('server/', 'server/');
archive.directory('shared/', 'shared/');
archive.directory('scripts/', 'scripts/');

// Add individual files
archive.file('package.json', { name: 'package.json' });
archive.file('package-lock.json', { name: 'package-lock.json' });
archive.file('tsconfig.json', { name: 'tsconfig.json' });
archive.file('tailwind.config.ts', { name: 'tailwind.config.ts' });
archive.file('postcss.config.js', { name: 'postcss.config.js' });
archive.file('drizzle.config.ts', { name: 'drizzle.config.ts' });
archive.file('vite.config.ts', { name: 'vite.config.ts' });
archive.file('.gitignore', { name: '.gitignore' });

// Finalize the archive
archive.finalize();
