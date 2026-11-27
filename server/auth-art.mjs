// Decorative orbital model for the signed-out research workspace.
export const fieldDiagram = `<svg class="field-diagram" viewBox="0 0 480 340" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="atlas-core" cx=".29" cy=".22" r=".85"><stop stop-color="#fff4fa"/><stop offset=".28" stop-color="#f6b1ce"/><stop offset=".57" stop-color="#e395af"/><stop offset=".8" stop-color="#a07191"/><stop offset="1" stop-color="#546787"/></radialGradient>
    <linearGradient id="atlas-ring" x1="0" y1="0" x2="1" y2=".35"><stop stop-color="#7185a8"/><stop offset=".42" stop-color="#f9dded"/><stop offset=".72" stop-color="#f6b1ce"/><stop offset="1" stop-color="#9d5068"/></linearGradient>
    <radialGradient id="atlas-satellite" cx=".28" cy=".24" r=".85"><stop stop-color="#fbfcff"/><stop offset=".4" stop-color="#aabfda"/><stop offset="1" stop-color="#526585"/></radialGradient>
  </defs>
  <g transform="translate(240 174) rotate(-23)" fill="none">
    <ellipse rx="202" ry="79" stroke="#aabfda" stroke-opacity=".54"/>
    <ellipse rx="167" ry="62" stroke="url(#atlas-ring)" stroke-width="3"/>
    <ellipse rx="115" ry="140" transform="rotate(58) scale(.43 1)" stroke="#c9d7e8" stroke-opacity=".55"/>
    <circle r="74" fill="url(#atlas-core)"/>
    <path d="M-167 0a167 62 0 0 0 334 0" stroke="url(#atlas-ring)" stroke-width="4"/>
    <path d="M-202 0a202 79 0 0 0 404 0" stroke="#aabfda" stroke-opacity=".75"/>
    <circle cx="-146" cy="30" r="14" fill="url(#atlas-satellite)"/>
    <circle cx="185" cy="-32" r="5" fill="#f6b1ce"/>
    <circle cx="12" cy="-62" r="3" fill="#d9e4f2"/>
  </g>
</svg>`;
