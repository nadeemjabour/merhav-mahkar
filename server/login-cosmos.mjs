/* Decorative orbital scene for the sign-in screen. */
export const loginCosmos = `
<div class="cosmos" aria-hidden="true">
  <svg class="cosmos-map" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
    <defs>
      <radialGradient id="cosmos-blue" cx=".28" cy=".22" r=".8"><stop stop-color="#f7fbff"/><stop offset=".27" stop-color="#d6e3f3"/><stop offset=".55" stop-color="#aabfda"/><stop offset=".8" stop-color="#7185a8"/><stop offset="1" stop-color="#344662"/></radialGradient>
      <radialGradient id="cosmos-pink" cx=".29" cy=".22" r=".82"><stop stop-color="#fff6fc"/><stop offset=".24" stop-color="#fbd4e6"/><stop offset=".5" stop-color="#f6b1ce"/><stop offset=".78" stop-color="#bf7894"/><stop offset="1" stop-color="#566582"/></radialGradient>
      <radialGradient id="cosmos-violet" cx=".29" cy=".22" r=".82"><stop stop-color="#fff9ff"/><stop offset=".25" stop-color="#ebd6ed"/><stop offset=".55" stop-color="#cbaac7"/><stop offset=".8" stop-color="#8a799e"/><stop offset="1" stop-color="#40516f"/></radialGradient>
      <linearGradient id="cosmos-ring" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#7185a8" stop-opacity=".08"/><stop offset=".36" stop-color="#9d5068" stop-opacity=".5"/><stop offset=".64" stop-color="#f6b1ce" stop-opacity=".88"/><stop offset="1" stop-color="#7185a8" stop-opacity=".16"/></linearGradient>
      <filter id="cosmos-shadow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="4" dy="16" stdDeviation="12" flood-color="#324664" flood-opacity=".24"/></filter>
      <filter id="cosmos-haze" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
      <clipPath id="cosmos-gas-clip"><circle r="57"/></clipPath>
    </defs>
    <g class="cosmos-glow" filter="url(#cosmos-haze)" opacity=".48">
      <ellipse cx="245" cy="370" rx="150" ry="230" fill="#f6b1ce"/>
      <ellipse cx="1290" cy="700" rx="170" ry="220" fill="#aabfda"/>
    </g>
    <g class="cosmos-stars" fill="#fff">
      <circle cx="120" cy="117" r="2"/><circle cx="194" cy="246" r="1.7"/><circle cx="355" cy="96" r="1.8"/>
      <circle cx="489" cy="145" r="2.4"/><circle cx="611" cy="90" r="1.4"/><circle cx="761" cy="129" r="1.8"/>
      <circle cx="908" cy="104" r="1.4"/><circle cx="1068" cy="115" r="2.2"/><circle cx="1265" cy="108" r="1.5"/>
      <circle cx="1375" cy="222" r="2.1"/><circle cx="119" cy="495" r="1.8"/><circle cx="223" cy="635" r="2.1"/>
      <circle cx="368" cy="762" r="1.4"/><circle cx="534" cy="829" r="1.7"/><circle cx="719" cy="779" r="2.1"/>
      <circle cx="884" cy="827" r="1.5"/><circle cx="1059" cy="796" r="1.7"/><circle cx="1253" cy="839" r="2.1"/>
      <circle cx="1372" cy="657" r="1.6"/><circle cx="1304" cy="431" r="1.8"/>
      <animate attributeName="opacity" values=".35;.9;.35" dur="7s" repeatCount="indefinite"/>
    </g>
    <g fill="none" transform="translate(720 465) rotate(-13)">
      <ellipse rx="660" ry="286" stroke="#7185a8" stroke-opacity=".22" stroke-width="1"/>
      <ellipse rx="610" ry="245" stroke="url(#cosmos-ring)" stroke-opacity=".72" stroke-width="1.25"/>
      <ellipse rx="535" ry="205" stroke="#9d5068" stroke-opacity=".13" stroke-width="1"/>
      <g filter="url(#cosmos-shadow)">
        <animateMotion path="M660 0 A660 286 0 1 1 -660 0 A660 286 0 1 1 660 0" dur="50s" begin="-37s" repeatCount="indefinite"/>
        <g transform="rotate(-16)">
          <ellipse rx="78" ry="24" fill="none" stroke="#7185a8" stroke-opacity=".34" stroke-width="8"/>
          <circle r="51" fill="url(#cosmos-blue)"/>
          <path d="M-76 2 A78 24 0 0 0 76 2" fill="none" stroke="#f6b1ce" stroke-opacity=".78" stroke-width="4"/>
        </g>
      </g>
      <g filter="url(#cosmos-shadow)">
        <animateMotion path="M610 0 A610 245 0 1 1 -610 0 A610 245 0 1 1 610 0" dur="38s" begin="-3s" repeatCount="indefinite"/>
        <circle r="34" fill="url(#cosmos-pink)"/>
        <circle cx="-9" cy="-10" r="3" fill="#fff" opacity=".4"/>
      </g>
      <g filter="url(#cosmos-shadow)">
        <animateMotion path="M535 0 A535 205 0 1 0 -535 0 A535 205 0 1 0 535 0" dur="30s" begin="-14s" repeatCount="indefinite"/>
        <circle r="19" fill="url(#cosmos-violet)"/>
      </g>
    </g>
    <g transform="translate(130 720)" filter="url(#cosmos-shadow)">
      <animateTransform attributeName="transform" type="translate" values="130 720;142 707;130 720" dur="18s" repeatCount="indefinite"/>
      <circle r="92" fill="url(#cosmos-pink)"/>
      <g opacity=".16" fill="none" stroke="#fff6fc" stroke-width="7">
        <path d="M-83 -25 Q-12 -2 83 -29"/><path d="M-88 -3 Q-10 19 87 -6"/><path d="M-78 23 Q-5 41 78 19"/>
      </g>
    </g>
    <g transform="translate(1327 147)" filter="url(#cosmos-shadow)">
      <animateTransform attributeName="transform" type="translate" values="1327 147;1314 160;1327 147" dur="20s" repeatCount="indefinite"/>
      <circle r="57" fill="url(#cosmos-violet)"/>
      <g clip-path="url(#cosmos-gas-clip)" fill="none" stroke="#fff7ff" stroke-opacity=".16" stroke-width="8">
        <path d="M-63 -25 Q0 -7 63 -27"/><path d="M-63 -5 Q0 13 63 -7"/><path d="M-63 17 Q0 32 63 15"/>
      </g>
    </g>
  </svg>
  <span class="cosmos-mobile-planet cosmos-mobile-planet-one"></span>
  <span class="cosmos-mobile-planet cosmos-mobile-planet-two"></span>
  <span class="cosmos-mobile-planet cosmos-mobile-planet-three"></span>
</div>
`;
