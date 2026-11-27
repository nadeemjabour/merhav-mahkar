// Uploaded files have individual identities. Chapter exports carry a study, chapter
// and format, which the export service also uses to mark earlier versions.
const cabinetViews = new Map();

function cabinetState() {
  const scope = paperId || '';
  if (!cabinetViews.has(scope)) cabinetViews.set(scope, {
    name:'', date:'', chapter:'', paper:scope ? '' : articleFilters.files || '',
    type:'', version:'', selected:''
  });
  return cabinetViews.get(scope);
}

function cabinetFiles() {
  return S.files.filter(f => (!paperId || f.paperId === paperId) && (!f.sensitive || (paperId && window.showInternal)));
}

function cabinetKey(file) {
  if (file.generated && file.paperId && file.chapterId && file.category === cats[0]) {
    return JSON.stringify(['export',file.paperId,file.chapterId,file.format || fileExtension(file)]);
  }
  return JSON.stringify(['file',file.id]);
}

function cabinetSize(bytes) {
  if (!Number.isFinite(Number(bytes)) || bytes == null) return '—';
  const n=Number(bytes), unit=n>=1048576?'MB':n>=1024?'KB':'B';
  return new Intl.NumberFormat(uiLocale(),{maximumFractionDigits:1}).format(n/(unit==='MB'?1048576:unit==='KB'?1024:1))+' '+unit;
}

function cabinetVersion(file) {
  return file.latest === false ? 'גרסה קודמת' : file.latest === true ? 'עדכנית' : 'לא הוזן';
}

function cabinetFileMark(file) {
  const ext=fileExtension(file);
  const label=ext==='none' ? uiText('קובץ') : ext.toUpperCase();
  return `<span class="cab-mark" aria-hidden="true"><b>${esc(label.slice(0,7))}</b></span>`;
}

function cabinetAttach(dropped) {
  uploadFile();
  const form = document.getElementById('fileform');
  if (!form) return;
  const chosen = paperId || cabinetState().paper;
  if (chosen && chosen !== 'general' && S.papers.some(p=>p.id===chosen)) {
    form.elements.paperId.value=chosen;
    form.elements.paperId.onchange();
  }
  if (dropped) {
    try {
      const data=new DataTransfer();
      data.items.add(dropped);
      form.elements.file.files=data.files;
    } catch { form.elements.file.focus(); }
  }
}

function cabinetDrag(event) {
  if (!Array.from(event.dataTransfer.types).includes('Files')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect='copy';
  event.currentTarget.classList.add('cab-dragging');
}

function cabinetDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('cab-dragging');
  const transfer=event.dataTransfer;
  if (Array.from(transfer.items||[]).some(item=>item.webkitGetAsEntry?.()?.isDirectory)) return uploadFolder();
  if (transfer.files.length!==1) return toast(uiText('גררו קובץ אחד או בחרו העלאת תיקייה.'),true);
  if (transfer.files[0].size>50*1024*1024) return toast(uiText('עד 50MB לקובץ'),true);
  cabinetAttach(transfer.files[0]);
}

function cabinetControls() {
  return `<div class="cab-actions"><button class="cab-primary" type="button" onclick="cabinetAttach()">${workspaceIcon('files')} ${uiText('＋ צירוף קובץ')}</button>
    <button type="button" onclick="uploadFolder()">${uiText('העלאת תיקייה')}</button></div>`;
}

function cabinetPrivateToggle() {
  return paperId ? `<button type="button" class="cab-private" aria-pressed="${!!window.showInternal}" onclick="window.showInternal=!window.showInternal;renderBody()">${uiText(window.showInternal?'הסתרת חומרים פנימיים':'הצגת חומרים פנימיים')}</button>` : '';
}

