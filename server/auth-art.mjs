// An original, decorative field diagram. All geometry is generated on the server
// and delivered in the HTML, so the sign-in screen never requests an image.
function project(x, y) {
  const height = 78 * Math.exp(-((x - 0.24) ** 2 / 0.21 + (y + 0.15) ** 2 / 0.31))
    + 49 * Math.exp(-((x + 0.54) ** 2 / 0.14 + (y - 0.38) ** 2 / 0.17));
  return [222 + 128 * (x - y), 252 + 54 * (x + y) - height];
}

function line(axis, position) {
  const coordinates = Array.from({ length: 51 }, (_, step) => {
    const t = (step / 50) * 2 - 1;
    const point = axis === 'x' ? project(position, t) : project(t, position);
    return point.map(value => value.toFixed(1)).join(',');
  });
  return 'M' + coordinates.join(' L');
}

const isolines = Array.from({length: 31}, (_, i) => {
  const n = i / 15 - 1;
  return '<path d="' + line('x', n) + '"/><path d="' + line('y', n) + '"/>';
}).join('');
const ring = '<circle cx="0" cy="0" r="7" fill="#102e31" stroke="#ffc370" stroke-width="1.4"/><circle r="2.8" fill="#ffc370"/>';
const horizonTicks = Array.from({length: 30}, (_,i) => '<path d="M' + (20 + i * 14) + ' 378v' + (i % 5 === 0 ? 8 : 4) + '"/>').join('');

export const fieldDiagram = `<svg class="field-diagram" viewBox="0 0 446 402" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="field-mesh" x1="0" y1="0" x2="0.7" y2="1" gradientUnits="objectBoundingBox">
      <stop stop-color="#30b0a1"/><stop offset=".45" stop-color="#a2e0ce"/><stop offset="1" stop-color="#5cad9e"/>
    </linearGradient>
    <radialGradient id="field-sun"><stop stop-color="#ffe2a6"/><stop offset=".66" stop-color="#f2b667"/><stop offset="1" stop-color="#da9649"/></radialGradient>
    <pattern id="field-dots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="#9bccc0" opacity=".3"/></pattern>
    <clipPath id="field-frame"><rect x="12" y="28" width="422" height="354" rx="3"/></clipPath>
  </defs>
  <rect x="12" y="28" width="422" height="354" fill="url(#field-dots)"/>
  <g clip-path="url(#field-frame)">
    <circle cx="315" cy="116" r="79" fill="none" stroke="#8fb9a6" opacity=".27" stroke-dasharray="2 5"/>
    <circle cx="315" cy="116" r="62" fill="none" stroke="#8fb9a6" opacity=".3"/>
    <circle class="diagram-sun" cx="315" cy="116" r="34" fill="url(#field-sun)"/>
    <g stroke="#a4cfbf" fill="none" opacity=".31" stroke-width=".7"><path d="M20 116h399M315 33v123" stroke-dasharray="4 5"/><path d="M42 340 245 254l168 70M70 348l170-69 131 51"/></g>
    <g class="diagram-mesh" stroke="url(#field-mesh)" stroke-width=".95" opacity=".95" fill="none">${isolines}</g>
    <g fill="none" stroke="#f3c582" stroke-width="1"><path d="M94 205v-39h37m183-29 17-16h34" stroke-dasharray="2 4"/></g>
    <g transform="translate(93.9 205)">${ring}</g>
    <g transform="translate(314 137)">${ring}</g>
  </g>
  <g stroke="#bdccae" fill="none" stroke-width="1" opacity=".8"><path d="M12 43V28h15m392 0h15v15M12 363v15h15m392 0h15v-15"/></g>
  <g stroke="#b3c9b8" opacity=".6">${horizonTicks}</g>
</svg>`;
