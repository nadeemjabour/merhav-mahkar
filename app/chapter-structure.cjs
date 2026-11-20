const crypto=require('node:crypto');
const titles=['תקציר','מבוא','סקירה ספרותית','מתודולוגיה','ממצאים','דיון','סיכום','מקורות','נספחים'];
const aliases=[['תקציר'],['מבוא','מבוא ורציונל'],['סקירה ספרותית','סקירת ספרות','סקירת ספרות ראשונית'],['מתודולוגיה'],['ממצאים'],['דיון','דיון ומסקנות','דיון ותרומה צפויה'],['סיכום','סיכום ומסקנות'],['מקורות','רשימת מקורות'],['נספחים']];
function group(c){let t=c.title.trim();if(/^Abstract$/i.test(t))return 0;if(/מסגרת תאורטית|מסגרת תיאורטית/.test(t))return 2;if(/מטרות ושאלות|מטרות המחקר|שאלות המחקר|רציונל/.test(t))return 1;if(/כלי המחקר|כלי מחקר|תכנון ניתוח|מתודולוג|ניתוח הנתונים/.test(t))return 3;if(/מסקנות המחקר|^סיכום/.test(t))return 6;if(/^נספח/.test(t))return 8;return 8}
function organize(s,ids=s.papers.map(p=>p.id)){
 for(let pid of ids){const beforeMeta=new Map(s.chapters.filter(c=>c.paperId===pid).map(c=>[c.id,JSON.stringify([c.title,c.parentId||'',c.order])]));let list=s.chapters.filter(c=>c.paperId===pid).sort((a,b)=>(a.order||0)-(b.order||0)),roots=[],used=new Set();
  for(let [i,title]of titles.entries()){let c=list.find(c=>!used.has(c.id)&&!c.parentId&&aliases[i].includes(c.title.trim()));if(!c)c=list.find(c=>!used.has(c.id)&&c.standardSection===i+1);if(!c){c={id:crypto.randomUUID(),paperId:pid,title,content:'',status:'טרם התחיל',updated:new Date().toISOString()};s.chapters.push(c)}if(c.title!==title)c.previousTitle??=c.title;c.title=title;c.parentId='';c.standardSection=i+1;roots.push(c);used.add(c.id)}
  const allIds=new Set([...list,...roots].map(c=>c.id));
  for(let c of list){if(used.has(c.id))continue;delete c.standardSection;if(!c.parentId||!allIds.has(c.parentId))c.parentId=roots[group(c)].id;
   // A conclusions subsection belongs under the separate summary heading.
   if(/^מסקנות המחקר/.test(c.title))c.parentId=roots[6].id;
  }
  let n=0,seen=new Set();function visit(c){if(seen.has(c.id))return;seen.add(c.id);c.order=++n;for(let child of list.filter(x=>x.parentId===c.id&&!used.has(x.id)))visit(child)}for(let root of roots)visit(root);
  for(let c of list)if(!seen.has(c.id)){c.parentId=roots[8].id;visit(c)}for(let c of s.chapters.filter(c=>c.paperId===pid))if(beforeMeta.has(c.id)&&beforeMeta.get(c.id)!==JSON.stringify([c.title,c.parentId||'',c.order]))c.updated=new Date().toISOString();
 }
 return s;
}
module.exports={titles,organize};
