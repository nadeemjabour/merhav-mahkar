'use strict';

let selectedEvidenceId = '';

function chapterEvidence(paper, chapter) {
  return S.sources.filter(source =>
    (chapter && source.chapterId === chapter) ||
    (paper && (source.paperId === paper || source.paperIds?.includes(paper)))
  );
}

function sourceById(id) {
  return S.sources.find(source => String(source.id) === String(id));
}

function sourceCredit(source) {
  return [source.authors, source.year, source.journal].filter(Boolean).join(' · ');
}

function sourceStatusLabel(status) {
  const statuses = schemas.sources.find(([key]) => key === 'status')[2];
  return statuses.includes(status) ? uiText(status) : status;
}

function sourcePick(source, selected = false) {
  const credit = sourceCredit(source);
  return `<button type="button" class="evidence-item" data-source-id="${esc(source.id)}" aria-current="${selected}">
    <span class="evidence-icon" aria-hidden="true">${workspaceIcon('sources')}</span>
    <span class="evidence-item-text"><strong dir="auto">${esc(source.title || uiText('מקור ללא כותרת'))}</strong>
    ${credit ? `<small dir="auto">${esc(credit)}</small>` : ''}</span>
    ${source.status ? `<span class="evidence-status">${esc(sourceStatusLabel(source.status))}</span>` : ''}
  </button>`;
}

function sourceDetail(source) {
  const credit = sourceCredit(source);
  const details = [
    ['פרטים ביבליוגרפיים', source.bibliography], ['DOI', source.doi],
    ['מטרות המקור', source.goals], ['אוכלוסייה', source.population], ['שיטה', source.method],
    ['ממצאים', source.findings], ['מגבלות', source.limitations], ['תרומה למחקר', source.contribution],
    ['ציטוטים ומספרי עמודים', source.quotes], ['שינויים בעקבות הקריאה', source.changes]
  ].filter(([, value]) => value);
  const file = source.fileId && S.files.find(file => file.id === source.fileId && !file.sensitive);
  const external = /^https?:\/\//i.test(source.link || '');
  return `<article class="evidence-reading">
    <h3 dir="auto">${esc(source.title || uiText('מקור ללא כותרת'))}</h3>
    ${credit ? `<p class="evidence-credit" dir="auto">${esc(credit)}</p>` : ''}
    ${source.status ? `<span class="evidence-status">${esc(sourceStatusLabel(source.status))}</span>` : ''}
    ${details.length ? `<dl>${details.map(([label, value]) =>
      `<div><dt>${esc(uiText(label))}</dt><dd dir="auto">${esc(value)}</dd></div>`).join('')}</dl>` : ''}
    ${external || file ? `<div class="evidence-links">
      ${external ? `<a href="${esc(source.link)}" target="_blank" rel="noopener noreferrer">${uiText("פתיחת המקור החיצוני ↗")}</a>` : ''}
      ${file ? `<a href="/api/file/${encodeURIComponent(file.id)}">${esc(file.name || uiText('הורדת הקובץ'))}</a>` : ''}
    </div>` : ''}
  </article>`;
}

function sourceEditButton(source) {
  return `<button type="button" class="evidence-edit" data-edit-source="${esc(source.id)}">${workspaceIcon('writing')} ${uiText("עריכת מקור")}</button>`;
}

function auroraSourceToolbar() {
  if (sort === 'due') sort = 'updated';
  const options = schemas.sources.find(([key]) => key === 'status')[2];
  return `<div class="toolbar evidence-filters">
    <label>${uiText("חיפוש במקורות")}<input type="search" dir="auto" value="${esc(q)}" placeholder="${uiText("כותרת, מחבר או מילת מפתח")}" oninput="q=this.value;renderBody()"></label>
    <label>${uiText("מצב קריאה")}<select onchange="filter=this.value;renderBody()"><option value="">${uiText("כל המצבים")}</option>${opts(options)}</select></label>
    <label>${uiText("מיון")}<select onchange="sort=this.value;renderBody()"><option value="updated" ${sort !== 'title'?'selected':''}>${uiText("עדכון אחרון")}</option><option value="title" ${sort === 'title'?'selected':''}>${uiText("כותרת")}</option></select></label>
  </div>`;
}

