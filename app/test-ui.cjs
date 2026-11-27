// Template and view unit checks; this does not replace browser QA.
const vm=require('node:vm'),assert=require('node:assert/strict');
const nodes = new Map();
function element() {
  return {
    innerHTML: '', textContent: '', dataset: {}, elements: {}, style: {}, open: false,
    classList: { toggle(){}, add(){}, remove(){}, contains(){return false;} },
    append(){}, prepend(){}, setAttribute(){}, hasAttribute(){return false;}, remove(){}, addEventListener(){},
    insertAdjacentElement(){}, insertAdjacentHTML(){}, querySelector(){return null;}, querySelectorAll(){return [];},
    showModal(){this.open=true;}, close(){this.open=false;}
  };
}
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, element());
  return nodes.get(selector);
}
const slots = new Set(['#nav','#title','#saved','#app','#body','#toolsbar','#modal','#editor','#upload','#restore','#workspace-project','#workspace-nav-toggle','#quickAdd']);
const doc = {documentElement:{lang:'he',dir:'rtl'}, querySelector: s => slots.has(s) ? node(s) : null, querySelectorAll:()=>[],
  getElementById: id => doc.querySelector('#'+id),
  createElement:element, addEventListener(){}, head:element(), body:element()};
let source=require('./render-workspace.cjs')().split('<script>')[1].split('</script>')[0];source=source.slice(0,source.lastIndexOf('load().then('));
const ctx=vm.createContext({console,crypto:require('node:crypto').webcrypto,document:doc,location:{hostname:'localhost',hash:''},history:{replaceState(){}},window:{matchMedia:()=>({matches:false,addEventListener(){}})},localStorage:{getItem:()=>null},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Intl,Date,URL,FormData,fetch:()=>{throw Error('Unexpected network')}});vm.runInContext(source,ctx);
vm.runInContext(`S={papers:[{id:'p1',title:'מחקר בדיקה',code:'מאמר01',language:'עברית',status:'כתיבה',work:'דרוש עדכון או תיקון',updated:now(),due:today()}],chapters:[{id:'c1',paperId:'p1',title:'מבוא',status:'הושלם',content:'תוכן',order:1}],tasks:[{id:'t1',paperId:'p1',title:'משימה',status:'לביצוע',work:'טרם התחיל',start:today(),due:today()}],notes:[{id:'n1',paperId:'p1',title:'הערה',content:'תוכן'}],files:[],tools:[],analyses:[],sources:[],opportunities:[],submissions:[],activity:[],drafts:[],rev:0};`,ctx);
for(let view of ['dashboard','papers','tasks','gantt','tools','sources','opportunities','files','activity','settings','chat']){vm.runInContext(`view='${view}';paperId='';render()`,ctx);assert.ok(node('#body').innerHTML.length>50,view)}
for(let tab of ['overview','chapters','tasks','gantt','notes','files','submissions']){vm.runInContext(`view='papers';paperId='p1';tab='${tab}';render()`,ctx);assert.ok(node('#body').innerHTML.length>50,tab)}
for(let k of ['papers','chapters','tasks','notes','tools','sources','opportunities','submissions']){vm.runInContext(`edit('${k}')`,ctx);assert.ok(node('#modal').innerHTML.includes('שמירה'),k)}
vm.runInContext(`S.sources=[{id:'s1',title:'מקור א',paperIds:['p1']},{id:'s2',title:'מקור ב',chapterId:'c1'}];view='sources';paperId='';render()`,ctx);
assert.ok(node('#body').innerHTML.includes('evidence-list'));
assert.ok(vm.runInContext("chapterEvidence('p1','c1').length===2",ctx));
assert.ok(vm.runInContext("chapterEvidence('other','other').length===0",ctx));
assert.ok(!source.includes('type="button" class="${cls}"')||source.includes('function action'));
console.log('PASS: all 11 main views, 7 paper tabs and 8 record editor templates render. Browser interaction remains unverified.');

