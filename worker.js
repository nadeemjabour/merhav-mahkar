const keys=['papers','chapters','tasks','notes','files','tools','sources','opportunities','submissions','activity','drafts','requirements','analyses','legacySnapshots'];
const blank=()=>Object.fromEntries(keys.map(k=>[k,[]]));
const safe=s=>String(s||'ללא שם').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,100);
const categories=['טיוטות ופרקים','מקורות','כלי מחקר','נתונים וניתוח','הגשות'];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const fail=m=>{throw Error(m)};
const log=(s,message,paperId)=>s.activity.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),message,paperId});
const fileKey=f=>f.cloudKey||'files/'+f.id;
const dateStamp=()=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date()).replaceAll('/','.');
function paper(s,id){return s.papers.find(p=>p.id===id)||fail('מאמר לא נמצא')}
function validate(s){for(const k of keys)if(!Array.isArray(s[k]))fail('מבנה נתונים לא תקין');return s}
async function load(env){const obj=await env.BUCKET.get('state.json');return {s:obj?{...blank(),...await obj.json()}: {...blank(),rev:0},etag:obj?.etag}}
async function save(env,s,etag){s.rev=(s.rev||0)+1;const result=await env.BUCKET.put('state.json',JSON.stringify(s),{onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:'*'}});if(!result){const error=new Error('הנתונים השתנו בחלון אחר. הטיוטה נשמרה; רעננו ונסו שוב.');error.code='STATE_CONFLICT';throw error}return s}
async function fileObject(env,f){return await env.BUCKET.get(fileKey(f))||fail('קובץ לא נמצא באחסון')}
async function generated(env,s,p,chapterId,format,chapters){
 if(!['md','docx'].includes(format))fail('פורמט ייצוא לא נתמך');
 const label=chapterId==='full'?'מאמר-מלא':chapters[0].title,base=p.code+'_'+safe(label).replaceAll(' ','-')+'_'+dateStamp();
 let version=1,name=base+'.'+format;while(s.files.some(f=>f.paperId===p.id&&f.name===name))name=base+'_v'+(++version)+'.'+format;
 const data=format==='docx'?await require('./word.cjs')(p,chapters):Buffer.from('# '+p.title+'\n\n'+chapters.map(c=>'## '+c.title+'\n\n'+(c.content||'')).join('\n\n---\n\n'));
 const f={id:crypto.randomUUID(),name,paperId:p.id,chapterId,category:categories[0],storage:'cloud',date:new Date().toISOString(),size:data.length,latest:true,generated:true,format};
 await env.BUCKET.put(fileKey(f),data);for(const old of s.files.filter(x=>x.paperId===p.id&&x.chapterId===chapterId&&x.generated&&x.name.endsWith('.'+format)))old.latest=false;s.files.push(f);return f;
}
export default {async fetch(request,env){try{
 const u=new URL(request.url),route=u.pathname,post=request.method==='POST';
 if(route==='/mcp')return researchMcp.handleMcp(request,env,()=>load(env),(s,etag)=>save(env,s,etag),(s,data)=>require('./record-saving.cjs').saveRecord(s,{kind:'tasks',data,baseline:{}}));
 // Sites dispatch enforces owner-only access before requests reach this Worker.
 if(request.headers.has('Origin')&&request.headers.get('Origin')!==u.origin)return json({error:'מקור לא מורשה'},403);
 if(route==='/')return new Response(HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!env.BUCKET)return json({error:'אחסון האתר לא חובר'},503);
 if(route==='/api/health')return json({ok:true,storage:'R2',private:true});
 const {s,etag}=await load(env);
 if(post&&route==='/api/instrument-match'){
  const input=await request.json();
  const result=await require('./instrument-match.cjs')({input,tools:s.tools,apiKey:env.OPENAI_API_KEY});
  return json(result);
 }
 if(route==='/api/migration/status'){let missing=[];for(let i=0;i<s.files.length;i+=30){const group=s.files.slice(i,i+30);const flags=await Promise.all(group.map(f=>env.BUCKET.head(fileKey(f))));flags.forEach((obj,j)=>{if(!obj)missing.push(group[j].id)})}return json({papers:s.papers.length,files:s.files.length,missing,rev:s.rev})}
 if(post&&route==='/api/migration/file'){const id=u.searchParams.get('id');if(!/^[a-zA-Z0-9_-]+$/.test(id||''))fail('מזהה לא תקין');const buf=await request.arrayBuffer();if(buf.byteLength>50*1024*1024)fail('קובץ גדול מדי');const prior=await env.BUCKET.head('files/'+id);if(prior&&prior.size!==buf.byteLength)fail('התנגשות קבצים');await env.BUCKET.put('files/'+id,buf);return json({ok:true,id,size:buf.byteLength})}
 if(post&&route==='/api/migration/state'){if(etag)fail('הנתונים כבר הועברו; לא נדרס דבר');const b=await request.json();validate(b.state);for(const f of b.state.files){const obj=await env.BUCKET.head(fileKey(f));if(!obj||obj.size!==f.size)fail('העברת קבצים לא הושלמה: '+f.id)}for(const chat of b.conversations||[])await env.BUCKET.put('chats/'+encodeURIComponent(chat.id),JSON.stringify(chat));return json(await save(env,b.state,etag))}
 if(post&&route==='/api/workspace'){require('./workspace-actions.cjs')(s,await request.json());return json(await save(env,s,etag))}
 if(route==='/api/state'&&!post)return json({...s,storage:'אחסון מקוון פרטי'});
 if(route==='/api/chat'){
 const b=post?await request.json():{},pid=post?(b.paperId||''):(u.searchParams.get('paperId')||'');if(pid)paper(s,pid);
 const key='research-chat:'+pid,obj=await env.BUCKET.get('chats/'+encodeURIComponent(key));const chat=obj?await obj.json():{id:key,paperId:pid,messages:[],contextPaperId:pid};
 if(post){const question=String(b.question||'').trim();if(!question||question.length>2000)fail('יש להזין שאלה עד 2000 תווים');const answer=require('./research-chat.cjs').answerResearchQuestion(s,question,pid,chat.contextPaperId,b.language),at=new Date().toISOString();chat.messages.push({role:'user',text:question,date:at},{role:'assistant',text:answer.text,links:answer.links,date:at});chat.contextPaperId=answer.contextPaperId;chat.updated=at;const saved=await env.BUCKET.put('chats/'+encodeURIComponent(key),JSON.stringify(chat),{onlyIf:obj?{etagMatches:obj.etag}:{etagDoesNotMatch:'*'}});if(!saved)fail('השיחה עודכנה בחלון אחר. רעננו ונסו שוב.')}return json(chat);
 }
 if(post&&route==='/api/save-record'){require('./record-saving.cjs').saveRecord(s,await request.json());return json(await save(env,s,etag))}
 if(post&&route==='/api/analysis-workbench'){
  const b=await request.json(),f=s.files.find(x=>x.id===b.fileId)||fail('קובץ הנתונים השמור לא נמצא'),p=paper(s,b.paperId||f.paperId);
  // A research analysis may intentionally use a CSV stored under another
  // paper (or an unassigned file). The user explicitly selects the target
  // paper; keep the source file untouched and associate only the analysis.
  if(typeof b.sourceKey!=='string'||b.sourceKey.length>300||!Array.isArray(b.mapping)||!Array.isArray(b.measures))fail('מצב הניתוח אינו תקין');
  const data={id:'analysis-workbench-'+f.id,type:'analysis_workbench_state',paperId:p.id,fileId:f.id,fileName:f.name,sourceKey:b.sourceKey,mapping:b.mapping,measures:b.measures,results:Array.isArray(b.results)?b.results:null,outputConfig:b.outputConfig||{},outputTables:b.outputTables||null,inferentialConfig:b.inferentialConfig||{},inferentialResult:b.inferentialResult||null,inferentialHistory:Array.isArray(b.inferentialHistory)?b.inferentialHistory:[],reliabilityResults:Array.isArray(b.reliabilityResults)?b.reliabilityResults:[],paragraphs:b.paragraphs||{},resultView:b.resultView==='cards'?'cards':'spss',updated:new Date().toISOString()};
  if(Buffer.byteLength(JSON.stringify(data))>8*1024*1024)fail('מצב הניתוח גדול מדי לשמירה');
  const i=s.analyses.findIndex(x=>x.id===data.id);if(i<0)s.analyses.push(data);else s.analyses[i]=data;
  return json(await save(env,s,etag));
 }
 if(post&&route==='/api/analysis-report'){
  const b=await request.json(),f=s.files.find(x=>x.id===b.fileId)||fail('קובץ הנתונים השמור לא נמצא'),p=paper(s,b.paperId||f.paperId);
  // Honor the research selected in the analysis screen. The source CSV stays
  // in its current file association; only this generated report belongs here.
  if(!Array.isArray(b.measures)||!b.measures.length||b.measures.length>100)fail('אין מדדים מחושבים להכללה בדוח');
  const report=await require('./analysis-report.cjs')({...b,paperTitle:p.title,fileName:f.name,createdAt:new Date().toLocaleDateString('he-IL')});
  const name=p.code+'_דוח_ניתוח_'+dateStamp()+'.docx',out={id:crypto.randomUUID(),name,paperId:p.id,chapterId:'',category:'נתונים וניתוח',storage:'cloud',date:new Date().toISOString(),size:report.length,latest:true,generated:true,format:'docx'};
  await env.BUCKET.put(fileKey(out),report);s.files.push(out);log(s,'הופק דוח ניתוח Word: '+out.name,p.id);
  return json({state:await save(env,s,etag),file:out});
 }
 if(post&&route==='/api/draft'){const {draft:d}=await request.json();if(!d||typeof d.key!=='string'||!d.data)fail('טיוטה לא תקינה');let i=s.drafts.findIndex(x=>x.key===d.key);if(i<0)s.drafts.push(d);else s.drafts[i]=d;return json(await save(env,s,etag))}
 if(post&&route==='/api/state'){const b=await request.json(),next=validate(b.state);if(b.rev!==s.rev)fail('הנתונים השתנו בחלון אחר. רעננו לפני שמירה.');if(JSON.stringify(next.files)!==JSON.stringify(s.files))fail('יש לעדכן קבצים דרך פעולת הקבצים');for(const p of next.papers){const prev=s.papers.find(x=>x.id===p.id);if(prev&&(prev.code!==p.code||prev.folderName!==p.folderName))fail('אין לשנות את מזהה תיקיית המאמר')}next.rev=s.rev;log(next,'נשמר עדכון');return json(await save(env,next,etag))}
 if(post&&route==='/api/upload'){
 const b=await request.json(),p=b.paperId?paper(s,b.paperId):null,cat=categories.includes(b.category)?b.category:categories[0];if(b.chapterId&&!s.chapters.some(c=>c.id===b.chapterId&&c.paperId===b.paperId))fail('הפרק אינו שייך למאמר');
 const data=Buffer.from(b.data,'base64');if(data.length>50*1024*1024)fail('עד 50MB לקובץ');const ft=require('./folder-upload.cjs')('uploads',b,safe);
 if(ft.relativePath){const existing=s.files.find(f=>f.folderUploadId===b.folderId&&f.relativePath===ft.relativePath);if(existing){const old=await fileObject(env,existing);if(!Buffer.from(await old.arrayBuffer()).equals(data))fail('קובץ קיים בתוכן אחר');return json(s)}}
 const f={id:crypto.randomUUID(),name:b.name,paperId:p?.id||'',chapterId:b.chapterId||'',category:cat,storage:'cloud',date:new Date().toISOString(),size:data.length,latest:true,relativePath:ft.relativePath||undefined,folderName:ft.folderName||undefined,folderUploadId:ft.folderId||undefined,sensitive:!!b.sensitive};await env.BUCKET.put(fileKey(f),data);s.files.push(f);
 if(cat==='כלי מחקר'&&p&&!b.sensitive){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',data)).toString('hex'),tool=s.tools.find(t=>t.contentHash===hash);if(tool)tool.paperIds=[...new Set([...(tool.paperIds||[]),p.id])];else s.tools.push({id:crypto.randomUUID(),name:b.name,fileId:f.id,paperIds:[p.id],contentHash:hash,review:'הסבר אוטומטי – טעון בדיקה',purpose:'הקובץ צורף; יש לקרוא ולהזין הסבר ידני.',validity:'נדרש אימות',date:f.date,updated:f.date})}
 log(s,b.sensitive?'צורף חומר פנימי למחקר':'צורף קובץ: '+b.name,p?.id);return json(await save(env,s,etag));
 }
 if(post&&route==='/api/reassign-file'){const b=await request.json(),f=s.files.find(f=>f.id===b.fileId)||fail('קובץ לא נמצא');if(b.paperId)paper(s,b.paperId);if(b.chapterId&&!s.chapters.some(c=>c.id===b.chapterId&&c.paperId===b.paperId))fail('הפרק אינו שייך למאמר');const old=s.papers.find(p=>p.id===f.paperId);if(old&&old.id!==b.paperId&&old.workingFileId===f.id)delete old.workingFileId;f.paperId=b.paperId||'';f.chapterId=b.chapterId||'';f.category=categories.includes(b.category)?b.category:f.category;if(f.category==='כלי מחקר'&&b.paperId)for(const t of s.tools.filter(t=>t.fileId===f.id))t.paperIds=[...new Set([...(t.paperIds||[]),b.paperId])];log(s,'עודכן שיוך קובץ למאמר',b.paperId);return json(await save(env,s,etag))}
 if(!post&&route.startsWith('/api/file/')){const f=s.files.find(f=>f.id===route.split('/').pop())||fail('קובץ לא נמצא'),obj=await fileObject(env,f);return new Response(obj.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,'Cache-Control':'private, no-store'}})}
 if(post&&route==='/api/export-writing'){const b=await request.json(),p=paper(s,b.paperId),all=s.chapters.filter(c=>c.paperId===p.id).sort((a,b)=>a.order-b.order);if(!all.length)fail('הוסיפו פרק לפני ייצוא');let chapters=all;if(b.chapterId){if(!all.some(c=>c.id===b.chapterId))fail('פרק לא נמצא');const ids=new Set([b.chapterId]);for(let i=0;i<all.length;i++)for(const c of all)if(ids.has(c.parentId))ids.add(c.id);chapters=all.filter(c=>ids.has(c.id))}const file=await generated(env,s,p,b.chapterId||'full',b.format,chapters);log(s,'יוצא ונשמר קובץ '+b.format+': '+file.name,p.id);return json({state:await save(env,s,etag),file})}
 if(post&&route==='/api/session'){const b=await request.json(),p=paper(s,b.paperId),chapters=s.chapters.filter(c=>c.paperId===p.id).sort((a,b)=>a.order-b.order);if(!chapters.length)fail('הוסיפו פרק לפני הפקת Word');const outputs=[];for(const c of chapters.filter(c=>!c.exportedAt||c.updated>c.exportedAt)){outputs.push(await generated(env,s,p,c.id,'docx',[c]));c.exportedAt=new Date().toISOString()}outputs.push(await generated(env,s,p,'full','docx',chapters));log(s,'סיום מפגש: הופקו '+outputs.length+' קובצי Word',p.id);return json({state:await save(env,s,etag),outputs})}
 if(!post&&route==='/api/backup'){
 let snapshot=structuredClone(s);snapshot.conversations=[];for(const pid of ['',...s.papers.map(p=>p.id)]){const c=await env.BUCKET.get('chats/'+encodeURIComponent('research-chat:'+pid));if(c)snapshot.conversations.push(await c.json())}
 const pid=u.searchParams.get('paperId');if(pid)snapshot=require('./paper-backup.cjs').selectPaperBackup(snapshot,pid);
 const entries=[{name:'state.json',data:Buffer.from(JSON.stringify(snapshot,null,2))},{name:'backup.json',data:Buffer.from(JSON.stringify({formatVersion:1,scope:pid?'paper':'all',paperId:pid||null,createdAt:new Date().toISOString()}))},...[...snapshot.files,...(snapshot.deletedFiles||[])].map(f=>({name:'files/'+f.id,file:f}))];
 return new Response(zipStream(env,entries),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="postdoc-backup.zip"','Cache-Control':'no-store'}});
 }
 if(post&&route==='/api/restore'){
 const input=request.headers.get('Content-Type')==='application/zip'?request.body:new Response(Buffer.from((await request.json()).data,'base64')).body;
 const reader=new ZipReader(input),prefix='restore/'+crypto.randomUUID()+'/',restored=new Map();let incoming,manifest;
 while(true){const entry=await reader.next();if(!entry)break;if(entry.name==='state.json')incoming=JSON.parse(Buffer.from(entry.data).toString());else if(entry.name==='backup.json')manifest=JSON.parse(Buffer.from(entry.data).toString());else if(/^files\/[a-zA-Z0-9_-]+$/.test(entry.name)){const key=prefix+entry.name;await env.BUCKET.put(key,entry.data);restored.set(entry.name.slice(6),{key,size:entry.data.length})}}
 validate(incoming||{});for(const f of [...incoming.files,...(incoming.deletedFiles||[])]){const staged=restored.get(f.id);if(!staged||staged.size!==f.size)fail('קובץ חסר בגיבוי');f.cloudKey=staged.key}
 const chats=incoming.conversations;delete incoming.conversations;if(chats&&!Array.isArray(chats))fail('שיחה לא תקינה');const scope=manifest?.scope==='paper',pid=manifest?.paperId;
 let next=scope?require('./paper-backup.cjs').mergePaperBackup(s,incoming,pid):incoming;next.rev=s.rev;log(next,scope?'שוחזר ומוזג גיבוי מאמר':'שוחזר גיבוי',pid);
 await env.BUCKET.put('safety/before-restore-'+Date.now()+'.json',JSON.stringify(s));const result=await save(env,next,etag);
 if(Array.isArray(chats)){if(!scope)for(const p of ['',...s.papers.map(p=>p.id)])await env.BUCKET.delete('chats/'+encodeURIComponent('research-chat:'+p));for(const chat of chats){if(scope&&chat.paperId!==pid)continue;await env.BUCKET.put('chats/'+encodeURIComponent(chat.id),JSON.stringify(chat))}}return json(result);
 }
 if(post&&route==='/api/import-legacy'){const b=await request.json();require('./migrate-legacy.cjs')(s,b.backup,[]);return json(await save(env,s,etag))}
 return json({error:'לא נמצא'},404);
 }catch(e){return json({error:e.message},e.status||400)}}};

