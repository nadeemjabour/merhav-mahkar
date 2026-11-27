// The dashboard follows the user's saved project order; browsing only changes the study in focus.
let deskFocusId = '';
let deskOrderExpanded = false;
let deskStill = false;
try { deskStill = localStorage.getItem('merhav-desk-still') === '1'; } catch {}
const deskReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function deskMotionEnabled() { return !deskStill && !deskReduced.matches; }
function syncDeskMotion() {
  const deck = document.querySelector('.desk-deck');
  if (!deck) return;
  deck.dataset.motion = deskMotionEnabled() ? 'on' : 'off';
  const button = deck.querySelector('[data-motion-toggle]');
  button.disabled = deskReduced.matches;
  button.textContent = uiText(deskReduced.matches ? 'תנועה מופחתת לפי הגדרות המכשיר' : deskStill ? 'הפעלת תנועה' : 'השהיית תנועה');
  if (!deskMotionEnabled()) deck.getAnimations({subtree:true}).filter(a=>!a.animationName).forEach(a=>a.cancel());
}
deskReduced.addEventListener('change',syncDeskMotion);
function toggleDeskMotion() {
  deskStill = !deskStill;
  try { localStorage.setItem('merhav-desk-still',deskStill ? '1' : '0'); } catch {}
  syncDeskMotion();
}

function deskStudyContents(paper) {
  const completed = progress(paper);
  const number = new Intl.NumberFormat(uiLocale());
  const done = list=>list.filter(x=>x.status==='הושלם').length;
  const chapters = S.chapters.filter(x=>x.paperId===paper.id);
  const tasks = S.tasks.filter(x=>x.paperId===paper.id);
  function breakdown(label, items) {
    return `<div><span>${uiText(label)}</span><b dir="ltr">${number.format(done(items))} / ${number.format(items.length)}</b></div>`;
  }
  return `<div class="desk-manuscript"><div class="desk-folio-meta">
      <b dir="auto">${esc(paper.code)}</b>${esc(displayChoice(paper.status,statuses))} ${late(paper)}</div>
    <h2 dir="auto">${esc(paper.title)}</h2>
    ${paper.due?`<p class="desk-target">${workspaceIcon('clock')} ${uiText('מועד יעד')} · ${esc(date(paper.due))}</p>`:''}
    <div class="desk-next-action"><span>${uiText('הצעד הבא:')}</span><strong dir="auto">${esc(next(paper,uiText('טרם הוגדרה משימה הבאה')))}</strong></div>
    <div class="desk-study-actions"><button type="button" class="desk-open" onclick="openPaper(deskFocusId)">${uiText('פתיחת מחקר ←')}</button>
      <button type="button" onclick="edit('tasks',null,{paperId:deskFocusId})">${uiText('＋ משימה')}</button>
      <button type="button" onclick="edit('papers',deskFocusId)">${uiText('✎ עריכת מחקר')}</button></div>
    </div><div class="desk-instrument">
      <div class="desk-dial" style="--sweep:${completed.pct*3.6}deg">
        <div class="desk-orbit" aria-hidden="true"></div>
        <div class="desk-dial-reading"><b dir="ltr">${new Intl.NumberFormat(uiLocale(),{style:'percent'}).format(completed.pct/100)}</b>
          <span>${uiText('התקדמות')}</span></div></div>
      <div class="desk-breakdown">${breakdown('משימות',tasks)}${breakdown('פרקים',chapters)}</div>
    </div>`;
}

