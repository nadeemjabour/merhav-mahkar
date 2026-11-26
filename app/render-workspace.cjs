const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

module.exports = function renderWorkspace() {
  const html = read('index.html');
  const headMarker = '<!-- workspace-theme -->';
  const scriptMarker = '/* workspace-studio */';
  if (!html.includes(headMarker) || !html.includes(scriptMarker)) {
    throw new Error('Missing research workspace asset marker');
  }
  const styles = ['workspace-theme.css', 'studio-design.css', 'studio-chrome.css']
    .map(name => '<style id="' + name.replace('.css', '') + '">\n' + read(name) + '\n</style>');
  const preferences = ['studio-core-locales.js', 'studio-module-locales.js', 'studio-preferences.js']
    .map(name => '<script id="' + name.replace('.js', '') + '">\n' + read(name) + '\n</script>');
  return html
    .replace(headMarker, () => [...styles, ...preferences].join('\n'))
    .replace(scriptMarker, () => [read('aurora-studio.js'), read('studio-visuals.js')].join('\n'));
};
