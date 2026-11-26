export const authStyle = `
:root {
  color-scheme: light;
  --background: #f2f1e9; --surface: #fffef8; --ink: #172f31; --muted: #526461;
  --edge: #d6dbd0; --entry: #fffefa; --primary: #175952; --on-primary: #fff;
  --notice: #e9f3ea; --notice-ink: #224c43; --focus: #bc7919; --failure: #8c322d;
  --shadow: 0 26px 76px -44px #1b383c57;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --background: #101d21; --surface: #19282b; --ink: #edf3e8; --muted: #b0c2bb;
  --edge: #3c504f; --entry: #152327; --primary: #9dd9bc; --on-primary: #0b302a;
  --notice: #243f37; --notice-ink: #c7edd6; --focus: #eebe77; --failure: #ffb7aa;
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
.atlas { position: relative; display: flex; flex-direction: column; justify-content: center; background: radial-gradient(ellipse at 65% 34%, #254b47 0, transparent 58%), #153335; color: #fcf6df; isolation: isolate; overflow: hidden; padding: clamp(1.6rem, 3vw, 3rem); }
.atlas::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg,#e5f9d804 0 1px,transparent 1px 4px); z-index: -1; }
.field-diagram { display: block; width: 100%; height: auto; max-height: 380px; }
.atlas-caption { display: grid; gap: .5rem; margin: .5rem 1rem 0; }
.atlas-caption h2 { font: 520 clamp(2rem, 3vw, 3rem)/1.2 Georgia, 'Times New Roman', serif; }
.atlas-caption p { color: #c1d4c9; max-width: 36ch; font-size: .97rem; }
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
`;
