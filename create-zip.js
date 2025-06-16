
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

// Helper function to safely add files/directories
function safeAdd(type, source, dest) {
  try {
    if (fs.existsSync(source)) {
      if (type === 'directory') {
        archive.directory(source, dest);
        console.log(`Added directory: ${source}`);
      } else {
        archive.file(source, { name: dest });
        console.log(`Added file: ${source}`);
      }
    } else {
      console.log(`Skipping ${source} - does not exist`);
    }
  } catch (err) {
    console.warn(`Error adding ${source}:`, err.message);
  }
}

// Add files and directories to the archive
console.log('Adding files to archive...');

// Add specific directories that exist
safeAdd('directory', 'client/', 'client/');
safeAdd('directory', 'server/', 'server/');
safeAdd('directory', 'shared/', 'shared/');
safeAdd('directory', 'scripts/', 'scripts/');

// Add individual files that exist
const filesToAdd = [
  'package.json',
  'package-lock.json', 
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'drizzle.config.ts',
  'vite.config.ts',
  '.gitignore',
  'README.md'
];

filesToAdd.forEach(file => {
  safeAdd('file', file, file);
});

// Finalize the archive
archive.finalize();
