const assert=require('node:assert/strict'),{saveRecord}=require('./record-saving.cjs');
const state=()=>({papers:[{id:'p1',title:'מקורי',topic:'תחום',code:'מאמר01',folderName:'מקורי',updated:'2026-01-01'}],chapters:[],notes:[],tasks:[],drafts:[],activity:[]});
let s=state(),baseline=structuredClone(s.papers[0]);s.papers[0].topic='עודכן בחלון אחר';s.drafts.push({key:'draft1'});saveRecord(s,{kind:'papers',baseline,data:{...baseline,title:'כותרת חדשה'},draftKey:'draft1'});assert.equal(s.papers[0].title,'כותרת חדשה');assert.equal(s.papers[0].topic,'עודכן בחלון אחר');assert.equal(s.drafts.length,0);assert.equal(s.papers[0].code,'מאמר01');
s=state();baseline=structuredClone(s.papers[0]);s.papers[0].title='שם אחר';assert.throws(()=>saveRecord(s,{kind:'papers',baseline,data:{...baseline,title:'שם מתנגש'}}),/אותו שדה/);assert.equal(s.papers[0].title,'שם אחר');
s=state();saveRecord(s,{kind:'papers',data:{id:'p2',title:'מאמר חדש',code:'מאמר02',folderName:'חדש'}});assert.equal(s.chapters.filter(c=>c.paperId==='p2').length,9);
console.log('PASS: field-level merge preserves parallel edits, genuine conflicts retain server content, draft cleanup and nine chapters for new papers.');
