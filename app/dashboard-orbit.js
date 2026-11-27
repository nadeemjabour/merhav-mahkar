/* One research desk with separate, isolated library filters. */
(function setupResearchDesk() {
  let researchMode = 'focus';
  const libraryFilters = { query:'', status:'', sort:'updated' };

  function withLibraryFilters(callback) {
    const previous = [q, filter, sort];
    q = libraryFilters.query;
    filter = libraryFilters.status;
    sort = libraryFilters.sort;
    try { return callback(); }
    finally { [q, filter, sort] = previous; }
  }

  window.deskFilteredPapers = () => withLibraryFilters(() => sorted(S.papers));
  window.openDeskLibrary = () => { researchMode = 'library'; };
  window.syncDeskStudy = id => {
    if (id === deskFocusId) return;
    if (document.querySelector('.desk-deck')) chooseDeskStudy(id);
    else deskFocusId = id;
  };

  function bindDeskDepth(deck) {
    if (!deck) return;
    let frame = 0, x = 0, y = 0, stage = null;
    deck.addEventListener('pointermove', event => {
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
    deck.addEventListener('pointerout', event => {
      const surface = event.target.closest('.desk-instrument');
      if (!surface || surface.contains(event.relatedTarget)) return;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      const current = surface.querySelector('.desk-depth');
      current?.style.removeProperty('--desk-tilt-x');
      current?.style.removeProperty('--desk-tilt-y');
    });
  }

  function makeDeskLibrary() {
    const library = document.createElement('div');
    library.className = 'desk-library';
    const options = withLibraryFilters(() => workspaceFilterOptions());
    library.innerHTML = `<div class="desk-library-head"><h2>${esc(uiText('כל המחקרים'))}</h2><button type="button" class="desk-library-back">${workspaceIcon('dashboard')} ${esc(uiText('חזרה למחקר הפעיל'))}</button></div>
      <div class="desk-library-filters">
        <input type="search" data-library-search aria-label="${esc(uiText('חיפוש במחקרים'))}" placeholder="${esc(uiText('חיפוש ברשומות…'))}">
        <select data-library-filter aria-label="${esc(uiText('סינון'))}"><option value="">${esc(uiText('כל הרשומות'))}</option>${options}</select>
        <select data-library-sort aria-label="${esc(uiText('מיון'))}"><option value="updated">${esc(uiText('עדכון אחרון'))}</option><option value="title">${esc(uiText('שם'))}</option><option value="due">${esc(uiText('מועד יעד'))}</option></select>
      </div><div class="desk-library-results"></div>`;
    const search = library.querySelector('[data-library-search]');
    const status = library.querySelector('[data-library-filter]');
    const sortBy = library.querySelector('[data-library-sort]');
    const results = library.querySelector('.desk-library-results');
    search.value = libraryFilters.query;
    status.value = libraryFilters.status;
    sortBy.value = libraryFilters.sort;
    function refresh(preferActive = false) {
      if (preferActive && window.deskFilteredPapers().some(p => p.id === deskFocusId)) galleryPaperId = deskFocusId;
      results.innerHTML = researchLibrary();
      bindPaperDrag();
    }
    search.addEventListener('input', () => { libraryFilters.query = search.value; refresh(true); });
    status.addEventListener('change', () => { libraryFilters.status = status.value; refresh(true); });
    sortBy.addEventListener('change', () => { libraryFilters.sort = sortBy.value; refresh(true); });
    refresh();
    return { library, refresh };
  }

  window.organizeResearchDesk = function organizeResearchDesk() {
    const body = document.querySelector('#body');
    const top = body?.querySelector('.workspace-top');
    if (!body || !top) return;

    // Put the carousel first, and keep the writing, metrics and reminders below it.
    top.querySelector('.desk-intro')?.remove();
    const deck = top.querySelector('.desk-deck');
    const focus = document.createElement('section');
    focus.className = 'desk-research-focus';
    focus.setAttribute('aria-label',uiText('המחקרים שלי'));
    if (deck) focus.append(deck);
    else {
      const emptyDesk = document.createElement('div');
      emptyDesk.className = 'desk-empty';
      emptyDesk.innerHTML = `<div class="desk-empty-orb" aria-hidden="true"></div><div><h2>${esc(uiText('המחקר הראשון מתחיל כאן'))}</h2><p>${esc(uiText('הוסיפו מחקר כדי להתחיל לעקוב אחר ההתקדמות והמשימות.'))}</p><button type="button" class="primary" onclick="edit('papers')">${esc(uiText('＋ מחקר חדש'))}</button></div>`;
      focus.append(emptyDesk);
    }
    const {library, refresh} = makeDeskLibrary();
    top.prepend(focus,library);

    function showResearchMode(mode, moveFocus) {
      researchMode = mode;
      focus.hidden = mode !== 'focus';
      library.hidden = mode !== 'library';
      if (mode === 'library') {
        if (window.deskFilteredPapers().some(p => p.id === deskFocusId)) galleryPaperId = deskFocusId;
        refresh();
        if (moveFocus) library.querySelector('[data-library-search]').focus({preventScroll:true});
      } else if (moveFocus) focus.querySelector('.desk-open-library')?.focus({preventScroll:true});
    }
    if (deck) {
      const controls = deck.querySelector('.desk-controls');
      const libraryButton = document.createElement('button');
      libraryButton.type = 'button';
      libraryButton.className = 'desk-open-library';
      libraryButton.innerHTML = workspaceIcon('papers') + ' ' + esc(uiText('כל המחקרים'));
      libraryButton.addEventListener('click', () => showResearchMode('library',true));
      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'desk-add-study';
      addButton.textContent = uiText('＋ מחקר חדש');
      addButton.addEventListener('click', () => edit('papers'));
      controls.prepend(libraryButton,addButton);
    }
    library.querySelector('.desk-library-back').addEventListener('click', () => showResearchMode('focus',true));
    showResearchMode(researchMode,false);
    bindDeskDepth(deck);
  };
})();
