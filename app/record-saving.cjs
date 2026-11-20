const crypto=require('node:crypto');
const kinds=new Set(['papers','chapters','tasks','notes','tools','sources','opportunities','submissions','requirements','analyses']);
const equal=(a,b)=>JSON.stringify(a??'')===JSON.stringify(b??'');
function saveRecord(s,{kind,data,baseline={},draftKey}){
 if(!kinds.has(kind)||!data||typeof data.id!=='string'||!data.id)throw Error('רשומה לא תקינה');
 let index=s[kind].findIndex(x=>x.id===data.id),current=index<0?null:s[kind][index],next=current?{...current}:{},changed=false;
 for(let [key,value]of Object.entries(data)){if(['__proto__','prototype','constructor'].includes(key))throw Error('שדה לא תקין');if(key==='updated')continue;if(current&&equal(value,baseline[key]))continue;if(current&&!equal(current[key],baseline[key])&&!equal(current[key],value))throw Error('אותו שדה עודכן בחלון אחר. הטיוטה שלך נשמרה; יש לפתוח מחדש את העריכה ולבדוק את השינוי.');next[key]=value;changed=true}
 if(kind==='chapters'&&next.parentId){let seen=new Set([data.id]),parentId=next.parentId;while(parentId){if(seen.has(parentId))throw Error('פרק האב יוצר מעגל');seen.add(parentId);const parent=s.chapters.find(c=>c.id===parentId);if(!parent||parent.paperId!==next.paperId)throw Error('פרק האב אינו שייך למאמר');parentId=parent.parentId}}
 next.id=data.id;next.updated=changed?new Date().toISOString():current?.updated||new Date().toISOString();
 if(kind==='papers'&&current&&(next.code!==current.code||next.folderName!==current.folderName))throw Error('אין לשנות את מזהה תיקיית המאמר');
 if(next.paperId&&!s.papers.some(p=>p.id===next.paperId))throw Error('מאמר לא נמצא');
 if(next.chapterId&&!s.chapters.some(c=>c.id===next.chapterId&&(!next.paperId||c.paperId===next.paperId)))throw Error('הפרק אינו שייך למאמר');
 if(index<0)s[kind].push(next);else s[kind][index]=next;
 if(kind==='papers'&&!current)require('./chapter-structure.cjs').organize(s,[next.id]);
 if(next.paperId){let p=s.papers.find(p=>p.id===next.paperId);if(p)p.updated=next.updated}
 if(draftKey)s.drafts=s.drafts.filter(d=>d.key!==draftKey);
 s.activity.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),message:'נשמר עדכון '+(next.title||next.name||''),paperId:kind==='papers'?next.id:next.paperId});
 return next;
}
module.exports={saveRecord};
