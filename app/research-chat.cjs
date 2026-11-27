const {replyLanguage} = require('./research-chat-language.cjs');

const normal = text => String(text || '').normalize('NFD').replace(/\p{M}/gu,'').replace(/[״׳"']/g,'').toLowerCase();
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

// Route the exact translated starter prompts like their original Hebrew versions.
// Use the original question for storage and for searches through research text.
const prompts = new Map([
  ['what is the overall status', 'מה תמונת המצב הכללית'],
  ['ما الحالة العامة', 'מה תמונת המצב הכללית'],
  ['what should i work on next', 'מה כדאי לקדם עכשיו'],
  ['ما الخطوة التالية', 'מה כדאי לקדם עכשיו'],
  ['which sources are available', 'אילו מקורות יש'],
  ['ما المراجع المتاحة', 'אילו מקורות יש']
]);

function resolvePaper(s, q, chosen, context) {
  if (chosen) return chosen;
  const code = q.match(/(?:מאמר|מחקר|article|مقال)\s*0?(\d+)/i);
  if (code) {
    const paper = s.papers.find(p=>Number(p.code.replace(/\D/g,''))===Number(code[1]));
    if (paper) return paper.id;
  }
  if (/כל המאמרים|כל המחקרים|תמונת.*כללי|all papers/.test(q)) return '';
  if (/ערבית/.test(q)) {
    const arabic = s.papers.filter(p=>p.language==='العربية');
    if (arabic.length === 1) return arabic[0].id;
  }
  const terms = normal(q).split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>2 && !['מצב','מחקר','מאמר','של','מה','האם','המחקר','המאמר'].includes(t));
  const rank = s.papers.map(p=>({id:p.id,score:terms.reduce((n,t)=>n+(normal(p.title+' '+p.topic).includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score);
  return rank[0]?.score>0 && rank[0].score>(rank[1]?.score||0) ? rank[0].id : context||'';
}

function questionIntent(q) {
  if (/מה חסר|מה נותר|חסר|להשלים|ناقص|نواقص|missing/.test(q)) return 'missing';
  if (/באיחור|איחור|متاخر|overdue/.test(q)) return 'late';
  if (/חשיבות|עדיפות|דחופ|اولوية|priority/.test(q)) return 'high';
  if (/מועד|תאריך|דדליין|موعد|مواعيد|deadline/.test(q)) return 'dates';
  if (/קובץ|קבצים|מסמכ|ملفات|files/.test(q)) return 'files';
  if (/מקורות|ביבליוגרפ|مراجع|sources/.test(q)) return 'sources';
  if (/משימ|לקדם|הבא|לעשות|مهام|tasks|next/.test(q)) return 'tasks';
  if (/פרקים|פרק|فصول|chapters/.test(q)) return 'chapters';
  if (/תמונ|מצב|שלב|עומד|מתקדם|סיכום|סקירה כללית|התקדמות|ملخص|حالة|summary|status|overview/.test(q)) return 'summary';
  return 'search';
}

function answerResearchQuestion(s, question, paperId='', context='', language='he') {
  if (paperId && !s.papers.some(p=>p.id===paperId)) throw Error('מאמר לא נמצא');
  const {say,choice,date} = replyLanguage(language);
  const q = normal(question);
  const routingQuestion = prompts.get(q.trim().replace(/[?؟]+$/u,'').trim()) || question;
  const scoped = resolvePaper(s,routingQuestion,paperId,context);
  const papers = s.papers.filter(p=>!scoped||p.id===scoped);
  const ids = new Set(papers.map(p=>p.id));
  const tasks = s.tasks.filter(t=>ids.has(t.paperId));
  const chapters = s.chapters.filter(c=>ids.has(c.paperId));
  const files = s.files.filter(f=>ids.has(f.paperId)&&!f.sensitive);
  const paperName = paper => paper.code+' — '+paper.title;
  const title = scoped ? paperName(papers[0]) : say('allPapers');
  const lines = [say('header',{title}),''];
  const links = [];
  const paperLink = p => links.push({kind:'paper',paperId:p.id,label:paperName(p)});
  const isLate = t => t.due && t.due<today() && t.status!=='הושלם';
  const byDue = (a,b) => (a.due||'9999').localeCompare(b.due||'9999');
  const intent = questionIntent(normal(routingQuestion));

  if (intent === 'summary') {
    for (const p of papers) {
      const items = [...tasks.filter(t=>t.paperId===p.id),...chapters.filter(c=>c.paperId===p.id)];
      const done = items.filter(x=>x.status==='הושלם').length;
      const open = tasks.filter(t=>t.paperId===p.id&&t.status!=='הושלם');
      const next = open.sort(byDue)[0];
      lines.push(paperName(p),
        say('stage',{stage:choice('stage',p.status),work:choice('work',p.work)}),
        say('progress',{done,total:items.length,percent:items.length?' ('+Math.round(done/items.length*100)+'%)':''}),
        say('openTasks',{count:open.length,late:open.filter(isLate).length}),
        say('targetDate',{date:date(p.due)}),say('nextStep',{step:next?.title||say('notDefined')}),'');
      paperLink(p);
    }
    lines.push(say('progressNote'));
  } else if (['tasks','late','high'].includes(intent)) {
    const chosen = tasks.filter(t=>t.status!=='הושלם' && (intent!=='late'||isLate(t)) && (intent!=='high'||['גבוהה','דחופה'].includes(t.priority))).sort(byDue);
    lines.push(say(intent==='late'?'lateTasks':intent==='high'?'priorityTasks':'nextTasks'));
    for (const t of chosen.slice(0,12)) {
      lines.push(say('task',{title:t.title,code:s.papers.find(p=>p.id===t.paperId)?.code||'',date:date(t.due),status:choice('task',t.status)}));
      links.push({kind:'task',paperId:t.paperId,id:t.id,label:t.title});
    }
    if (!chosen.length) lines.push(say('noTasks'));
    if (chosen.length>12) lines.push(say('taskLimit',{count:chosen.length}));
  } else if (intent==='missing') {
    for (const p of papers) {
      lines.push(paperName(p),say('missing',{detail:p.missing||say('unset')}));
      const roots = chapters.filter(c=>c.paperId===p.id&&!c.parentId);
      function hasText(c) {
        const set = new Set([c.id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const child of chapters) {
            if (set.has(child.parentId) && !set.has(child.id)) { set.add(child.id); changed=true; }
          }
        }
        return chapters.some(x=>set.has(x.id)&&x.content?.trim());
      }
      const empty = roots.filter(c=>!hasText(c));
      lines.push(say('emptyChapters',{titles:empty.map(c=>c.title).join(', ')||say('none')}));
      for (const r of s.requirements.filter(r=>r.paperId===p.id&&!r.fileId)) {
        lines.push(say('requiredFile',{title:r.title,reason:r.reason||say('noReason')}));
      }
      lines.push('');
      paperLink(p);
    }
  } else if (intent==='dates') {
    const deadlines = [...papers.filter(p=>p.due).map(p=>({label:paperName(p),due:p.due})),
      ...tasks.filter(t=>t.due&&t.status!=='הושלם').map(t=>({label:t.title,due:t.due}))].sort((a,b)=>a.due.localeCompare(b.due));
    lines.push(say('dates'));
    lines.push(...(deadlines.length?deadlines.map(x=>'• '+date(x.due)+' — '+x.label):[say('noDates')]));
    for (const p of papers) paperLink(p);
  } else if (intent==='files') {
    lines.push(say('files',{count:files.length}));
    for (const f of [...files].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8)) {
      lines.push('• '+f.name+' | '+choice('category',f.category,'unclassified')+' | '+date(f.date));
      links.push({kind:'file',id:f.id,paperId:f.paperId,label:f.name});
    }
    if (s.files.some(f=>ids.has(f.paperId)&&f.sensitive)) lines.push(say('privateFiles'));
    lines.push(say('fileNote'));
  } else if (intent==='sources') {
    const chapterIds = new Set(chapters.map(c=>c.id));
    const sources = s.sources.filter(r=>ids.has(r.paperId)||(r.paperIds||[]).some(id=>ids.has(id))||chapterIds.has(r.chapterId));
    lines.push(say('sources',{count:sources.length}));
    for (const source of sources.slice(0,8)) {
      const title = source.title||source.bibliography||say('untitledSource');
      lines.push(say('verification',{title:source.bibliography||title,status:choice('verification',source.verification,'notVerified')}));
      links.push({kind:'source',id:source.id,label:title});
    }
    if (!sources.length) lines.push(say('noSources'));
  } else if (intent==='chapters') {
    for (const p of papers) {
      lines.push(paperName(p));
      for (const c of chapters.filter(c=>c.paperId===p.id&&!c.parentId).sort((a,b)=>a.order-b.order)) {
        lines.push('• '+c.title+' — '+choice('work',c.status));
        links.push({kind:'chapter',paperId:p.id,id:c.id,label:c.title});
      }
      lines.push('');
    }
  } else if (scoped) {
    const terms = q.split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>2&&!['כתוב','אומר','המחקר','המאמר','אפשר','מהו','about','what','does'].includes(t));
    const matches = chapters.filter(c=>c.content).map(c=>({c,score:terms.reduce((n,t)=>n+(normal(c.title+' '+c.content).includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
    if (matches.length) {
      lines.push(say('excerpts'));
      for (const {c} of matches) {
        const content = c.content.replace(/\s+/g,' '), term = terms.find(t=>normal(content).includes(t));
        const begin = Math.max(0,(term?normal(content).indexOf(term):0)-90);
        lines.push(c.title+':',say('quote',{text:content.slice(begin,begin+550)}),'');
        links.push({kind:'chapter',paperId:c.paperId,id:c.id,label:say('openChapter',{title:c.title})});
      }
    } else lines.push(say('noExcerpt'));
  } else lines.push(say('help'));
  return {text:lines.join('\n'),links:links.slice(0,15),contextPaperId:scoped};
}
module.exports = {answerResearchQuestion};
