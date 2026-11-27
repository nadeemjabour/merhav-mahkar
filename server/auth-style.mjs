export const authStyle = `
:root {
  color-scheme: light;
  --background: #eff3f8; --surface: #fcfdff; --ink: #252f41; --muted: #4e5e76;
  --edge: #cad5e4; --entry: #f7f9fc; --primary: #9d5068; --on-primary: #fff;
  --notice: #e5edf7; --notice-ink: #435978; --focus: #53698d; --failure: #783c52;
  --shadow: 0 26px 76px -44px #3a243157;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --background: #172031; --surface: #222e43; --ink: #f5f7fc; --muted: #c4d2e4;
  --edge: #4b5e78; --entry: #29374d; --primary: #f6b1ce; --on-primary: #382333;
  --notice: #31425b; --notice-ink: #d4e2f4; --focus: #f6b1ce; --failure: #f6b6d1;
  --shadow: 0 35px 80px -40px #0009;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--background); color: var(--ink); font: 1rem/1.55 system-ui, Arial, sans-serif; }
button, input, select { font: inherit; }
button, select { cursor: pointer; }
:where(button, input, select):focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
button:disabled { cursor: wait; opacity: .68; }
.shell { width: min(1140px, calc(100% - 4rem)); margin-inline: auto; }
header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 1.35rem; border-bottom: 1px solid var(--edge); }
.brand, .preferences, .control { display: inline-flex; align-items: center; }
.brand { gap: .65rem; font-weight: 700; font-size: 1.06rem; }
.brand svg { width: 2.2rem; height: 2.2rem; }
.preferences { gap: .5rem; }
.control { min-height: 42px; background: var(--surface); border: 1px solid var(--edge); color: var(--ink); border-radius: .7rem; gap: .5rem; padding: .42rem .65rem; }
.control svg { width: 1.15rem; height: 1.15rem; flex: none; }
.control select { border: 0; background: var(--surface); color: var(--ink); font-weight: 600; font-size: .92rem; }
label.control { position:relative; width:44px; height:44px; padding:0; justify-content:center; }
label.control select { position:absolute; inset:0; margin:0; width:100%; height:100%; opacity:0; }
label.control:has(select:focus-visible) { outline:3px solid var(--focus); outline-offset:3px; }
.control.theme { justify-content: center; min-width: 42px; }
[data-theme="dark"] .moon, html:not([data-theme="dark"]) .sun { display: none; }
main { display: grid; align-content: center; padding-block: clamp(1.75rem, 6vh, 4.5rem); min-height: calc(100svh - 88px); }
.spread { display: grid; grid-template-columns: 1fr .94fr; min-height: min(600px, 76vh); width: 100%; overflow: hidden; background: var(--surface); border: 1px solid var(--edge); border-radius: 1.65rem; box-shadow: var(--shadow); }
.paper { display: flex; align-items: center; justify-content: center; padding: clamp(2rem, 5vw, 5rem); }
.form-content { width: min(100%, 380px); }
h1,h2,p { margin: 0; }
h1 { font-size: clamp(2.05rem, 3.1vw, 3rem); line-height: 1.17; font-weight: 680; letter-spacing: -.035em; }
:lang(ar) h1, :lang(ar) h2 { letter-spacing: normal; }
.lead { margin-block: .9rem 1.9rem; color: var(--muted); max-width: 43ch; text-wrap: pretty; }
.fields { display: grid; gap: 1rem; }
.fields label { display: flex; flex-direction: column; gap: .38rem; font-weight: 650; font-size: .91rem; }
input { min-width: 0; width: 100%; border: 1px solid var(--edge); border-radius: .65rem; background: var(--entry); color: var(--ink); font-size: 1rem; padding: .7rem .9rem; height: 48px; }
input:focus { border-color: var(--primary); }
input[type="email"], input[type="password"] { direction:ltr; text-align:start; }
input::placeholder { color: var(--muted); opacity:.8; }
.actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1.5rem; }
.action { min-height: 46px; padding: .6rem 1.15rem; display: inline-flex; align-items: center; justify-content: center; gap: .65rem; border: 1px solid var(--primary); border-radius: .65rem; background: var(--primary); color: var(--on-primary); font-weight: 680; }
.actions .action:first-child { flex: 1.2; }
.actions .secondary { flex: 1; }
.action:hover { filter: brightness(.95); }
.secondary { background: transparent; color: var(--ink); border-color: var(--edge); }
.note { color: var(--muted); margin-top: 1rem; font-size: .85rem; }
.notice { margin-bottom: 1.2rem; padding: .8rem .95rem; background: var(--notice); color: var(--notice-ink); border-inline-start: 3px solid var(--primary); border-radius: .35rem; }
.account { display: block; font-weight: 650; overflow-wrap:anywhere; }
#message { margin-top: .9rem; color: var(--notice-ink); }
#message:empty { margin: 0; }
#message[data-error="true"] { color: var(--failure); }
.atlas { position: relative; display: flex; flex-direction: column; justify-content: center; background: radial-gradient(ellipse at 65% 34%, #793d53 0, transparent 58%), #3a2431; color: #f2f6fb; isolation: isolate; overflow: hidden; padding: clamp(1.6rem, 3vw, 3rem); }
.atlas::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg,#f9ddea04 0 1px,transparent 1px 4px); z-index: -1; }
.field-diagram { display: block; width: 100%; height: auto; max-height: 380px; }
.atlas-caption { display: grid; gap: .5rem; margin: .5rem 1rem 0; }
.atlas-caption h2 { font: 520 clamp(2rem, 3vw, 3rem)/1.2 Georgia, 'Times New Roman', serif; }
.atlas-caption p { color: #f7bdd5; max-width: 36ch; font-size: .97rem; }
@media (prefers-reduced-motion:no-preference) {
  .spread { animation: arrive .5s ease-out both; }
  .diagram-mesh { animation: trace-in .75s .05s ease-out both; }
  .diagram-sun { animation: arrive .75s .04s ease-out both; transform-origin: 315px 116px; }
  @keyframes arrive { from { opacity: 0; transform: translateY(9px); } to { opacity:1; transform: translateY(0); } }
  @keyframes trace-in { from { opacity:.1; transform: translateY(5px); } to { opacity:.95; transform: translateY(0); } }
}
@media (max-width:760px) {
  .shell { width: min(100% - 2rem, 560px); }
  header { padding-block: .8rem; }
  main { min-height: auto; padding-block: 1rem 2rem; }
  .spread { grid-template-columns: 1fr; min-height: auto; border-radius: 1.1rem; }
  .atlas { grid-row: 1; display: grid; grid-template-columns: 1fr minmax(90px, 32%); align-items: center; padding: .7rem 1.3rem; min-height: 130px; }
  .atlas-caption { grid-row: 1; grid-column: 1; margin: 0; }
  .atlas-caption h2 { font-size: 1.65rem; }
  .atlas-caption p { font-size: .86rem; }
  .field-diagram { grid-column: 2; grid-row: 1; max-height: 145px; }
  .paper { padding: 1.6rem 1.35rem; }
  .form-content { width: 100%; }
  .lead { margin-block: .65rem 1.3rem; }
}
@media (max-width:375px) {
  .shell { width: calc(100% - 1rem); }
  .brand { font-size: .9rem; gap: .3rem; }
  .brand svg { width: 1.7rem; }
  .actions { flex-direction: column; }
}
/* The film is presented in its native aspect ratio before the form. */
#entrance { display:none; }
html[data-entrance] .shell { display:none; }
html[data-entrance] #entrance {
  display:grid; grid-template-rows:auto minmax(0,1fr) auto; min-height:100svh; min-height:100dvh;
  background:radial-gradient(ellipse at 18% 55%, #344967,transparent 62%),#1d293e; color:#f8f8ff;
  padding:clamp(16px,3vw,44px) max(clamp(16px,5vw,84px),env(safe-area-inset-right)) max(clamp(16px,3vw,36px),env(safe-area-inset-bottom));
}
.entrance-bar,.entrance-controls { display:flex; align-items:center; justify-content:space-between; gap:.8rem; }
.entrance-bar { padding-block:4px 15px; border-bottom:1px solid #aabfda40; }
#entrance button { cursor:pointer; font:650 .95rem/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; min-height:44px; padding:.65rem 1.15rem; color:inherit; background:transparent; border:1px solid #aabfda80; border-radius:40px; }
#entrance button:focus-visible { outline:3px solid #f6b1ce; outline-offset:4px; }
#entrance button:hover { background:#aabfda21; }
.entrance-stage { display:grid; place-items:center; min-width:0; align-self:center; inline-size:100%; padding-block:clamp(1rem,4vh,3.5rem); }
.entrance-grade { position:absolute; pointer-events:none; }
.entrance-stage video { display:block; width:100%; max-height:68svh; aspect-ratio:1460/624; object-fit:contain; border-radius:clamp(14px,2.1vw,32px); filter:grayscale(1) url("#entrance-palette"); }
.entrance-console { width:min(100%,700px); justify-self:center; padding-bottom:3px; }
.entrance-progress { height:3px; overflow:hidden; border-radius:9px; background:#aabfda42; margin-bottom:1rem; direction:ltr; }
.entrance-progress i { display:block; height:100%; width:100%; transform:scaleX(0); transform-origin:left; background:#f6b1ce; }
#entrance [data-play] { display:inline-flex; align-items:center; gap:.6rem; border-color:transparent; color:#2c2431; background:#f6b1ce; }
#entrance [data-play]:hover { background:#f9cadc; }
.play-icon { display:block; width:0; height:0; border-block:6px solid transparent; border-left:9px solid currentColor; }
#entrance[data-playing="true"] .play-icon { width:10px; height:13px; border:0; border-inline:3px solid currentColor; }
#entrance:not([data-playing="true"]) .when-playing,#entrance[data-playing="true"] .when-paused,
#entrance:not([data-muted="true"]) .when-muted,#entrance[data-muted="true"] .when-audible { display:none; }
#entrance [data-sound] { border-color:transparent; text-decoration:underline; text-underline-offset:.2em; }
@media(max-height:460px) and (orientation:landscape) {
  html[data-entrance] #entrance { padding-block:6px; }
  .entrance-stage { padding-block:4px; }
  .entrance-stage video { max-height:55svh; }
  .entrance-bar,.entrance-console { padding-block:0; }
  .entrance-progress { margin-bottom:3px; }
}
body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; background:radial-gradient(ellipse at 12% 5%,color-mix(in srgb,#aabfda 29%,transparent),transparent 52%),var(--background); }
.shell header { border-color:color-mix(in srgb,var(--edge) 70%,transparent); }
.control,.control.theme { border-radius:50%; width:44px; height:44px; padding:0; justify-content:center; }
.spread { background:var(--surface); border-radius:30px; box-shadow:0 20px 65px -42px #384b6970; }
.atlas { background:radial-gradient(ellipse at 28% 20%,#566b8b,transparent 64%),linear-gradient(145deg,#364965,#22324b 85%); }
.atlas::before { display:none; }
.atlas-caption h2 { font-family:inherit; font-weight:680; letter-spacing:-.025em; }
.atlas-caption p { color:#d4dfed; }
.action { border-radius:100px; }
.fields input { border-radius:14px; }
@media(max-width:760px) { .spread { border-radius:22px; } }
#entrance:not([data-started]) .when-started,#entrance[data-started] .when-new,#entrance:not([data-started]) [data-sound] { display:none; }
#entrance [data-sound] { display:grid; place-items:center; padding:0; width:44px; border:1px solid #aabfda80; }
#entrance [data-sound] > span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
`;
