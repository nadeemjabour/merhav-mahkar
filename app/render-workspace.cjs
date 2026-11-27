const fs = require('node:fs');
const path = require('node:path');

const scalableType = require('./scalable-type.cjs');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

module.exports = function renderWorkspace({legacyInterface = false} = {}) {
  const html = read('index.html').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, scalableType);
  const headMarker = '<!-- workspace-theme -->';
  const scriptMarker = '/* workspace-studio */';
  if (!html.includes(headMarker) || !html.includes(scriptMarker)) {
    throw new Error('Missing research workspace asset marker');
  }
  const styles = ['workspace-theme.css', 'studio-design.css', 'studio-chrome.css', 'research-gallery.css', 'research-chat.css', 'dashboard-desk.css', 'file-cabinet.css', 'backup-center.css', 'task-workbench.css', 'research-sections.css']
    .map(name => '<style id="' + name.replace('.css', '') + '">\n' + scalableType(read(name)) + '\n</style>');
  const preferences = ['studio-core-locales.js', 'studio-module-locales.js', 'studio-preferences.js']
    .map(name => '<script id="' + name.replace('.js', '') + '">\n' + read(name) + '\n</script>');
  return html
    .replace('<body>', legacyInterface ? '<body data-legacy-interface>' : '<body>')
    .replace(headMarker, () => [...styles, ...preferences].join('\n'))
    .replace(scriptMarker, () => [read('aurora-studio.js'), read('studio-visuals.js'), read('research-gallery.js'), read('research-chat-ui.js'), read('dashboard-desk.js'), read('file-cabinet.js'), read('backup-center.js'), read('task-workbench.js'), read('research-sections.js')].join('\n'));
};
