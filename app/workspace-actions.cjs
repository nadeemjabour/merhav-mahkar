const crypto=require('node:crypto');
module.exports=function workspaceAction(s,b){
 const stamp=new Date().toISOString();s.deletedFiles??=[];
 if(b.action==='delete-file'){
  const i=s.files.findIndex(f=>f.id===b.fileId);if(i<0)throw Error('הקובץ לא נמצא');const [f]=s.files.splice(i,1);s.deletedFiles.push({...f,deletedAt:stamp});
  s.activity.unshift({id:crypto.randomUUID(),date:stamp,important:true,type:'files',paperId:f.paperId,message:'קובץ הועבר לסל המחזור: '+f.name});
 }else if(b.action==='restore-file'){
  const i=s.deletedFiles.findIndex(f=>f.id===b.fileId);if(i<0)throw Error('קובץ לא נמצא בסל');const [f]=s.deletedFiles.splice(i,1);delete f.deletedAt;if(!s.files.some(x=>x.id===f.id))s.files.push(f);
 }else if(b.action==='delete-analysis-workbench-record'){
  const index=s.analyses.findIndex(record=>record.id===b.recordId&&record.type==='analysis_workbench_state');
  if(index<0)throw Error('הניתוח השמור לא נמצא');
  const [record]=s.analyses.splice(index,1);
  s.activity.unshift({id:crypto.randomUUID(),date:stamp,type:'statistics',paperId:record.paperId,message:'ניתוח שמור נמחק: '+(record.fileName||'קובץ נתונים')});
 }else if(b.action==='delete-statistics-dataset'){
  const i=s.analyses.findIndex(a=>a.id===b.datasetId&&['statistics_dataset','statistics_attachment'].includes(a.type));if(i<0)throw Error('רשומת הנתונים לא נמצאה');const [dataset]=s.analyses.splice(i,1);
  if(dataset.fileId){const fi=s.files.findIndex(f=>f.id===dataset.fileId);if(fi>=0){const [f]=s.files.splice(fi,1);s.deletedFiles.push({...f,deletedAt:stamp});s.activity.unshift({id:crypto.randomUUID(),date:stamp,important:true,type:'files',paperId:f.paperId,message:'קובץ נתונים הועבר לסל המחזור: '+f.name})}}
  s.activity.unshift({id:crypto.randomUUID(),date:stamp,important:true,type:'statistics',paperId:dataset.paperId,message:'רשומת נתונים הוסרה והקובץ הועבר לסל המחזור: '+(dataset.title||dataset.fileName||'קובץ נתונים')});
 }else if(b.action==='paper-order'){
  if(!Array.isArray(b.ids)||new Set(b.ids).size!==b.ids.length||b.ids.some(id=>!s.papers.some(p=>p.id===id)))throw Error('סדר מאמרים לא תקין');
  s.dashboard={...s.dashboard,paperOrder:[...b.ids,...s.papers.filter(p=>!b.ids.includes(p.id)).map(p=>p.id)]};
 }else if(b.action==='select-questionnaires'){
  const p=s.papers.find(p=>p.id===b.paperId);if(!p)throw Error('מחקר לא נמצא');if(!String(b.question||'').trim())throw Error('יש להזין שאלת מחקר');
  if(!Array.isArray(b.toolIds)||!b.toolIds.length||b.toolIds.some(id=>!s.tools.some(t=>t.id===id)))throw Error('יש לבחור כלים קיימים במאגר');
  p.questionnaireSelections??=[];const question=String(b.question).trim().slice(0,5000);let choice=p.questionnaireSelections.find(x=>x.question===question);if(!choice){choice={id:crypto.randomUUID(),question,toolIds:[],rationales:{}};p.questionnaireSelections.push(choice)}choice.rationales??={};
  for(const id of [...new Set(b.toolIds)]){const t=s.tools.find(t=>t.id===id);if(!choice.toolIds.includes(id))choice.toolIds.push(id);choice.rationales[id]='מה הכלי מודד: '+(t.measures||t.purpose||'לא תועד')+'; נבחר עבור השאלה: '+question+'. ההתאמה מבוססת על תיאור במאגר וטעונה בחינת אוכלוסייה, גרסה ותיקוף. '+(t.validity||'מידע על תיקוף חסר');t.paperIds=[...new Set([...(t.paperIds||[]),p.id])]}choice.updated=stamp;p.updated=stamp;
 }else if(b.action==='activity'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(b.day||'')||Number.isNaN(Date.parse(b.day+'T12:00:00Z'))||new Date(b.day+'T12:00:00Z').toISOString().slice(0,10)!==b.day)throw Error('תאריך לא תקין');
  if(b.paperId&&!s.papers.some(p=>p.id===b.paperId))throw Error('מחקר לא נמצא');if(!String(b.message||'').trim())throw Error('יש להזין פעילות');
  s.activity.unshift({id:crypto.randomUUID(),date:b.day+'T12:00:00Z',createdAt:stamp,important:true,type:'milestone',manual:true,paperId:b.paperId||'',message:String(b.message).trim().slice(0,5000)});
 }else throw Error('פעולה לא נתמכת');return s;
};