const run = script => vm.runInContext(script,ctx);
for(const slot of ['#chat-evidence-body','#archive-bin-results','#archive-export-body','#backup-paper','#download-paper-backup']) slots.add(slot);
run(`S.sources=[
  {id:'book-1',paperId:'p1',title:'First reference'},
  {id:'book-2',paperIds:['p1'],title:'Second reference'},
  {id:'book-3',chapterId:'c1',title:'Third reference'},
  {id:'book-4',paperIds:['p1'],title:'Fourth <reference>'},
  {id:'other',paperIds:['p2'],title:'Unrelated reference'}];
  chatPaperId='p1'; chatConversation={messages:[]}; view='chat'; paperId=''; render()`);
let chatHtml=node('#body').innerHTML;
assert.match(chatHtml,/Third reference/);
assert.doesNotMatch(chatHtml,/Fourth|Unrelated/);
run('toggleChatLibrary()');
let evidence=node('#chat-evidence-body').innerHTML;
assert.match(evidence,/Fourth &lt;reference&gt;/);
assert.doesNotMatch(evidence,/Unrelated reference/);
run('toggleChatLibrary()');
assert.doesNotMatch(node('#chat-evidence-body').innerHTML,/Fourth/);

// Keep normal Enter for newlines and let IMEs commit text without accidentally sending it.
const shortcutHandler=chatHtml.match(/<textarea\b[^>]*\bonkeydown="([^"]+)"/)?.[1];
assert.ok(shortcutHandler,'chat composer keyboard handler');
const onKey=vm.runInContext('(function(event){'+shortcutHandler+'})',ctx);
for(const [key,ctrlKey,metaKey,isComposing,shouldSend] of [
  ['Enter',false,false,false,false],['Enter',true,false,false,true],['Enter',false,true,false,true],
  ['Enter',true,false,true,false],['a',true,false,false,false]
]) {
  let sent=false, prevented=false;
  onKey.call({form:{requestSubmit(){sent=true;}}},{key,ctrlKey,metaKey,isComposing,preventDefault(){prevented=true;}});
  assert.equal(sent,shouldSend);
  assert.equal(prevented,shouldSend);
}

doc.documentElement.lang='en';
run(`S.deletedFiles=[
  {id:'deleted-1',paperId:'p1',name:'Journal <draft>.txt',deletedAt:'2026-11-01'},
  {id:'deleted-2',paperId:'p2',name:'Other notes.csv',deletedAt:'2026-11-03'}];
  S.papers.push({id:'p2',title:'Interviews'});
  view='settings'; paperId=''; render()`);
const archiveHtml=node('#body').innerHTML;
assert.match(archiveHtml,/href="\/api\/backup"/);
assert.match(archiveHtml,/Journal &lt;draft&gt;\.txt/);
run("archiveSearch('INTERVIEWS')");
assert.match(node('#archive-bin-results').innerHTML,/Other notes\.csv/);
assert.doesNotMatch(node('#archive-bin-results').innerHTML,/Journal/);
run("archiveSearch('journal')");
assert.doesNotMatch(node('#archive-bin-results').innerHTML,/Other notes/);
assert.match(node('#archive-bin-results').innerHTML,/deleted-1/);
run("archiveSearch('unmatched')");
assert.match(node('#archive-bin-results').innerHTML,/No files match this search/);
run("archiveSetScope('paper')");
assert.match(node('#archive-export-body').innerHTML,/<button\b[^>]*id="download-paper-backup"[^>]* disabled/);
const pid='study/סקר & 2';
node('#backup-paper').value=pid;
run('updateBackupChoice()');
assert.equal(node('#download-paper-backup').disabled,false);
let download;
doc.createElement=()=>({click(){download=this.href;},remove(){}});
run('downloadPaperBackup()');
assert.equal(download,'/api/backup?paperId='+encodeURIComponent(pid));
console.log('PASS: chat evidence scope and keyboard actions, archive search and scoped ZIP downloads.');

