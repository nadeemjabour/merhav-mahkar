// The archive is a view onto the same state and backup/restore actions as the workspace.
const archiveCopy = {
  he: {
    title:'גיבוי ושחזור', intro:'שמרו עותק של העבודה שלכם, שחזרו גיבוי או החזירו קובץ מסל המחזור.',
    studies:'מחקרים', files:'קבצים פעילים', binCount:'בסל המחזור', export:'הורדת גיבוי', scope:'מה לכלול בגיבוי',
    full:'כל המרחב', paper:'מחקר אחד', fullHint:'קובץ ZIP עם כל המחקרים, הפרקים, המשימות, הקבצים והגרסאות.',
    paperHint:'קובץ ZIP עם המחקר שנבחר, הקבצים שלו והפריטים המשותפים המקושרים אליו.',
    choose:'בחרו מחקר', noPapers:'עדיין אין מחקרים לגיבוי נפרד.', downloadFull:'הורדת המרחב כ־ZIP', downloadPaper:'הורדת המחקר כ־ZIP',
    restore:'שחזור מגיבוי', restoreHint:'בחרו קובץ ZIP שנוצר במרחב המחקר.', restoreImpact:'גיבוי מלא מחליף את הרשומות הקיימות. גיבוי של מחקר אחד מתמזג עם נתוני המרחב.',
    chooseFile:'בחירת קובץ ZIP', bin:'סל המחזור', binHint:'בחרו קובץ שנמחק כדי להחזיר אותו למרחב.',
    search:'חיפוש לפי שם קובץ או מחקר', file:'קובץ', project:'מחקר', removed:'תאריך המחיקה', recover:'שחזור', general:'כללי',
    binEmpty:'סל המחזור ריק', binEmptyHint:'כאן יופיעו קבצים שתעבירו לסל המחזור.', noMatch:'אין קבצים התואמים לחיפוש.', clear:'ניקוי החיפוש',
    prev:'הקודם', next:'הבא', of:'מתוך', other:'אפשרויות נוספות', importTitle:'ייבוא מהגרסה הקודמת', importHint:'ייבוא JSON מעדכן רשומות בעלות אותו מזהה ושומר על הקבצים ועל רשומות חדשות.',
    import:'ייבוא גיבוי JSON', legacy:'פתיחת הממשק הקודם', saveTitle:'שמירה ושחזור', saveHint:'לפני השחזור נשמר עותק של הרשומות הקיימות. שמרו את קובץ הגיבוי במקום מוגן.',
    retry:'ניסיון שמירה חוזר', unnamed:'קובץ ללא שם'
  },
  en: {
    title:'Backup & restore', intro:'Keep a copy of your work, restore an archive, or recover individual files.',
    studies:'Studies', files:'Active files', binCount:'In recycle bin', export:'Download a backup', scope:'Backup scope',
    full:'Entire workspace', paper:'One study', fullHint:'One ZIP with all studies, chapters, tasks, files and versions.',
    paperHint:'One ZIP with the selected study, its files and linked shared items.',
    choose:'Choose a study', noPapers:'There are no studies to back up individually yet.', downloadFull:'Download workspace ZIP', downloadPaper:'Download study ZIP',
    restore:'Restore a backup', restoreHint:'Select a ZIP exported from Research Workspace.', restoreImpact:'A full backup replaces the current records. A single-study backup merges into the workspace.',
    chooseFile:'Choose ZIP file', bin:'Recycle bin', binHint:'Recover a deleted file to return it to the workspace.',
    search:'Search by file or study name', file:'File', project:'Study', removed:'Date deleted', recover:'Restore', general:'General',
    binEmpty:'Your recycle bin is empty', binEmptyHint:'Files you move to the recycle bin will appear here.', noMatch:'No files match this search.', clear:'Clear search',
    prev:'Previous', next:'Next', of:'of', other:'More options', importTitle:'Import from the previous version', importHint:'Importing a JSON backup updates records with matching IDs and keeps new records and files.',
    import:'Import JSON backup', legacy:'Open previous interface', saveTitle:'Saving and recovery', saveHint:'A copy of the current records is saved before a restore. Keep your backup file in a secure place.',
    retry:'Retry save', unnamed:'Untitled file'
  },
  ar: {
    title:'النسخ الاحتياطي والاستعادة', intro:'احتفظ بنسخة من عملك، أو استعد نسخة احتياطية أو ملفًا من سلة المحذوفات.',
    studies:'الأبحاث', files:'الملفات النشطة', binCount:'في سلة المحذوفات', export:'تنزيل نسخة احتياطية', scope:'نطاق النسخة الاحتياطية',
    full:'المساحة كاملة', paper:'بحث واحد', fullHint:'ملف ZIP يتضمن جميع الأبحاث والفصول والمهام والملفات وإصداراتها.',
    paperHint:'ملف ZIP يتضمن البحث المحدد وملفاته والعناصر المشتركة المرتبطة به.',
    choose:'اختر بحثًا', noPapers:'لا توجد أبحاث بعد لتنزيل نسخة مستقلة منها.', downloadFull:'تنزيل المساحة بصيغة ZIP', downloadPaper:'تنزيل البحث بصيغة ZIP',
    restore:'استعادة نسخة احتياطية', restoreHint:'اختر ملف ZIP سبق تصديره من مساحة البحث.', restoreImpact:'تحلّ النسخة الكاملة محل السجلات الحالية. أمّا نسخة البحث الواحد فتُدمج مع محتوى المساحة.',
    chooseFile:'اختيار ملف ZIP', bin:'سلة المحذوفات', binHint:'يمكنك استعادة أي ملف محذوف وإعادته إلى مساحة البحث.',
    search:'البحث باسم الملف أو البحث', file:'الملف', project:'البحث', removed:'تاريخ الحذف', recover:'استعادة', general:'عام',
    binEmpty:'سلة المحذوفات فارغة', binEmptyHint:'ستظهر هنا الملفات التي تنقلها إلى سلة المحذوفات.', noMatch:'لا توجد ملفات تطابق هذا البحث.', clear:'مسح البحث',
    prev:'السابق', next:'التالي', of:'من', other:'خيارات إضافية', importTitle:'استيراد من الإصدار السابق', importHint:'يحدّث استيراد نسخة JSON السجلات التي تحمل المعرّفات نفسها، ويحافظ على الملفات والسجلات الجديدة.',
    import:'استيراد نسخة JSON', legacy:'فتح الواجهة السابقة', saveTitle:'الحفظ والاستعادة', saveHint:'تُحفظ نسخة من السجلات الحالية قبل الاستعادة. احتفظ بملف النسخة الاحتياطية في مكان آمن.',
    retry:'إعادة محاولة الحفظ', unnamed:'ملف بلا اسم'
  }
};