function auroraSourceLibrary() {
  const rows = sorted(S.sources);
  const current = rows.find(source => String(source.id) === selectedEvidenceId) || rows[0];
  return `<section class="evidence-library" aria-labelledby="evidence-library-title">
    <div class="evidence-library-heading"><div><h2 id="evidence-library-title">${uiText("ספריית המקורות")}</h2>
    <span class="muted" role="status">${rows.length} ${uiText("מקורות")}</span></div>
    <button type="button" class="primary" onclick="edit('sources')">${uiText("＋ הוספת מקור")}</button></div>
    ${current ? `<div class="evidence-columns"><div class="evidence-list" aria-label="${uiText("רשימת המקורות")}">
      ${rows.map(source => sourcePick(source, source === current)).join('')}
    </div><section class="evidence-preview" aria-label="${uiText("פרטי המקור")}">${sourceDetail(current)}${sourceEditButton(current)}</section></div>` :
    empty(S.sources.length ? 'אין מקורות התואמים לחיפוש או לסינון.' : 'ספריית המקורות ריקה. אפשר להוסיף את המקור הראשון.')}
  </section>`;
}

function showLibrarySource(button) {
  const library = button.closest('.evidence-library');
  const source = sourceById(button.dataset.sourceId);
  if (!source) return;
  selectedEvidenceId = String(source.id);
  library.querySelector('[aria-current="true"]')?.setAttribute('aria-current', 'false');
  button.setAttribute('aria-current', 'true');
  library.querySelector('.evidence-preview').innerHTML = sourceDetail(source) + sourceEditButton(source);
  if (window.matchMedia('(max-width: 700px)').matches) openEvidenceSheet(button, source);
}

function openEvidenceSheet(opener, source) {
  const sheet = document.getElementById('aurora-evidence');
  const editor = opener.closest('.workspace-editor');
  const draft = editor?.elements.content;
  const parent = editor?.closest('dialog');
  const position = draft && {
    start: draft.selectionStart, end: draft.selectionEnd, direction: draft.selectionDirection,
    top: draft.scrollTop, left: draft.scrollLeft, dialogTop: parent.scrollTop
  };
  const showMaterials = Boolean(editor && !source);
  const chapterId = editor?.dataset.chapterId;
  const chapter = editor && S.chapters.find(item => String(item.id) === chapterId);
  const paper = chapter?.paperId || editor?.dataset.paperId || paperId;
  const evidence = showMaterials ? chapterEvidence(paper, chapter?.id) : [];
  const files = showMaterials ? S.files.filter(file => !file.sensitive && (chapter ? file.chapterId === chapter.id : paper && file.paperId === paper)) : [];
  sheet.innerHTML = `<header class="evidence-sheet-head"><h2 id="evidence-sheet-title">${showMaterials ? uiText('חומרי המחקר') : uiText('פרטי המקור')}</h2>
    <button type="button" class="evidence-close" aria-label="${uiText("סגירה")}" autofocus>×</button></header><div class="evidence-sheet-body">
    ${showMaterials ? `<div data-evidence-index><h3>${uiText("מקורות")}</h3>${evidence.length ? evidence.map(item=>sourcePick(item)).join('') : ("<p class=\"muted\">" + uiText("טרם שויכו מקורות.") + "</p>")}
      <h3>${uiText("קבצים מקושרים")}</h3>${workspaceFileList(files)}</div><div data-evidence-content hidden></div>` :
      sourceDetail(source) + (editor ? '' : sourceEditButton(source))}
    </div>`;
  sheet.onclick = event => {
    const editButton = event.target.closest('[data-edit-source]');
    if (editButton) {
      sheet.close('edit');
      return;
    }
    if (event.target.closest('.evidence-close')) {
      sheet.close();
      return;
    }
    const item = event.target.closest('[data-source-id]');
    const back = event.target.closest('[data-evidence-back]');
    if (!item && !back) return;
    const index = sheet.querySelector('[data-evidence-index]');
    const content = sheet.querySelector('[data-evidence-content]');
    if (item) {
      const selected = evidence.find(ref => String(ref.id) === item.dataset.sourceId);
      if (!selected) return;
      content.innerHTML = `<button type="button" data-evidence-back>${uiText("חזרה למקורות")}</button>${sourceDetail(selected)}`;
      index.hidden = true;
      content.hidden = false;
      content.querySelector('button').focus();
      content.dataset.selected = String(selected.id);
    } else {
      content.hidden = true;
      index.hidden = false;
      Array.from(index.querySelectorAll('[data-source-id]')).find(button => button.dataset.sourceId === content.dataset.selected)?.focus();
    }
  };
  sheet.addEventListener('close', () => {
    sheet.onclick = null;
    if (draft?.isConnected && parent.open) {
      draft.focus({ preventScroll: true });
      draft.setSelectionRange(position.start, position.end, position.direction);
      draft.scrollTop = position.top;
      draft.scrollLeft = position.left;
      parent.scrollTop = position.dialogTop;
    } else if (opener.isConnected) {
      opener.focus({ preventScroll: true });
    }
    if (sheet.returnValue === 'edit' && source && !editor) edit('sources', source.id);
  }, { once: true });
  sheet.returnValue = '';
  sheet.showModal();
  sheet.scrollTop = 0;
}

