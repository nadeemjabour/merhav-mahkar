// Template and view unit checks; this does not replace browser QA.
const vm=require('node:vm'),assert=require('node:assert/strict');
const nodes = new Map();
function element() {
  return {
    innerHTML: '', textContent: '', dataset: {}, elements: {}, style: {}, open: false,
    classList: { toggle(){}, add(){}, remove(){}, contains(){return false;} },
    append(){}, prepend(){}, setAttribute(){}, remove(){}, addEventListener(){},
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