const archiveView = { scope:'full', paper:'', query:'', page:0 };
const archiveRowCount = 8;
const archiveGlyphs = {
  download:'M12 3v11m-4-4 4 4 4-4M4 15v5h16v-5',
  upload:'M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5',
  restore:'M4 10a8 8 0 1 1 1 7M4 5v5h5m3-2v5l3 1',
  box:'M3 5h18v4H3z M5 9v11h14V9 M10 12h4',
  study:'M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7 M9 16h5',
  search:'m16 16 5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  file:'M6 3h8l4 4v14H6z M14 3v5h4 M9 13h6 M9 16h4',
  bin:'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  options:'M4 7h6m4 0h6M4 17h10m4 0h2 M10 4v6m4 4v6',
  info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 7v1'
};

function archiveIcon(name) {
  return '<svg class="archive-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+archiveGlyphs[name]+'"/></svg>';
}

function archiveText() {
  return archiveCopy[document.documentElement.lang] || archiveCopy.he;
}

function archiveNumber(value) {
  return Number(value).toLocaleString(uiLocale());
}

function archiveBoxArt() {
  return `<div class="archive-art" aria-hidden="true"><span class="archive-grid"></span><div class="archive-folder"><i></i><i></i><i></i></div><div class="archive-case"><div class="archive-slot"><i></i></div><div class="archive-slot"><i></i></div></div></div>`;
}

