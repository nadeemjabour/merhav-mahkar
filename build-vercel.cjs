const fs = require('node:fs');
require('./build.cjs');
fs.copyFileSync('dist/server/index.js', 'dist/server/workspace.mjs');
fs.mkdirSync('public', {recursive:true});
fs.mkdirSync('public/media', {recursive:true});
for (const name of ['research-space-loop.mp4','research-space-poster.webp']) {
  fs.copyFileSync('app/media/'+name,'public/media/'+name);
}
fs.writeFileSync('public/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log('Vercel application and private API ready.');
