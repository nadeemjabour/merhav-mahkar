// The surface meridians and satellites share one continuously animated orbital model.
const meridians=Array.from({length:3},(_,index)=>{
  const paths=Array.from({length:9},(_,step)=>{
    const x=(98*Math.sin((-90+step*45)*Math.PI/180)).toFixed(2);
    return 'M0 -74C'+x+' -74 '+x+' 74 0 74';
  }).join(';');
  const begin=(-index*14/3).toFixed(2)+'s';
  return '<path stroke="#fff0f7" stroke-width="1.1"><animate attributeName="d" values="'+paths+'" dur="14s" begin="'+begin+'" repeatCount="indefinite"/><animate attributeName="opacity" values=".04;.3;.38;.3;.04;0;0;0;.04" dur="14s" begin="'+begin+'" repeatCount="indefinite"/></path>';
}).join('');
function moon(front) {
  return '<circle r="14" fill="url(#atlas-satellite)"><animateMotion path="M-167 0a167 62 0 1 1 334 0a167 62 0 1 1-334 0" dur="18s" begin="-14s" repeatCount="indefinite"/><animate attributeName="opacity" values="'+(front?'0;1;0':'1;0;1')+'" keyTimes="0;.5;1" calcMode="discrete" dur="18s" begin="-14s" repeatCount="indefinite"/></circle>';
}
export const fieldDiagram=`<svg class="field-diagram" viewBox="0 0 480 340" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="atlas-core" cx=".29" cy=".22" r=".85"><stop stop-color="#fff4fa"/><stop offset=".28" stop-color="#f6b1ce"/><stop offset=".57" stop-color="#e395af"/><stop offset=".8" stop-color="#a07191"/><stop offset="1" stop-color="#546787"/></radialGradient>
    <linearGradient id="atlas-ring" x1="0" y1="0" x2="1" y2=".35"><stop stop-color="#7185a8"/><stop offset=".42" stop-color="#f9dded"/><stop offset=".72" stop-color="#f6b1ce"/><stop offset="1" stop-color="#9d5068"/></linearGradient>
    <radialGradient id="atlas-satellite" cx=".28" cy=".24" r=".85"><stop stop-color="#fbfcff"/><stop offset=".4" stop-color="#aabfda"/><stop offset="1" stop-color="#526585"/></radialGradient>
    <clipPath id="atlas-surface-clip"><circle r="73.5"/></clipPath>
  </defs>
  <g transform="translate(240 174)" fill="none">
    <g transform="rotate(-23)">
      <animateTransform attributeName="transform" type="rotate" values="-23;-17;-23" dur="30s" repeatCount="indefinite"/>
      <ellipse rx="202" ry="79" stroke="#aabfda" stroke-opacity=".54"/>
      <ellipse rx="167" ry="62" stroke="url(#atlas-ring)" stroke-width="3"/>
      <ellipse rx="115" ry="140" transform="rotate(58) scale(.43 1)" stroke="#c9d7e8" stroke-opacity=".55"/>
      ${moon(false)}
      <circle r="74" fill="url(#atlas-core)"/>
      <g clip-path="url(#atlas-surface-clip)">
        <g stroke="#fff0f7" stroke-width="1" stroke-opacity=".18"><ellipse cy="-26" rx="74" ry="15"/><ellipse cy="26" rx="74" ry="15"/></g>
        ${meridians}
      </g>
      <path d="M-167 0a167 62 0 0 0 334 0" stroke="url(#atlas-ring)" stroke-width="4"/>
      <path d="M-202 0a202 79 0 0 0 404 0" stroke="#aabfda" stroke-opacity=".75"/>
      ${moon(true)}
      <circle r="5" fill="#f6b1ce"><animateMotion path="M202 0a202 79 0 1 1-404 0a202 79 0 1 1 404 0" dur="26s" begin="-8s" repeatCount="indefinite"/></circle>
      <circle cx="12" cy="-62" r="3" fill="#fff0f7"/>
    </g>
  </g>
</svg>`;