function archiveExportBody() {
  const c=archiveText();
  if (archiveView.scope==='full') {
    return `<p>${c.fullHint}</p><a class="archive-button archive-primary" href="/api/backup">${archiveIcon('download')}${c.downloadFull}</a>`;
  }
  const options=S.papers.map(paper => `<option value="${esc(paper.id)}" ${paper.id===archiveView.paper?'selected':''}>${esc([paper.code,paper.title].filter(Boolean).join(' — '))}</option>`).join('');
  return `<p>${S.papers.length?c.paperHint:c.noPapers}</p>
    <div class="archive-paper-controls"><select id="backup-paper" aria-label="${c.choose}" onchange="archiveView.paper=this.value;updateBackupChoice()" ${S.papers.length?'':'disabled'}><option value="">${c.choose}</option>${options}</select>
    <button type="button" id="download-paper-backup" class="archive-button archive-primary" onclick="downloadPaperBackup()" ${archiveView.paper?'':'disabled'}>${archiveIcon('download')}${c.downloadPaper}</button></div>`;
}

function archiveSetScope(scope) {
  archiveView.scope=scope;
  const panel=document.getElementById('archive-export-body');
  if (panel) panel.innerHTML=archiveExportBody();
}

function archiveSearch(query) {
  archiveView.query=query;
  archiveView.page=0;
  archiveUpdateBin();
}

function archiveChangePage(offset) {
  archiveView.page=Math.max(0,archiveView.page+offset);
  archiveUpdateBin();
  const pager=document.querySelector('#archive-bin-results .archive-pager');
  const target=pager?.querySelector(`[data-page-step="${offset}"]:not(:disabled)`)||pager?.querySelector('button:not(:disabled)')||document.getElementById('archive-search');
  target?.focus({preventScroll:true});
}

function archiveUpdateBin() {
  const results=document.getElementById('archive-bin-results');
  if (results) results.innerHTML=archiveBinRows();
}

async function archiveRecover(button) {
  button.disabled=true;
  try { await restoreDeletedFile(button.dataset.fileId); }
  finally { if (button.isConnected) button.disabled=false; }
  if (!button.isConnected) (document.getElementById('archive-search')||document.getElementById('archive-bin-title'))?.focus({preventScroll:true});
}

function archiveClearSearch() {
  const field=document.getElementById('archive-search');
  if(field){field.value='';field.focus();}
  archiveSearch('');
}

