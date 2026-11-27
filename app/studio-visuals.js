/* The portfolio view reads the same chapter statuses as the writing outline. */
const portfolioCopy = {
  he: { title: 'התקדמות פרקים', fraction: (done, total) => `${done} מתוך ${total} הושלמו`, empty: 'טרם נוספו פרקים' },
  ar: { title: 'تقدّم الفصول', fraction: (done, total) => `اكتمل ${done} من ${total}`, empty: 'لم تُضف فصول بعد' },
  en: { title: 'Chapter progress', fraction: (done, total) => `${done} of ${total} complete`, empty: 'No chapters yet' }
};

let studioPortfolioHasEntered = false;

function studioPortfolioFigure() {
  const language = document.documentElement.lang.split('-')[0];
  const copy = portfolioCopy[language] || portfolioCopy.he;
  const chapterCount = S.chapters.length;
  const complete = S.chapters.filter(chapter => chapter.status === 'הושלם').length;
  const fraction = chapterCount ? complete / chapterCount : 0;
  const formatter = new Intl.NumberFormat(language || 'he');
  const percent = new Intl.NumberFormat(language || 'he', {style: 'percent', maximumFractionDigits: 0});
  const detail = chapterCount ? copy.fraction(formatter.format(complete), formatter.format(chapterCount)) : copy.empty;
  const entranceClass = studioPortfolioHasEntered ? '' : ' studio-portfolio-enter';
  studioPortfolioHasEntered = true;
  return `<div class="studio-portfolio${entranceClass}" role="group" aria-label="${copy.title}" translate="no">
    <div class="studio-sheet studio-sheet-back" aria-hidden="true"></div>
    <div class="studio-sheet studio-sheet-middle" aria-hidden="true"></div>
    <div class="studio-sheet studio-sheet-front">
      <div class="studio-sheet-top" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="studio-sheet-row">
        <div class="studio-progress-ring" style="--studio-complete:${fraction * 360}deg">
          <strong>${chapterCount ? percent.format(fraction) : '—'}</strong>
        </div>
        <div class="studio-sheet-caption"><b>${copy.title}</b><span>${detail}</span></div>
      </div>
      <div class="studio-sheet-foot" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
  </div>`;
}

document.addEventListener('merhav:languagechange', () => {
  const graphic = document.querySelector('.studio-portfolio');
  if (graphic && S) graphic.outerHTML = studioPortfolioFigure();
});

/* The existing menu owns navigation, Escape and aria-expanded. Keep the drawer
   keyboard loop within the open menu and put the close button first on mobile. */
document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('body > aside');
  const toggle = document.querySelector('#workspace-nav-toggle');
  const main = document.querySelector('body > main');
  if (!rail || !toggle || !main) return;

  mountEdgeRail(rail);
  const scrim = document.createElement('div');
  scrim.className = 'studio-nav-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  rail.after(scrim);
  const mobile = window.matchMedia('(max-width:850px)');
  const labels = {
    he: ['תפריט','סגירה'], ar: ['القائمة','إغلاق'], en: ['Menu','Close']
  };
  function syncDrawer() {
    const open = mobile.matches && toggle.getAttribute('aria-expanded') === 'true';
    main.inert = open;
    const label = labels[document.documentElement.lang.split('-')[0]] || labels.he;
    toggle.setAttribute('aria-label', label[Number(open)]);
    toggle.setAttribute('translate','no');
    toggle.lastElementChild.textContent = label[Number(open)];
    if (open) toggle.focus({preventScroll:true});
  }
  new MutationObserver(syncDrawer).observe(toggle,{attributes:true,attributeFilter:['aria-expanded']});
  document.addEventListener('merhav:languagechange',syncDrawer);
  mobile.addEventListener('change', () => {
    if (!mobile.matches && toggle.getAttribute('aria-expanded') === 'true') toggleWorkspaceMenu(toggle);
    syncDrawer();
  });
  scrim.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') toggleWorkspaceMenu(toggle);
    toggle.focus({preventScroll:true});
  });
  rail.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !mobile.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
    const items = Array.from(rail.querySelectorAll('button:not([disabled]),a[href],select:not([disabled])'))
      .filter(item=>item.getClientRects().length);
    const end = event.shiftKey ? items[0] : items[items.length-1];
    if (document.activeElement === end) {
      event.preventDefault();
      (event.shiftKey ? items[items.length-1] : items[0]).focus();
    }
  });
  syncDrawer();
});

