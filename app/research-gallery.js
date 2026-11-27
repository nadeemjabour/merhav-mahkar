// The selected study is a browsing preference. Sorting and filtering never change paper order.
let galleryPaperId = '';
const galleryLayouts = [['carousel', 'קרוסלה'], ['cards', 'כרטיסים'], ['list', 'רשימה']];

function galleryMode() {
  if (window.paperLayout) return window.paperLayout;
  try {
    const saved = localStorage.getItem('merhav-paper-layout');
    if (galleryLayouts.some(([value]) => value === saved)) return saved;
  } catch {}
  return 'carousel';
}

function changeGalleryMode(mode) {
  window.paperLayout = mode;
  try { localStorage.setItem('merhav-paper-layout', mode); } catch {}
  renderBody();
  document.querySelector('[data-gallery-mode][aria-pressed="true"]')?.focus({preventScroll:true});
}

function galleryPapers() {
  return view === 'dashboard' && !paperId && window.deskFilteredPapers
    ? window.deskFilteredPapers()
    : sorted(S.papers);
}

function researchLibrary() {
  const papers = galleryPapers();
  const mode = galleryMode();
  const toggles = galleryLayouts.map(([key,label]) =>
    `<button type="button" data-gallery-mode="${key}" aria-pressed="${key === mode}"
      onclick="changeGalleryMode(this.dataset.galleryMode)">${uiText(label)}</button>`).join('');
  const header = `<header class="gallery-tools"><div class="gallery-switch" role="group"
    aria-label="${uiText('תצוגת מחקרים')}">${toggles}</div>
    ${action(uiText('＋ מחקר חדש'),"edit('papers')",'primary')}</header>`;
  if (!papers.length) {
    return header + empty(uiText(S.papers.length ? 'לא נמצאו מחקרים התואמים לסינון' :
      'המרחב מוכן למחקר הראשון שלכם. הוסיפו מאמר, פרקים ומשימות.'));
  }
  if (mode === 'list') return header + researchPaperTable(papers);
  if (mode === 'cards') return header + `<div class="grid">${papers.map(paperCard).join('')}</div>`;
  return header + researchCarousel(papers);
}

function galleryNeighbor(paper, position, label) {
  if (!paper) return '<div class="gallery-spacer" aria-hidden="true"></div>';
  return `<button type="button" class="gallery-neighbor gallery-${position}" data-gallery-id="${esc(paper.id)}"
    aria-label="${uiText(label)} · ${esc(paper.title)}">
    <span class="gallery-caption">${uiText(label)}</span>
    <b dir="auto">${esc(paper.title)}</b>
    <span class="gallery-edge-arrow" aria-hidden="true">${position === 'prev' ? '‹' : '›'}</span></button>`;
}

function researchCarousel(papers) {
  const index = Math.max(0, papers.findIndex(p => p.id === galleryPaperId));
  const paper = papers[index];
  galleryPaperId = paper.id;
  const {n, total, pct} = progress(paper);
  const number = new Intl.NumberFormat(uiLocale());
  const percent = new Intl.NumberFormat(uiLocale(), {style:'percent'}).format(pct / 100);
  const circular = papers.length > 2;
  const previous = papers[index - 1] || (circular ? papers.at(-1) : null);
  const following = papers[index + 1] || (circular ? papers[0] : null);
  const jump = papers.map((p,i) => `<option value="${esc(p.id)}" ${i === index ? 'selected' : ''}>${number.format(i+1)} · ${esc(p.title)}</option>`).join('');
  const task = next(paper, uiText('טרם הוגדרה משימה הבאה'));
  function pagerButton(step, target, label) {
    const hint = uiText(label) + (target ? ' · ' + target.title : '');
    return `<button type="button" data-gallery-step="${step}" aria-label="${esc(hint)}" title="${esc(hint)}" ${target ? '' : 'disabled'}><span aria-hidden="true">${step < 0 ? '‹' : '›'}</span></button>`;
  }
  return `<section class="research-gallery" tabindex="0" aria-label="${uiText('קרוסלת מחקרים')}"
    onkeydown="galleryKey(event)" onclick="galleryClick(event)"
    ontouchstart="galleryTouchStart(event)" ontouchend="galleryTouchEnd(event)" ontouchcancel="galleryGesture=null">
    <div class="gallery-stage" data-single="${papers.length === 1}">
      ${galleryNeighbor(previous,'prev','המחקר הקודם')}
      <article class="gallery-sheet" aria-labelledby="gallery-heading">
        <div class="gallery-sheet-head"><bdi>${esc(paper.code)}</bdi>${badge(paper.work)}${late(paper)}</div>
        <div class="gallery-sheet-middle"><div><h2 id="gallery-heading" dir="auto">${esc(paper.title)}</h2>
          <div class="gallery-metadata">${[paper.status && displayChoice(paper.status,statuses),paper.due && uiText('יעד')+' '+date(paper.due),paper.language && uiPaperLanguage(paper.language)].filter(Boolean).map(esc).join(' · ')}</div>
        </div><div class="gallery-progress"><div class="gallery-ring" style="--arc:${pct*3.6}deg"><b dir="ltr">${percent}</b></div>
          <small>${number.format(n)}/${number.format(total)} ${uiText('משימות ופרקים הושלמו')}</small></div></div>
        <div class="gallery-task"><span>${uiText('הצעד הבא:')}</span><strong dir="auto">${esc(task)}</strong></div>
        <footer class="gallery-actions"><button type="button" data-gallery-action="open">${uiText('פתיחת מחקר ←')}</button>
          <button type="button" data-gallery-action="edit">${uiText('✎ עריכת מחקר')}</button></footer>
      </article>
      ${galleryNeighbor(following,'next','המחקר הבא')}
    </div>
    <div class="gallery-nav"><div class="gallery-pager">
      ${pagerButton(-1,previous,'המחקר הקודם')}
      <output dir="ltr" aria-live="polite" aria-atomic="true" aria-label="${uiText('מחקר נבחר')}">${number.format(index+1)} / ${number.format(papers.length)}<span class="gallery-sr"> · ${esc(paper.title)}</span></output>
      ${pagerButton(1,following,'המחקר הבא')}
    </div><label class="gallery-jump">${uiText('מעבר למחקר')}<select onchange="selectGalleryPaper(this.value,'select')">${jump}</select></label></div>
  </section>`;
}