function archiveBinRows() {
  const c=archiveText();
  const papers=new Map(S.papers.map(p=>[p.id,p]));
  const query=archiveView.query.trim().normalize().toLocaleLowerCase();
  const all=S.deletedFiles || [];
  const filtered=all.filter(f=>{
    if(!query)return true;
    const paper=papers.get(f.paperId);
    return [f.name,paper?.code,paper?.title].filter(Boolean).some(x=>String(x).normalize().toLocaleLowerCase().includes(query));
  }).sort((a,b)=>String(b.deletedAt||'').localeCompare(String(a.deletedAt||'')));
  if(!filtered.length) {
    archiveView.page=0;
    return `<div class="archive-empty">${archiveIcon(all.length?'search':'bin')}<div><strong>${all.length?c.noMatch:c.binEmpty}</strong>${all.length?'':'<p>'+c.binEmptyHint+'</p>'}</div>${all.length?'<button type="button" class="archive-text-button" onclick="archiveClearSearch()">'+c.clear+'</button>':''}</div>`;
  }
  const pages=Math.ceil(filtered.length/archiveRowCount);
  archiveView.page=Math.min(archiveView.page,pages-1);
  const start=archiveView.page*archiveRowCount;
  const dates=new Intl.DateTimeFormat(uiLocale(),{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jerusalem'});
  const rows=filtered.slice(start,start+archiveRowCount).map(f=>{
    const study=papers.get(f.paperId);
    const extension=String(f.name||'').match(/\.([a-z0-9]{1,6})$/i)?.[1].toUpperCase()||'';
    const deleted=new Date(f.deletedAt);
    const dateText=f.deletedAt && Number.isFinite(deleted.getTime()) ? dates.format(deleted) : '—';
    const label=esc(f.name||c.unnamed);
    return `<tr><th scope="row"><div class="archive-file-cell"><span class="archive-file-mark" aria-hidden="true">${extension||archiveIcon('file')}</span><bdi>${label}</bdi></div></th>
      <td class="archive-study"><bdi>${esc(study?.title||study?.code||c.general)}</bdi></td>
      <td class="archive-date">${esc(dateText)}</td><td class="archive-command"><button type="button" class="archive-restore-file" data-file-id="${esc(f.id)}" onclick="archiveRecover(this)" aria-label="${c.recover} · ${label}">${archiveIcon('restore')}<span>${c.recover}</span></button></td></tr>`;
  }).join('');
  return `<table class="archive-table"><thead><tr><th scope="col">${c.file}</th><th scope="col">${c.project}</th><th scope="col">${c.removed}</th><th scope="col"><span class="archive-sr">${c.recover}</span></th></tr></thead><tbody>${rows}</tbody></table>
  ${pages>1?`<div class="archive-pager"><span><bdi>${archiveNumber(start+1)}–${archiveNumber(Math.min(start+archiveRowCount,filtered.length))}</bdi> ${c.of} ${archiveNumber(filtered.length)}</span><div><button type="button" data-page-step="-1" onclick="archiveChangePage(-1)" ${start?'':'disabled'}>${c.prev}</button><button type="button" data-page-step="1" onclick="archiveChangePage(1)" ${archiveView.page+1<pages?'':'disabled'}>${c.next}</button></div></div>`:''}`;
}

function backupCenter() {
  const c=archiveText(), deleted=S.deletedFiles||[];
  if (!S.papers.some(p=>p.id===archiveView.paper)) archiveView.paper='';
  const stat=(num,label)=>`<div><dt>${label}</dt><dd>${archiveNumber(num)}</dd></div>`;
  const scopeOption=(key,title,icon)=>`<label><input type="radio" name="archive-scope" value="${key}" onchange="archiveSetScope(this.value)" ${archiveView.scope===key?'checked':''}><span>${archiveIcon(icon)}${title}</span></label>`;
  return `<div class="archive-center">
    <section class="archive-hero" aria-labelledby="archive-title"><div class="archive-hero-copy"><h2 id="archive-title">${c.title}</h2><p>${c.intro}</p>
      <dl class="archive-inventory">${stat(S.papers.length,c.studies)}${stat(S.files.length,c.files)}${stat(deleted.length,c.binCount)}</dl></div>${archiveBoxArt()}</section>
    <div class="archive-actions">
      <section class="archive-card archive-export"><h3>${archiveIcon('download')}${c.export}</h3><fieldset class="archive-scopes"><legend class="archive-sr">${c.scope}</legend>
        ${scopeOption('full',c.full,'box')}${scopeOption('paper',c.paper,'study')}</fieldset><div id="archive-export-body">${archiveExportBody()}</div></section>
      <section class="archive-card archive-import"><h3>${archiveIcon('restore')}${c.restore}</h3><p>${c.restoreHint}</p><p class="archive-impact">${archiveIcon('info')}<span>${c.restoreImpact}</span></p>
        <button type="button" class="archive-button archive-outline" onclick="document.getElementById('restore').click()">${archiveIcon('upload')}${c.chooseFile}</button></section></div>
    <section class="archive-card archive-bin" aria-labelledby="archive-bin-title"><header class="archive-bin-head"><div><h3 id="archive-bin-title" tabindex="-1">${archiveIcon('bin')}${c.bin}<span class="archive-count">${archiveNumber(deleted.length)}</span></h3><p>${c.binHint}</p></div>
      ${deleted.length?`<label class="archive-search">${archiveIcon('search')}<input id="archive-search" type="search" value="${esc(archiveView.query)}" aria-label="${c.search}" placeholder="${c.search}" oninput="archiveSearch(this.value)"></label>`:''}</header>
      <div id="archive-bin-results">${archiveBinRows()}</div></section>
    <details class="archive-more"><summary>${archiveIcon('options')}<span>${c.other}</span></summary><div class="archive-more-grid">
      <section><h3>${c.importTitle}</h3><p>${c.importHint}</p><div class="archive-links"><button type="button" class="archive-text-button" onclick="importLegacy()">${c.import}</button>${document.body.hasAttribute('data-legacy-interface') ? '<a href="/legacy/" target="_blank" rel="noopener">'+c.legacy+'</a>' : ''}</div></section>
      <section><h3>${c.saveTitle}</h3><p>${c.saveHint}</p><button type="button" class="archive-text-button" onclick="retrySave()">${c.retry}</button></section></div></details>
  </div>`;
}