const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc32(bytes,initial=0xffffffff){let crc=initial;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return crc>>>0}
function zipStream(env,entries){let offset=0,index=0,central=[],active;return new ReadableStream({async pull(controller){try{
 if(active){const {value,done}=await active.reader.read();if(!done){active.crc=crc32(value,active.crc);active.size+=value.length;offset+=value.length;controller.enqueue(value);return}const d=Buffer.alloc(16);d.writeUInt32LE(0x08074b50);d.writeUInt32LE((active.crc^0xffffffff)>>>0,4);d.writeUInt32LE(active.size,8);d.writeUInt32LE(active.size,12);offset+=16;controller.enqueue(d);central.push({...active,reader:undefined});active=null;return}
 if(index<entries.length){const entry=entries[index++],name=Buffer.from(entry.name),start=offset,header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x808,6);header.writeUInt16LE(name.length,26);offset+=30+name.length;controller.enqueue(Buffer.concat([header,name]));const body=entry.file?(await fileObject(env,entry.file)).body:new Response(entry.data).body;active={name,start,size:0,crc:0xffffffff,reader:body.getReader()};return}
 const centralStart=offset;for(const e of central){const h=Buffer.alloc(46);h.writeUInt32LE(0x02014b50);h.writeUInt16LE(20,4);h.writeUInt16LE(20,6);h.writeUInt16LE(0x808,8);h.writeUInt32LE((e.crc^0xffffffff)>>>0,16);h.writeUInt32LE(e.size,20);h.writeUInt32LE(e.size,24);h.writeUInt16LE(e.name.length,28);h.writeUInt32LE(e.start,42);controller.enqueue(Buffer.concat([h,e.name]));offset+=46+e.name.length}const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(central.length,8);end.writeUInt16LE(central.length,10);end.writeUInt32LE(offset-centralStart,12);end.writeUInt32LE(centralStart,16);controller.enqueue(end);controller.close();
 }catch(e){controller.error(e)}},async cancel(){if(active)await active.reader.cancel()}})}
