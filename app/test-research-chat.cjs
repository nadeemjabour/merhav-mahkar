const assert=require('node:assert/strict'),{answerResearchQuestion}=require('./research-chat.cjs');
const s={papers:[{id:'p1',code:'מאמר01',title:'מחקר בינה מלאכותית',status:'כתיבה',work:'דרוש עדכון או תיקון'},{id:'p2',code:'מאמר02',title:'מחקר אחר',status:'תכנון'}],tasks:[{id:'t',paperId:'p1',title:'להשלים סקירה',status:'לביצוע',priority:'גבוהה',due:'2001-01-01'}],chapters:[{id:'c',paperId:'p1',title:'סקירה ספרותית',content:'שימוש בכלים דיגיטליים תומך בלמידה.'}],files:[{id:'f',paperId:'p1',name:'מאמר.docx'},{id:'private',paperId:'p1',name:'מפתח משתתפים סודי',sensitive:true}],sources:[],requirements:[]};
let r=answerResearchQuestion(s,'מה מצב מאמר01?');assert.equal(r.contextPaperId,'p1');assert.ok(r.text.includes('כתיבה'));assert.ok(r.text.includes('0 מתוך 2'));r=answerResearchQuestion(s,'ומה חסר?','','p1');assert.equal(r.contextPaperId,'p1');r=answerResearchQuestion(s,'מה תמונת המצב הכללית?','','p1');assert.equal(r.contextPaperId,'');assert.ok(r.text.includes('מאמר02'));r=answerResearchQuestion(s,'אילו קבצים יש?','p1');assert.ok(r.text.includes('מאמר.docx'));assert.ok(!r.text.includes('מפתח משתתפים סודי'));r=answerResearchQuestion(s,'משימות באיחור','p1');assert.ok(r.links.some(l=>l.id==='t'));r=answerResearchQuestion(s,'מה כתוב על כלים דיגיטליים?','p1');assert.ok(r.text.includes('שימוש בכלים דיגיטליים'));assert.ok(r.links.some(l=>l.id==='c'));console.log('PASS: local summaries, context follow-ups, overall reset, deadlines, grounded excerpts and private-file exclusion.');
// Exercise the questions a user actually sees after changing the interface language.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = vm.createContext({});
catalog.window = catalog;
for (const file of ['studio-core-locales.js', 'studio-module-locales.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), catalog);
}

const fixture = {
  papers:[{id:'study-a', code:'K17', title:'Fieldwork A'}, {id:'study-b', code:'K18', title:'Fieldwork B'}],
  tasks:[{id:'task-a', paperId:'study-a', title:'Interview follow-up'}],
  sources:[{id:'source-a', paperIds:['study-a'], title:'Cuaderno de campo'}],
  chapters:[], files:[], requirements:[]
};
const shortcuts = [
  {key:'מה תמונת המצב הכללית?', kind:'paper', title:'Fieldwork A'},
  {key:'מה כדאי לקדם עכשיו?', kind:'task', title:'Interview follow-up'},
  {key:'אילו מקורות יש?', kind:'source', title:'Cuaderno de campo'}
];
for (const [language, index] of [['en', 0], ['ar', 1]]) {
  for (const {key, kind, title} of shortcuts) {
    const question = catalog.MerhavMessages[key][index];
    const answer = answerResearchQuestion(fixture, question, 'study-a', '', language);
    assert.equal(answer.contextPaperId, 'study-a');
    assert.deepEqual(answer.links.map(link => link.kind), [kind], question);
    assert.ok(answer.text.includes(title), question);
    assert.ok(!answer.text.includes('Fieldwork B'), question);
    assert.doesNotMatch(answer.text, /[\u0590-\u05ff]/, question);
    assert.match(answer.text, language === 'ar' ? /\p{Script=Arabic}/u : /[a-z]/i, question);
  }
  const overview = catalog.MerhavMessages[shortcuts[0].key][index];
  const allStudies = answerResearchQuestion(fixture, overview, '', 'study-a', language);
  assert.equal(allStudies.contextPaperId, '', overview);
  assert.deepEqual(allStudies.links.map(link => link.paperId), ['study-a', 'study-b'], overview);
}
const userTitle = 'מקור ללא כותרת';
const customSource = {...fixture, sources:[{...fixture.sources[0], title:userTitle}]};
const sourceQuestion = catalog.MerhavMessages[shortcuts[2].key][0];
const customAnswer = answerResearchQuestion(customSource, sourceQuestion, 'study-a', '', 'en');
assert.ok(customAnswer.text.includes(userTitle));
assert.equal(customAnswer.links[0].label,userTitle);
console.log('PASS: English and Arabic shortcuts give localized answers, scoped to the paper and preserving record titles.');
