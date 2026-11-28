// Research library filters are independent of filters on other workspace pages.
const deskFilters = {query:'', status:'', sort:'saved'};
const deskSortOptions = [
  ['saved','סדר שמור'], ['updated','עדכון אחרון'], ['title','שם'], ['due','מועד יעד']
];

function withDeskFilters(callback) {
  const previous = [q, filter, sort];
  q = deskFilters.query;
  filter = deskFilters.status;
  sort = deskFilters.sort;
  try { return callback(); }
  finally { [q, filter, sort] = previous; }
}

function deskFilteredPapers() {
  return withDeskFilters(() => sort === 'saved' ? articleOrder().filter(matches) : sorted(S.papers));
}

function renderDeskLibrary() {
  const filters = withDeskFilters(() => workspaceFilterOptions());
  return `<section class="desk-library" aria-labelledby="desk-library-title" data-motion="${deskMotionEnabled()?'on':'off'}">
    <h1 id="desk-library-title">${esc(uiText('כל המחקרים'))}</h1>
    <div class="desk-library-filters">
      <input type="search" data-library-search aria-label="${esc(uiText('חיפוש במחקרים'))}" placeholder="${esc(uiText('חיפוש ברשומות…'))}" value="${esc(deskFilters.query)}" oninput="updateDeskFilter('query',this.value)">
      <select data-library-filter aria-label="${esc(uiText('סינון'))}" onchange="updateDeskFilter('status',this.value)"><option value="">${esc(uiText('כל הרשומות'))}</option>${filters}</select>
      <select data-library-sort aria-label="${esc(uiText('מיון'))}" onchange="updateDeskFilter('sort',this.value)">
        ${deskSortOptions.map(([key,label]) => `<option value="${key}" ${deskFilters.sort === key ? 'selected' : ''}>${esc(uiText(label))}</option>`).join('')}
      </select>
    </div>
    <div class="desk-library-results">${researchLibrary()}</div>
    ${deskPaperOrder()}
  </section>`;
}

function updateDeskFilter(key, value) {
  deskFilters[key] = value;
  const libraryResults = document.querySelector('.desk-library-results');
  const from = deskGlobeFill(libraryResults.querySelector('.desk-dial'));
  libraryResults.innerHTML = researchLibrary();
  animateDeskGlobe(libraryResults.querySelector('.desk-dial'), from);
  bindPaperDrag();
}

function bindDeskDepth(library) {
  if (!library) return;
  let frame = 0, x = 0, y = 0, stage = null;
  library.addEventListener('pointermove', event => {
    const surface = event.target.closest('.desk-instrument');
    if (!surface || event.pointerType !== 'mouse' || !deskMotionEnabled()) return;
    stage = surface.querySelector('.desk-depth');
    if (!stage) return;
    const bounds = surface.getBoundingClientRect();
    x = ((event.clientX - bounds.left) / bounds.width - .5) * 10;
    y = ((event.clientY - bounds.top) / bounds.height - .5) * -10;
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      if (!stage?.isConnected || !deskMotionEnabled()) return;
      stage.style.setProperty('--desk-tilt-x', y.toFixed(1) + 'deg');
      stage.style.setProperty('--desk-tilt-y', x.toFixed(1) + 'deg');
    });
  }, {passive:true});
  library.addEventListener('pointerout', event => {
    const surface = event.target.closest('.desk-instrument');
    if (!surface || surface.contains(event.relatedTarget)) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const current = surface.querySelector('.desk-depth');
    current?.style.removeProperty('--desk-tilt-x');
    current?.style.removeProperty('--desk-tilt-y');
  });
}