function switchPaperTab(button) {
  if (tab === button.dataset.paperTab) return;
  const previous = button.closest('nav').scrollLeft;
  tab = button.dataset.paperTab;
  renderBody();
  const current = document.querySelector('.workspace-project-tabs [aria-current="page"]');
  if (current) {
    current.closest('nav').scrollLeft = previous;
    current.focus({ preventScroll: true });
  }
}

function bindAuroraControls() {
  const editorModal = document.getElementById('modal');
  const evidenceSheet = document.getElementById('aurora-evidence');
  const dirtyForms = new WeakSet();
  let pressedBackdrop = null;

  function outsideDialog(event) {
    const dialog = event.target;
    if (dialog !== editorModal && dialog !== evidenceSheet) return null;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom ? dialog : null;
  }

  function mayDismiss(dialog) {
    const form = dialog.querySelector('form');
    if (!form) return true;
    if (form.querySelector('button[type="submit"]:disabled')) return false;
    return form.dataset.draftKey || !dirtyForms.has(form) || window.confirm('לסגור בלי לשמור את השינויים בטופס?');
  }

  function closeMenu(returnFocus) {
    const toggle = document.getElementById('workspace-nav-toggle');
    if (toggle.getAttribute('aria-expanded') === 'true') {
      toggleWorkspaceMenu(toggle);
      if (returnFocus) toggle.focus();
      return true;
    }
    return false;
  }

  for (const eventName of ['input', 'change']) {
    editorModal.addEventListener(eventName, event => {
      if (event.target.form) dirtyForms.add(event.target.form);
    });
  }
  editorModal.addEventListener('cancel', event => {
    if (!mayDismiss(editorModal)) event.preventDefault();
  });
  document.addEventListener('pointerdown', event => { pressedBackdrop = outsideDialog(event); });
  document.addEventListener('pointercancel', () => { pressedBackdrop = null; });
  document.addEventListener('click', event => {
    const dialog = outsideDialog(event);
    if (dialog && dialog === pressedBackdrop && mayDismiss(dialog)) dialog.close();
    pressedBackdrop = null;
    const target = event.target;
    if (!target.closest('body > aside')) closeMenu(false);
    document.querySelectorAll('details.desk-actions[open]').forEach(menu => {
      if (!menu.contains(target)) menu.open = false;
    });
    if (target.closest('#aurora-evidence')) return;
    const editButton = target.closest('[data-edit-source]');
    const opener = target.closest('[data-evidence-open]');
    const sourceButton = target.closest('button[data-source-id]');
    if (editButton) {
      const source = sourceById(editButton.dataset.editSource);
      if (source) edit('sources', source.id);
    } else if (opener) {
      openEvidenceSheet(opener);
    } else if (sourceButton?.closest('.workspace-editor')) {
      const source = sourceById(sourceButton.dataset.sourceId);
      if (source) openEvidenceSheet(sourceButton, source);
    } else if (sourceButton?.closest('.evidence-library')) {
      showLibrarySource(sourceButton);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    const menu = document.querySelector('details.desk-actions[open]');
    if (menu) {
      menu.open = false;
      menu.querySelector('summary').focus();
    } else if (!closeMenu(true)) return;
    event.preventDefault();
  });
}