function deskStudyDeck() {
  const papers = articleOrder();
  if (!papers.length) return '';
  const index = Math.max(0,papers.findIndex(p=>p.id===deskFocusId));
  const paper = papers[index];
  deskFocusId = paper.id;
  const motion = deskMotionEnabled();
  return `<section class="desk-deck" data-motion="${motion?'on':'off'}" aria-label="${uiText('המחקרים שלי')}">
    <div class="desk-deck-bar"><h3>${uiText('המחקרים שלי')}</h3>
      <div class="desk-controls"><button type="button" data-motion-toggle ${deskReduced.matches?'disabled':''} onclick="toggleDeskMotion()">${uiText(deskReduced.matches?'תנועה מופחתת לפי הגדרות המכשיר':deskStill?'הפעלת תנועה':'השהיית תנועה')}</button>
      <button type="button" class="desk-arrow" aria-label="${uiText('המחקר הקודם')}" onclick="stepDeskStudy(-1)" ${papers.length<2?'disabled':''}><span dir="ltr">‹</span></button>
      <output dir="ltr" aria-live="polite" class="desk-counter">${index+1} / ${papers.length}<span class="gallery-sr"> · ${esc(paper.title)}</span></output>
      <button type="button" class="desk-arrow" aria-label="${uiText('המחקר הבא')}" onclick="stepDeskStudy(1)" ${papers.length<2?'disabled':''}><span dir="ltr">›</span></button></div>
    </div><div class="desk-leaf">${deskStudyContents(paper)}</div>
    <div class="desk-catalog" role="group" aria-label="${uiText('מעבר למחקר')}">${papers.map((p,i)=>`<button type="button" data-study="${esc(p.id)}" aria-pressed="${i===index}" onclick="chooseDeskStudy(this.dataset.study)">
      <span>${esc(p.code)}</span><strong dir="auto">${esc(p.title)}</strong></button>`).join('')}</div>
    <details class="desk-priority" ${deskOrderExpanded?'open':''} ontoggle="deskOrderExpanded=this.open"><summary>${uiText('שינוי סדר המחקרים')}</summary>
      <ol>${papers.map((p,i)=>`<li data-paper="${esc(p.id)}"><button type="button" draggable="true" data-paper-handle="${esc(p.id)}" aria-label="${uiText('⠿ גרירה')}">⠿</button>
        <b dir="auto">${esc(p.title)}</b><button type="button" aria-label="${uiText('הקדמה בסדר')}" data-id="${esc(p.id)}" onclick="movePaper(this.dataset.id,-1)" ${!i?'disabled':''}>↑</button>
        <button type="button" aria-label="${uiText('דחייה בסדר')}" data-id="${esc(p.id)}" onclick="movePaper(this.dataset.id,1)" ${i===papers.length-1?'disabled':''}>↓</button></li>`).join('')}</ol>
    </details></section>`;
}

function stepDeskStudy(delta) {
  const papers = articleOrder();
  if (papers.length < 2) return;
  const index = papers.findIndex(p=>p.id===deskFocusId);
  chooseDeskStudy(papers[(index+delta+papers.length)%papers.length].id,delta);
}

function chooseDeskStudy(id, direction) {
  if (id===deskFocusId) return;
  const deck = document.querySelector('.desk-deck'), papers=articleOrder();
  const index=papers.findIndex(p=>p.id===id);
  if (!deck || index===-1) return;
  direction ??= Math.sign(index-papers.findIndex(p=>p.id===deskFocusId));
  const leaf=deck.querySelector('.desk-leaf');
  const previousSweep=getComputedStyle(leaf.querySelector('.desk-dial')).getPropertyValue('--sweep').trim();
  deskFocusId=id;
  leaf.innerHTML=deskStudyContents(papers[index]);
  const tabs=Array.from(deck.querySelectorAll('[data-study]'));
  tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.study===id)));
  const rail=deck.querySelector('.desk-catalog'), tabBounds=tabs[index].getBoundingClientRect(), bounds=rail.getBoundingClientRect();
  const offset=tabBounds.left<bounds.left?tabBounds.left-bounds.left:tabBounds.right>bounds.right?tabBounds.right-bounds.right:0;
  if(offset)rail.scrollBy({left:offset,behavior:deskMotionEnabled()?'smooth':'instant'});
  const counter=deck.querySelector('.desk-counter');
  counter.firstChild.textContent=(index+1)+' / '+papers.length;
  counter.querySelector('.gallery-sr').textContent=' · '+papers[index].title;
  if (!deskMotionEnabled()) return;
  const dial=leaf.querySelector('.desk-dial');
  dial.animate([{'--sweep':previousSweep},{'--sweep':dial.style.getPropertyValue('--sweep')}],{duration:660,easing:'cubic-bezier(.25,.8,.25,1)'});
  const shift=(document.documentElement.dir==='rtl'?-1:1)*direction;
  leaf.querySelector('.desk-manuscript').animate([{opacity:.2,transform:'translateX('+shift*42+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:440,easing:'cubic-bezier(.16,.84,.3,1)'});
  leaf.querySelector('.desk-dial-reading').animate([{transform:'scale(.82)',opacity:.3},{transform:'scale(1)',opacity:1}],{duration:460,easing:'ease-out'});
}
