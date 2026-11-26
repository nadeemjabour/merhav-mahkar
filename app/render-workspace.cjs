const fs = require('node:fs');
const path = require('node:path');

module.exports = function renderWorkspace() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const marker = '<!-- workspace-theme -->';
  if (!html.includes(marker)) throw new Error('Workspace theme marker is missing');
  const css = fs.readFileSync(path.join(__dirname, 'workspace-theme.css'), 'utf8');
  const studioMarker = '/* workspace-studio */';
  if (!html.includes(studioMarker)) throw new Error('Workspace studio marker is missing');
  const studio = fs.readFileSync(path.join(__dirname, 'aurora-studio.js'), 'utf8');
  return html
    .replace(marker, () => '<style id="workspace-theme">\n' + css + '\n</style>')
    .replace(studioMarker, () => studio);
};
