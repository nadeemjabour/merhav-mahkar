const crypto=require('node:crypto');
function migrate(s,old,defaults=[]){
 if(!old?.project||!Array.isArray(old.chapters)||!Array.isArray(old.sources))throw Error('זה אינו גיבוי מוכר של האפליקציה הקודמת');
 s.legacySnapshots??=[];s.analyses??=[];s.legacySnapshots.push({id:crypto.randomUUID(),date:new Date().toISOString(),data:old});
 const at=old.updated||new Date().toISOString(),archive='legacy-general',pref=(kind,id)=>'legacy-'+kind+'-'+id;
 const put=(kind,obj)=>{let i=s[kind].findIndex(x=>x.id===obj.id);if(i<0)s[kind].push(obj);else s[kind][i]={...s[kind][i],...obj}};
 put('papers',{id:archive,code:'תיק-קודם',folderName:'תיק קודם',title:'תיק קודם – '+old.project.title,questions:old.project.question,status:'תכנון',work:'טרם התחיל',language:'עברית',missing:'חומרים כלליים מהגרסה הקודמת. שיוך לפרקים ולמאמרים דורש בדיקה; לא שויכו אוטומטית למחקר מסוים.',updated:at});
 const plans=Array.isArray(old.researchPlans)?old.researchPlans:defaults;
 for(let [i,p]of plans.entries()){let pid=pref('paper',p.id),code='מאמר'+String(i+1).padStart(2,'0');put('papers',{id:pid,code,folderName:p.title,title:p.title,due:p.due||'',status:p.status==='בתכנון'?'תכנון':p.status||'תכנון',work:'טרם התחיל',language:'עברית',abstract:p.instructions||'',decisions:p.notes||'',updated:at});let tasks=Array.isArray(p.tasks)?p.tasks:(p.id==='research-2'?['העברת שאלון מצב רוח לפני ההתערבות','העברת משחק זיכרון לפני ההתערבות','העברת משחק ריכוז לפני ההתערבות']:p.id==='research-1'?['השלמת המחקר עד מועד היעד']:[]).map((title,j)=>({id:p.id+'-task-'+j,title,start:'',end:p.id==='research-1'?p.due:'',status:'לביצוע'}));for(let t of tasks)put('tasks',{...t,id:pref('task',t.id),paperId:pid,status:t.status==='בתהליך'?'בעבודה':t.status,work:t.status==='הושלם'?'הושלם':t.status==='בתהליך'?'נדרשת עבודה משמעותית':'טרם התחיל',due:t.end||t.due||'',start:t.start||'',remaining:t.notes||'',updated:at})}
 for(let [i,c]of old.chapters.entries())put('chapters',{...c,id:pref('chapter',c.id),paperId:archive,order:i+1,status:c.status==='הושלם'?'הושלם':c.status==='טרם התחיל'?'טרם התחיל':'דרוש עדכון או תיקון',updated:at});
 for(let r of old.sources)put('sources',{...r,id:pref('source',r.id),bibliography:r.citation||'',link:r.url||'',verification:r.status,checked:r.verifiedAt||'',verificationNotes:r.notes||'',status:'טרם נקרא',paperIds:[archive],updated:at});
 for(let t of old.tasks||[])put('tasks',{...t,id:pref('task',t.id),paperId:t.researchId?pref('paper',t.researchId):archive,status:t.status==='בתהליך'?'בעבודה':t.status,work:t.status==='הושלם'?'הושלם':'טרם התחיל',due:t.end||t.due||'',remaining:t.notes||'',updated:at});
 for(let n of old.decisions||[])put('notes',{...n,id:pref('note',n.id),paperId:archive,type:'החלטה',content:n.content+'\nמצב קודם: '+n.status,updated:at});
 for(let a of old.analyses||[])put('analyses',{...a,id:pref('analysis',a.id),title:a.question,paperId:archive,updated:at});
 s.activity.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),message:'יובאה העבודה הקיימת מהאפליקציה הקודמת; חומרים כלליים נשמרו בתיק נפרד לשיוך ידני.'});return s;
}
module.exports=migrate;