function mountEdgeRail(rail) {
  const desktop = window.matchMedia('(min-width:851px) and (hover:hover) and (pointer:fine)');
  const edge = document.createElement('button');
  edge.type = 'button';
  edge.id = 'workspace-rail-handle';
  rail.id = 'workspace-sidebar';
  edge.setAttribute('aria-controls',rail.id);
  edge.setAttribute('data-ui-title','אזורי עבודה');
  edge.setAttribute('data-ui-aria','אזורי עבודה');
  edge.title = edge.ariaLabel = uiText('אזורי עבודה');
  rail.before(edge);

  const menu = document.createElement('button');
  menu.id = 'workspace-page-menu';
  menu.type = 'button';
  menu.setAttribute('aria-controls', rail.id);
  menu.setAttribute('data-ui-aria', 'אזורי עבודה');
  menu.setAttribute('data-ui-title', 'אזורי עבודה');
  menu.title = menu.ariaLabel = uiText('אזורי עבודה');
  menu.innerHTML = '<span aria-hidden="true"></span>';
  document.querySelector('.workspace-heading')?.prepend(menu);

  let returnButton = edge;
  let closeTimer;
  function setOpen(open) {
    clearTimeout(closeTimer);
    document.body.toggleAttribute('data-rail-open',desktop.matches && open);
    for (const trigger of [edge, menu]) trigger.setAttribute('aria-expanded', String(desktop.matches && open));
    rail.inert = desktop.matches && !open;
  }
  function maybeClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!rail.matches(':hover') && !edge.matches(':hover') && !rail.querySelector(':focus-visible')) setOpen(false);
    },160);
  }
  for (const area of [edge,rail]) {
    area.addEventListener('pointerenter',event=>{
      if (desktop.matches && event.pointerType!=='touch') setOpen(true);
    });
    area.addEventListener('pointerleave',()=>{ if(desktop.matches) maybeClose(); });
  }
  rail.addEventListener('click', event => {
    const navigation = event.composedPath().find(node =>
      node instanceof Element && (node.hasAttribute('data-workspace-section') || node.hasAttribute('data-statistics')));
    if (!desktop.matches || !navigation) return;
    setOpen(false);
    if (event.detail === 0) {
      const target = document.querySelector('.desk-research-focus:not([hidden]) .desk-deck h3, .desk-library:not([hidden]) h2, .desk-empty h2') || document.querySelector('#title');
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
      }
    }
  });
  menu.addEventListener('click', () => {
    returnButton = menu;
    setOpen(true);
    (rail.querySelector('#nav [aria-current="page"]') || rail.querySelector('#nav button'))?.focus({preventScroll:true});
  });
  edge.addEventListener('click',event=>{
    returnButton = edge;
    setOpen(true);
    if (event.detail===0) (rail.querySelector('#nav [aria-current="page"]') || rail.querySelector('#nav button'))?.focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{
    if (event.key!=='Escape' || !document.body.hasAttribute('data-rail-open') || document.querySelector('dialog[open]')) return;
    const returnFocus=rail.contains(document.activeElement);
    setOpen(false);
    if (returnFocus) (returnButton.getClientRects().length ? returnButton : edge).focus({preventScroll:true});
  });
  document.addEventListener('focusin',event=>{
    if (desktop.matches && event.target!==edge && !rail.contains(event.target) && !rail.matches(':hover')) setOpen(false);
  });
  document.addEventListener('pointerdown',event=>{
    if (desktop.matches && event.target!==edge && !rail.contains(event.target)) setOpen(false);
  });
  function sync() {
    document.body.toggleAttribute('data-edge-rail',desktop.matches);
    setOpen(false);
  }
  desktop.addEventListener('change',sync);
  sync();
}
