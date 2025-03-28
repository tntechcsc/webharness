const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../../backend/target/release', process.platform === 'win32' ? 'backend.exe' : 'backend');
const dest = path.join(__dirname, '../frontend-win32-x64', process.platform === 'win32' ? 'backend.exe' : 'backend');

fs.copyFileSync(source, dest);
console.log('Backend executable copied to package folder');