function cabinetSelect(key,label,all,options) {
  const selected=cabinetState()[key];
  return `<label>${uiText(label)}<select data-field="${key}" onchange="cabinetFilter(this)">
    <option value="">${uiText(all)}</option>${options.map(([value,text])=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
}

function renderFileCabinet() {
  const files=cabinetFiles(), state=cabinetState();
  const dropEvents='ondragover="cabinetDrag(event)" ondragleave="if(!this.contains(event.relatedTarget))this.classList.remove(\'cab-dragging\')" ondrop="cabinetDrop(event)"';
  if (!files.length) return `<section class="file-cabinet"><div class="cab-first" ${dropEvents}>
    <div class="cab-first-copy"><h2>${uiText('הוסיפו את הקובץ הראשון')}</h2>
    <p>${uiText('גררו לכאן קובץ, או בחרו תיקייה שלמה. בזמן ההעלאה אפשר לשייך את החומר למחקר ולפרק.')}</p>
    ${cabinetControls()}<small>${uiText('עד 50MB לקובץ')}</small></div>
    <div class="cab-illustration" aria-hidden="true"><div class="cab-drawing"><i class="cab-folder-back"></i><i class="cab-sheet-one"></i><i class="cab-sheet-two"></i><i class="cab-folder-front"></i></div></div></div>${cabinetPrivateToggle()}</section>`;
  const types=[...new Set(files.map(fileExtension))].sort().map(t=>[t,t==='none'?uiText('ללא סיומת'):t.toUpperCase()]);
  const linkedChapters = new Set(files.map(f=>f.chapterId));
  const chapters=S.chapters.filter(c=>linkedChapters.has(c.id));
  const filters=[
    paperId?'':cabinetSelect('paper','מאמר','כל המאמרים',[['general',uiText('קבצים כלליים')],...S.papers.map(p=>[p.id,p.title])]),
    cabinetSelect('chapter','פרק','כל הפרקים',chapters.map(c=>[c.id,c.title])),
    cabinetSelect('type','סוג קובץ','כל סוגי הקבצים',types),
    cabinetSelect('version','גרסה','כל הגרסאות',[['current',uiText('עדכנית')],['previous',uiText('גרסה קודמת')]]),
    `<label>${uiText('תאריך')}<input type="date" data-field="date" value="${esc(state.date)}" onchange="cabinetFilter(this)"></label>`
  ].join('');
  return `<section class="file-cabinet" ${dropEvents}><div class="cab-tools">${cabinetControls()}${cabinetPrivateToggle()}</div>
    <div class="cab-browse"><div class="cab-search"><label>${uiText('חיפוש לפי שם קובץ')}<input type="search" dir="auto" data-field="name" value="${esc(state.name)}" oninput="cabinetFilter(this)"></label>
    <details class="cab-filters"><summary>${uiText('סינון')} <span data-filter-count>${cabinetFilterCount() || ''}</span></summary><div>${filters}<button type="button" onclick="resetCabinetFilters()">${uiText('ניקוי סינון')}</button></div></details></div>
    <div id="cab-results">${cabinetResults()}</div></div></section>`;
}

function cabinetFilter(control) {
  cabinetState()[control.dataset.field]=control.value;
  cabinetState().selected='';
  if (control.dataset.field==='paper' && !paperId) articleFilters.files=control.value;
  document.querySelector('#cab-results').innerHTML=cabinetResults();
  updateCabinetCount();
}

function updateCabinetCount() {
  const slot=document.querySelector('[data-filter-count]');
  if(slot) slot.textContent=cabinetFilterCount() || '';
}

function cabinetFilterCount() {
  const s=cabinetState();
  return ['paper','chapter','type','version','date'].filter(key=>s[key]).length;
}

function resetCabinetFilters() {
  const state=cabinetState();
  for (const key of ['paper','chapter','type','version','date','name']) state[key]='';
  if (!paperId) articleFilters.files='';
  renderBody();
  document.querySelector('.cab-search input')?.focus({preventScroll:true});
}

function cabinetResults() {
  const state=cabinetState(), files=cabinetFiles().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const families=new Map(), matches=new Map(), search=state.name.trim().toLocaleLowerCase();
  for(const f of files) {
    const key=cabinetKey(f);
    if (!families.has(key)) families.set(key,[]);
    families.get(key).push(f);
    if (state.paper && (state.paper==='general'?!!f.paperId:f.paperId!==state.paper)) continue;
    if (state.chapter && state.chapter!==f.chapterId || state.date && state.date!==f.date?.slice(0,10)) continue;
    if (state.type && state.type!==fileExtension(f)) continue;
    if (state.version && (state.version==='previous'?f.latest!==false:f.latest!==true)) continue;
    if (search && !String(f.name||'').toLocaleLowerCase().includes(search)) continue;
    if (!matches.has(key)) matches.set(key,f);
  }
  if (!matches.size) return `<div class="cab-nothing" role="status"><h3>${uiText('לא נמצאו קבצים מתאימים')}</h3><button type="button" onclick="resetCabinetFilters()">${uiText('ניקוי סינון')}</button></div>`;
  const selected=files.find(f=>f.id===state.selected), chosen=selected && matches.has(cabinetKey(selected))?selected:matches.values().next().value;
  state.selected=chosen.id;
  const rows=Array.from(matches,([key,f])=>`<button type="button" class="cab-file" data-file="${esc(f.id)}" aria-pressed="${cabinetKey(chosen)===key}" onclick="chooseCabinetFile(this)">
    ${cabinetFileMark(f)}<span class="cab-file-title"><strong dir="auto">${esc(f.name)}</strong><small dir="auto">${esc(f.paperId?pname(f.paperId):uiText('אזור כללי'))}</small></span>
    <span class="cab-file-date">${esc(date(f.date))}</span></button>`).join('');
  return `<div class="cab-columns"><div class="cab-index"><div class="cab-section-title"><h3>${uiText('הקבצים שלי')}</h3><span>${matches.size}</span></div>${rows}</div>
    <section class="cab-inspector" aria-label="${uiText('פרטי הקובץ')}" tabindex="-1">${cabinetDetail(chosen,families.get(cabinetKey(chosen)))}</section></div>`;
}

function cabinetDetail(f,versions) {
  const displayRows=[[uiText('מאמר'), f.paperId?pname(f.paperId):uiText('אזור כללי')],[uiText('קטגוריה'),uiText(f.category||'לא הוזן')],[uiText('תאריך'),date(f.date)],[uiText('נפח'),cabinetSize(f.size)]];
  if (f.relativePath) displayRows.push([uiText('תיקייה'),f.relativePath]);
  return `<div class="cab-section-title"><h3>${uiText('פרטי הקובץ')}</h3><span>${esc(uiText(cabinetVersion(f)))}</span></div>
    <h4 class="cab-name" dir="auto">${esc(f.name)}</h4>
    <a class="cab-download" href="/api/file/${encodeURIComponent(f.id)}" download>${uiText('הורדת הקובץ')} ↓</a>
    <dl class="cab-metadata">${displayRows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd dir="auto">${esc(v)}</dd></div>`).join('')}</dl>
    <div class="cab-assign"><label>${uiText('פרק')}${fileChapterSelect(f)}</label>
    <button type="button" data-id="${esc(f.id)}" onclick="assignFile(this.dataset.id)">${uiText('שינוי מאמר')}</button></div>
    ${versions.length>1?`<h4>${uiText('היסטוריית גרסאות')}</h4><ol class="cab-history">${versions.map(v=>`<li><button type="button" data-file="${esc(v.id)}" aria-pressed="${v.id===f.id}" onclick="chooseCabinetFile(this)"><b dir="auto">${esc(v.name)}</b><small>${esc(date(v.date))} · ${uiText(cabinetVersion(v))}</small></button></li>`).join('')}</ol>`:''}`;
}

function chooseCabinetFile(button) {
  cabinetState().selected=button.dataset.file;
  document.getElementById('cab-results').innerHTML=cabinetResults();
  document.querySelector('.cab-inspector')?.focus({preventScroll:!window.matchMedia('(max-width:800px)').matches});
}