function selectGalleryPaper(id, focusTarget) {
  const gallery = document.querySelector('.research-gallery');
  if (!gallery || !id || galleryPaperId === id) return;
  const papers = galleryPapers();
  const to = papers.findIndex(p => p.id === id);
  if (to < 0) return;
  galleryPaperId = id;
  if (view === 'dashboard' && !paperId) window.syncDeskStudy?.(id);
  const template = document.createElement('template');
  template.innerHTML = researchCarousel(papers);
  const updated = template.content.firstElementChild;
  gallery.querySelector('.gallery-stage').replaceWith(updated.querySelector('.gallery-stage'));
  gallery.querySelector('output').innerHTML = updated.querySelector('output').innerHTML;
  gallery.querySelector('select').value = galleryPaperId;
  for (const button of gallery.querySelectorAll('[data-gallery-step]')) {
    const replacement = updated.querySelector('[data-gallery-step="'+button.dataset.galleryStep+'"]');
    button.disabled = replacement.disabled;
    button.title = replacement.title;
    button.setAttribute('aria-label', replacement.getAttribute('aria-label'));
  }
  const dest = focusTarget === 'select' ? gallery.querySelector('select') :
    gallery.querySelector('[data-gallery-step="'+focusTarget+'"]:not(:disabled)');
  (dest || gallery).focus({preventScroll:true});
}

function stepGallery(by, focusTarget) {
  const papers = galleryPapers();
  const index = papers.findIndex(p => p.id === galleryPaperId);
  const target = papers.length > 2 ? (index + by + papers.length) % papers.length : index + by;
  selectGalleryPaper(papers[target]?.id, focusTarget);
}

function galleryClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.galleryId) return selectGalleryPaper(button.dataset.galleryId, 'stage');
  if (button.dataset.galleryStep) return stepGallery(Number(button.dataset.galleryStep), button.dataset.galleryStep);
  if (button.dataset.galleryAction === 'open') openPaper(galleryPaperId);
  if (button.dataset.galleryAction === 'edit') edit('papers',galleryPaperId);
}

function galleryKey(event) {
  if (event.target.closest('select,input,textarea') || event.altKey || event.ctrlKey || event.metaKey) return;
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home' || event.key === 'End') {
    const papers = galleryPapers();
    return selectGalleryPaper(papers.at(event.key === 'Home' ? 0 : -1)?.id, 'stage');
  }
  stepGallery((event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1), 'stage');
}

let galleryGesture = null;
function galleryTouchStart(event) {
  const point = event.touches[0];
  galleryGesture = event.touches.length === 1 && event.target.closest('.gallery-stage') &&
    !event.target.closest('button') ? [point.clientX,point.clientY] : null;
}
function galleryTouchEnd(event) {
  if (!galleryGesture) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - galleryGesture[0], dy = point.clientY - galleryGesture[1];
  galleryGesture = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
  stepGallery(Math.sign(dx) * (getComputedStyle(event.currentTarget).direction === 'rtl' ? 1 : -1), 'stage');
}

function researchPaperTable(papers) {
  return `<div class="panel scroll"><table><thead><tr><th>${uiText("קוד ושם")}</th><th>${uiText("נושא ושותפים")}</th><th>${uiText("שלב ומצב עבודה")}</th><th>${uiText("יעד")}</th><th>${uiText("התקדמות והצעד הבא")}</th></tr></thead><tbody>${papers.map(p=>{let v=progress(p);return `<tr><td><a href="#" onclick="openPaper('${p.id}');return false">${esc(p.code)} · ${esc(p.title)}</a><p>${esc(uiPaperLanguage(p.language))}</p></td><td>${esc(p.topic||uiText('לא הוזן'))}<p>${esc(p.partners||uiText('לא הוזן'))}</p></td><td>${esc(displayChoice(p.status,statuses))}<p>${badge(p.work)}</p></td><td>${date(p.due)} ${late(p)}<p class="muted">${uiText("עודכן")} ${date(p.updated)}</p></td><td>${v.n}/${v.total} ${uiText("הושלמו")}<p>${esc(next(p,uiText('טרם הוגדרה משימה הבאה')))}</p></td></tr>`}).join('')}</tbody></table></div>`;
}
