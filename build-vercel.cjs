const fs = require('node:fs');
require('./build.cjs');
fs.copyFileSync('dist/server/index.js', 'dist/server/workspace.mjs');
fs.mkdirSync('public', {recursive:true});
fs.writeFileSync('public/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log('Vercel application and private API ready.');
