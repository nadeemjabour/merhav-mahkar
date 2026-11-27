let deskOrderExpanded = false;
let deskStill = false;
try { deskStill = localStorage.getItem('merhav-desk-still') === '1'; } catch {}
const deskReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function deskMotionEnabled() { return !deskStill && !deskReduced.matches; }

function deskMotionLabel() {
  return uiText(deskReduced.matches ? 'תנועה מופחתת לפי הגדרות המכשיר' : deskStill ? 'הפעלת תנועה' : 'השהיית תנועה');
}

function syncDeskMotion() {
  const library = document.querySelector('.desk-library');
  if (!library) return;
  library.dataset.motion = deskMotionEnabled() ? 'on' : 'off';
  const button = library.querySelector('[data-motion-toggle]');
  if (button) {
    button.disabled = deskReduced.matches;
    button.textContent = deskMotionLabel();
  }
  if (!deskMotionEnabled()) {
    const dial = library.querySelector('.desk-dial');
    dial?.getAnimations().forEach(animation => animation.cancel());
    const stage = library.querySelector('.desk-depth');
    stage?.style.removeProperty('--desk-tilt-x');
    stage?.style.removeProperty('--desk-tilt-y');
  }
}
deskReduced.addEventListener('change', syncDeskMotion);

function toggleDeskMotion() {
  deskStill = !deskStill;
  try { localStorage.setItem('merhav-desk-still',deskStill ? '1' : '0'); } catch {}
  syncDeskMotion();
}

function deskProgressGlobe(pct) {
  const value = new Intl.NumberFormat(uiLocale(), {style:'percent'}).format(pct / 100);
  return `<div class="desk-instrument">
    <div class="desk-depth">
      <div class="desk-orbit desk-orbit-one" aria-hidden="true"></div><div class="desk-orbit desk-orbit-two" aria-hidden="true"></div><div class="desk-orbit desk-orbit-three" aria-hidden="true"></div><div class="desk-orbit desk-orbit-four" aria-hidden="true"></div>
      <div class="desk-dial" role="progressbar" aria-label="${esc(uiText('התקדמות'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--fill:${pct}%">
        <div class="desk-planet" aria-hidden="true"><div class="desk-liquid"></div></div>
        <div class="desk-dial-reading" aria-hidden="true"><b dir="ltr">${value}</b><span>${uiText('התקדמות')}</span></div>
      </div>
    </div>
  </div>`;
}

function deskGlobeFill(dial) {
  return dial ? parseFloat(getComputedStyle(dial).getPropertyValue('--fill')) : NaN;
}

function animateDeskGlobe(dial, from) {
  if (!dial || !Number.isFinite(from) || !deskMotionEnabled()) return;
  const to = Number(dial.getAttribute('aria-valuenow'));
  if (from === to) return;
  const animation = dial.animate([{'--fill':from+'%'},{'--fill':to+'%'}], {
    duration:850, easing:'cubic-bezier(.25,.8,.25,1)'
  });
  const reading = dial.querySelector('.desk-dial-reading b');
  const formatter = new Intl.NumberFormat(uiLocale(), {style:'percent'});
  function update() {
    if (!dial.isConnected) return;
    const progress = animation.effect.getComputedTiming().progress;
    const value = progress === null ? to : Math.round(from + (to-from) * progress);
    reading.textContent = formatter.format(value / 100);
    if (animation.playState === 'running' || animation.pending) requestAnimationFrame(update);
  }
  update();
}

function deskPaperOrder() {
  const papers = articleOrder();
  if (papers.length < 2) return '';
  return `    <details class="desk-priority" ${deskOrderExpanded?'open':''} ontoggle="deskOrderExpanded=this.open"><summary>${uiText('שינוי סדר המחקרים')}</summary>
      <ol>${papers.map((p,i)=>`<li data-paper="${esc(p.id)}"><button type="button" draggable="true" data-paper-handle="${esc(p.id)}" aria-label="${uiText('⠿ גרירה')}">⠿</button>
        <b dir="auto">${esc(p.title)}</b><button type="button" aria-label="${uiText('הקדמה בסדר')}" data-id="${esc(p.id)}" onclick="movePaper(this.dataset.id,-1)" ${!i?'disabled':''}>↑</button>
        <button type="button" aria-label="${uiText('דחייה בסדר')}" data-id="${esc(p.id)}" onclick="movePaper(this.dataset.id,1)" ${i===papers.length-1?'disabled':''}>↓</button></li>`).join('')}</ol>
    </details>`;
}