class ZipReader{
 constructor(stream){this.reader=stream.getReader();this.buf=Buffer.alloc(0);this.total=0;this.done=false}
 async fill(n){while(this.buf.length<n&&!this.done){const r=await this.reader.read();this.done=r.done;if(r.value){this.total+=r.value.length;if(this.total>2*1024*1024*1024)fail('הגיבוי גדול מ־2GB');this.buf=Buffer.concat([this.buf,r.value])}}if(this.buf.length<n)fail('גיבוי לא שלם')}
 async take(n){await this.fill(n);const out=this.buf.subarray(0,n);this.buf=this.buf.subarray(n);return out}
 async next(){await this.fill(4);if(this.buf.readUInt32LE(0)!==0x04034b50)return null;const h=await this.take(30),flags=h.readUInt16LE(6),method=h.readUInt16LE(8),length=h.readUInt32LE(18),name=(await this.take(h.readUInt16LE(26))).toString();await this.take(h.readUInt16LE(28));if(flags&1)fail('גיבוי מוצפן אינו נתמך');if(![0,8].includes(method))fail('שיטת דחיסה לא נתמכת');let data;
 if(!(flags&8)){if(length>55*1024*1024)fail('קובץ בגיבוי גדול מדי');data=await this.take(length);if(method===8){const zip=new JSZip();fail('יש להעלות גיבוי בפורמט STORE מהאפליקציה המקורית')}if(((crc32(data)^0xffffffff)>>>0)!==h.readUInt32LE(14))fail('קובץ בגיבוי פגום')}
 else{if(method!==0)fail('גיבוי דחוס זורם אינו נתמך');let chunks=[],size=0,crc=0xffffffff;while(true){await this.fill(16);let pos=this.buf.indexOf(Buffer.from([0x50,0x4b,0x07,0x08]));if(pos>=0){await this.fill(pos+16);const candidate=this.buf.subarray(0,pos),nextCrc=crc32(candidate,crc),descriptor=this.buf.subarray(pos,pos+16);if(descriptor.readUInt32LE(4)===((nextCrc^0xffffffff)>>>0)&&descriptor.readUInt32LE(8)===size+pos&&descriptor.readUInt32LE(12)===size+pos){chunks.push(candidate);this.buf=this.buf.subarray(pos+16);data=Buffer.concat(chunks);break}pos+=4}else pos=Math.max(1,this.buf.length-15);const chunk=await this.take(pos);chunks.push(chunk);size+=chunk.length;crc=crc32(chunk,crc);if(size>55*1024*1024)fail('קובץ בגיבוי גדול מדי')}}return {name,data};
 }
}
