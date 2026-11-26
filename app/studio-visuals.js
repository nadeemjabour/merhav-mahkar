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
