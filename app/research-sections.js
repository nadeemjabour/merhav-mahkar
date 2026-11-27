// Keep the original registry actions and metadata available in a more readable card layout.
function enhanceResearchRegistry() {
  if (paperId || !['tools','opportunities'].includes(view)) return;
  const table = document.querySelector('#body .registry-heading ~ .panel.scroll table');
  if (!table) return;
  const headings = Array.from(table.querySelectorAll('thead th'), cell => cell.textContent.trim());
  table.classList.add('research-registry-cards');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  rows.forEach(row => {
    Array.from(row.cells).forEach((cell, index) => {
      if (headings[index]) cell.dataset.label = headings[index];
    });
  });
  if (view !== 'tools' || !rows.length) return;
  const labels = {
    he: ['חיפוש בכלי מחקר', 'אין כלי מחקר התואמים לחיפוש'],
    en: ['Search research instruments', 'No instruments match your search'],
    ar: ['البحث في أدوات البحث', 'لا توجد أدوات تطابق البحث']
  };
  const [placeholder, noResults] = labels[document.documentElement.lang.split('-')[0]] || labels.he;
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'instrument-registry-search';
  search.placeholder = placeholder;
  search.setAttribute('aria-label', placeholder);
  search.value = window.instrumentRegistryQuery || '';
  const empty = document.createElement('p');
  empty.className = 'instrument-registry-empty';
  empty.textContent = noResults;
  table.parentElement.before(search);
  table.parentElement.after(empty);
  const filterRows = () => {
    const query = search.value.trim().toLocaleLowerCase();
    window.instrumentRegistryQuery = search.value;
    let visible = 0;
    rows.forEach(row => {
      const matches = row.textContent.toLocaleLowerCase().includes(query);
      row.hidden = !matches;
      if (matches) visible++;
    });
    empty.hidden = visible > 0;
  };
  search.addEventListener('input', filterRows);
  filterRows();
}

function activityTimeline() {
  const text = {
    he:{title:'יומן פעילות',intro:'הפעילויות החשובות במרחב המחקר',list:'יומן',calendar:'לוח שנה',all:'כל המחקרים',type:'כל סוגי הפעילות',add:'הוספת פעילות',empty:'אין פעילויות חשובות להצגה',more:'הצגת פעילויות נוספות',study:'מחקר',open:'פתיחת המחקר'},
    en:{title:'Activity log',intro:'Important activity across your research workspace',list:'Timeline',calendar:'Calendar',all:'All studies',type:'All activity',add:'Add activity',empty:'No important activity to display',more:'Show more activity',study:'Study',open:'Open study'},
    ar:{title:'سجل النشاط',intro:'الأنشطة المهمة في مساحة البحث',list:'السجل',calendar:'التقويم',all:'جميع الأبحاث',type:'كل الأنشطة',add:'إضافة نشاط',empty:'لا توجد أنشطة مهمة لعرضها',more:'عرض المزيد من الأنشطة',study:'البحث',open:'فتح البحث'}
  }[document.documentElement.lang.split('-')[0]];
  const types = {research:'מחקרים וייבוא',documents:'מסמכים וגרסאות',files:'קבצים ושיוכים',backup:'גיבוי ושחזור',milestone:'אבני דרך'};
  const events = S.activity.filter(item => {
    const type = importantActivity(item);
    return type && (!window.activityPaper || item.paperId === window.activityPaper) &&
      (!window.activityType || type === window.activityType);
  }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const selected = (value,current) => value === current ? 'selected' : '';
  const language = uiLocale();
  const limit = window.activityLimit || 20;
  return `<section class="activity-timeline-workspace"><header class="activity-timeline-header">
    <div><h2>${text.title}</h2><p>${text.intro}</p></div><button type="button" class="primary" onclick="addCalendarActivity(today())">＋ ${text.add}</button>
  </header>
  <div class="activity-timeline-controls">
    <div class="activity-view-switch" role="group" aria-label="${text.title}">
      <button type="button" aria-pressed="true">${text.list}</button>
      <button type="button" aria-pressed="false" onclick="window.activityView='calendar';renderBody()">${text.calendar}</button>
    </div>
    <select aria-label="${text.study}" onchange="window.activityPaper=this.value;renderBody()"><option value="">${text.all}</option>
      ${S.papers.map(p=>`<option value="${esc(p.id)}" ${selected(p.id,window.activityPaper)}>${esc([p.code,p.title].filter(Boolean).join(' — '))}</option>`).join('')}</select>
    <select aria-label="${text.type}" onchange="window.activityType=this.value;renderBody()"><option value="">${text.type}</option>
      ${Object.entries(types).map(([key,label])=>`<option value="${key}" ${selected(key,window.activityType)}>${esc(uiText(label))}</option>`).join('')}</select>
  </div>
  <div class="activity-timeline-list">${events.length ? events.slice(0,limit).map(item=>{
    const type = importantActivity(item);
    const validDate = item.date && Number.isFinite(new Date(item.date).getTime());
    const when = validDate ? new Date(item.date).toLocaleString(language,{timeZone:'Asia/Jerusalem',dateStyle:'medium',timeStyle:'short'}) : '';
    return `<article class="activity-timeline-item"><span class="activity-timeline-icon" aria-hidden="true">${workspaceIcon(type==='files'?'files':type==='research'?'papers':type==='documents'?'writing':'activity')}</span>
      <div><small>${esc(uiText(types[type]||'אבני דרך'))} · ${esc(when)}</small><p dir="auto">${esc(item.message||'')}</p><span dir="auto">${esc(pname(item.paperId))}</span></div>
      ${item.paperId?`<button type="button" data-paper-id="${esc(item.paperId)}" onclick="openPaper(this.dataset.paperId)">${text.open}</button>`:''}</article>`;
  }).join('') : `<p class="activity-timeline-empty">${text.empty}</p>`}
  ${events.length > limit ? `<button class="activity-more" type="button" onclick="window.activityLimit=(window.activityLimit||20)+20;renderBody()">${text.more}</button>` : ''}</div></section>`;
}

function installResearchSections() {
  const previousBody = renderBody;
  renderBody = function() {
    const result = previousBody();
    enhanceResearchRegistry();
    return result;
  };
  const originalActivity = activity;
  activity = function() {
    if (window.activityView !== 'calendar') return activityTimeline();
    const labels = {he:'חזרה ליומן',en:'Back to timeline',ar:'العودة إلى السجل'};
    const label = labels[document.documentElement.lang.split('-')[0]] || labels.he;
    return `<button type="button" class="activity-back" onclick="window.activityView='timeline';renderBody()">${label}</button>` + originalActivity();
  };
}