// Task filters must scope actual records, escape titles, and retain board status actions.
doc.documentElement.lang='en';
run(`S.tasks=[
  {id:'work-1',paperId:'p1',title:'First <task>',status:'לביצוע',priority:'גבוהה',work:'טרם התחיל',due:'2020-01-01'},
  {id:'work-2',paperId:'p2',title:'Other study',status:'הושלם',priority:'רגילה',work:'הושלם'}];
  view='tasks';paperId='';articleFilters.tasks='p1';window.taskrange='הכול';window.taskCategory='';window.tasksLayout='cards';q='';filter='';sort='updated';`);
let tasksHtml=run('taskWorkspace()');
assert.match(tasksHtml,/First &lt;task&gt;/);
assert.doesNotMatch(tasksHtml,/Other study/);
assert.match(tasksHtml,/data-task-status="work-1"/);
run("window.tasksLayout='board'");
tasksHtml=run('taskWorkspace()');
assert.match(tasksHtml,/data-task="work-1"/);
assert.match(tasksHtml,/data-status="הושלם"/);
run("window.tasksLayout='cards'; window.taskCategory='completed'");
assert.doesNotMatch(run('taskWorkspace()'),/First &lt;task&gt;/);
run("taskWorkspaceClear()");
assert.equal(run('articleFilters.tasks'),'');
assert.equal(run('window.taskCategory'),'');
assert.match(run('taskWorkspace()'),/Other study/);

run(`S.activity=[{id:'event-1',paperId:'p1',type:'research',important:true,date:'2026-11-01T12:00:00Z',message:'Added <study>'}];window.activityPaper='';window.activityType='';`);
assert.match(run('activityTimeline()'),/Added &lt;study&gt;/);
run("window.activityPaper='p2'");
assert.doesNotMatch(run('activityTimeline()'),/Added &lt;study&gt;/);
console.log('PASS: scoped task filters, list and board, safe task titles, and activity timeline filtering.');
run(`window.activityPaper='';window.activityLimit=20;S.activity=Array.from({length:21},(_,i)=>({id:'activity-'+i,type:'milestone',important:true,date:'2026-11-01T12:00:00Z',message:'Example event '+i}));`);
assert.equal((run('activityTimeline()').match(/class="activity-timeline-item"/g)||[]).length,20);
assert.match(run('activityTimeline()'),/Show more activity/);
run('window.activityLimit=40');
assert.equal((run('activityTimeline()').match(/class="activity-timeline-item"/g)||[]).length,21);


// Browsing the combined library must not inherit another screen's filters or alter progress.
run(`S.papers=[
  {id:'p1',code:'R1',title:'First study',status:'כתיבה',language:'עברית',updated:'2026-11-25'},
  {id:'p2',code:'R2',title:'Second study',status:'תכנון',language:'עברית',updated:'2026-11-20'}];
  S.tasks=[{id:'t1',paperId:'p1',status:'הושלם'},{id:'t2',paperId:'p1',status:'לביצוע'}];
  S.chapters=[{id:'c1',paperId:'p1',status:'הושלם'},{id:'c2',paperId:'p1',status:'כתיבה'}];
  view='dashboard';paperId='';q='unrelated-task-filter';filter='other-status';sort='due';window.paperLayout='carousel';`);
assert.equal(run('galleryPapers().length'),2);
assert.equal(run('q'),'unrelated-task-filter');
assert.equal(run('filter'),'other-status');
assert.equal(run('sort'),'due');
assert.equal(run("progress(S.papers[0]).pct"),50);
assert.match(run('researchLibrary()'),/50%/);
console.log('PASS: unified research desk keeps library filters isolated and progress consistent.');

/* The globe represents the same completed tasks and chapters as the library. */
for (const [completed,total,expected] of [[0,4,0],[2,4,50],[4,4,100]]) {
  run(`S.tasks=Array.from({length:${total}},(_,i)=>({id:'orb-'+i,paperId:'p1',status:i<${completed}?'הושלם':'לביצוע'}));S.chapters=[];`);
  const html=run('renderDeskLibrary()');
  assert.match(html,new RegExp('role="progressbar"[^>]*aria-valuenow="'+expected+'"'));
  assert.match(html,new RegExp('--fill:'+expected+'%'));
}
console.log('PASS: the 3D globe exposes and fills to the actual completion percentage.');
