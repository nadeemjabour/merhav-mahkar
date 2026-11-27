const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const renderWorkspace=require('./render-workspace.cjs');
const authenticationConfigured=Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY);
const authHandler=import('../api/workspace.mjs').then(({createHandler})=>createHandler({authorizeOnly:true,discoverWorkspace:true}));
const modules=process.env.CODEX_PACKAGES||'C:/Users/PSH-Nadeem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const docx=require(require.resolve('docx',{paths:[modules]})),JSZip=require(require.resolve('jszip',{paths:[modules]}));
const root=path.resolve(process.env.POSTDOC_DATA||path.join(__dirname,'data')),folder=path.join(root,'פוסט דוקטורט ומאמרים');fs.mkdirSync(folder,{recursive:true});
for(const n of ['כללי','מאגר כלי מחקר','הזדמנויות פרסום'])fs.mkdirSync(path.join(folder,n),{recursive:true});
const db=new DatabaseSync(path.join(root,'research.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY, json TEXT NOT NULL, rev INTEGER NOT NULL);');
db.exec('CREATE TABLE IF NOT EXISTS research_chats(id TEXT PRIMARY KEY, json TEXT NOT NULL)');
const readChats=()=>db.prepare('SELECT json FROM research_chats').all().map(r=>JSON.parse(r.json));
const blank=()=>({papers:[],chapters:[],tasks:[],notes:[],files:[],tools:[],sources:[],opportunities:[],submissions:[],activity:[],drafts:[],requirements:[],analyses:[],legacySnapshots:[]});
db.prepare('INSERT OR IGNORE INTO state VALUES(1,?,0)').run(JSON.stringify(blank()));
const read=()=>{let r=db.prepare('SELECT * FROM state WHERE id=1').get();return {...blank(),...JSON.parse(r.json),rev:r.rev}};
function save(s,rev){const {rev:ignore,...data}=s;let r=db.prepare('UPDATE state SET json=?,rev=rev+1 WHERE id=1 AND rev=?').run(JSON.stringify(data),rev);if(!r.changes)throw Error('הנתונים השתנו בחלון אחר. רעננו לפני שמירה.');return read()}
const safe=s=>String(s||'ללא שם').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,100);
const categories=['טיוטות ופרקים','מקורות','כלי מחקר','נתונים וניתוח','הגשות'];
function paperDir(p){let d=path.join(folder,safe(p.code)+' - '+safe(p.folderName||p.title));fs.mkdirSync(d,{recursive:true});for(let c of categories)fs.mkdirSync(path.join(d,c),{recursive:true});return d}
function location(f){let p=path.resolve(root,f.storage);if(!p.startsWith(root+path.sep))throw Error('נתיב לא תקין');return p}
function log(s,message,paperId){s.activity.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),message,paperId});}
const id=()=>crypto.randomUUID();
async function legacyWord(p,chapters){const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,PageNumber,Footer}=docx;const rtl=p.language!=='English';const font=p.language==='العربية'?'Arial':rtl?'David':'Times New Roman';const para=(text,heading)=>new Paragraph({bidirectional:rtl,alignment:rtl?AlignmentType.RIGHT:AlignmentType.LEFT,heading,spacing:{line:360,after:120},children:[new TextRun({text:String(text||'לא הוזן'),rightToLeft:rtl,font})]});const children=[para(p.title,HeadingLevel.TITLE)];for(let c of chapters){children.push(para(c.title,HeadingLevel.HEADING_1));for(let line of (c.content||'לא הוזן').split('\n'))children.push(para(line));}return Packer.toBuffer(new Document({styles:{default:{document:{run:{font,size:24},paragraph:{spacing:{line:360}}}},heading1:{run:{font,size:32,color:'345B83'}},heading2:{run:{font,size:28,color:'345B83'}}},sections:[{properties:{page:{margin:{top:1440,bottom:1440,left:1440,right:1440}}},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({children:[PageNumber.CURRENT]})]})]})},children}]}));}
const word=require('./word.cjs');
const sessions=new Set();let port=Number(process.env.PORT||4317);
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function rawBody(req){let chunks=[],size=0;for await(let c of req){size+=c.length;if(size>2*1024*1024*1024)throw Error('הגיבוי גדול מ־2GB');chunks.push(c)}return Buffer.concat(chunks)}
async function body(req){let parts=[],size=0;for await(let c of req){size+=c.length;if(size>80*1024*1024)throw Error('הקובץ גדול מדי (עד 50MB)');parts.push(c)}return JSON.parse(Buffer.concat(parts).toString()||'{}')}
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(!['localhost','127.0.0.1'].includes((req.headers.host||'').split(':')[0]))return json(res,403,{error:'גישה מקומית בלבד'});if(req.headers.origin&&!['http://localhost:'+port,'http://127.0.0.1:'+port].includes(req.headers.origin))return json(res,403,{error:'מקור לא מורשה'});
if(['/media/research-space-loop.mp4','/media/research-space-poster.webp'].includes(u.pathname) && ['GET','HEAD'].includes(req.method)){
 const asset=path.join(__dirname,'media',path.basename(u.pathname)), size=fs.statSync(asset).size;
 const range=req.headers.range;
 const match=range && /^bytes=(\d*)-(\d*)$/.exec(range);
 const suffix=match && !match[1] && match[2];
 const start=suffix?Math.max(0,size-Number(suffix)):(match&&match[1]?Number(match[1]):0);
 const end=match&&match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
 if(range && (!match || (!match[1]&&!match[2]) || start>end || start>=size)){
   res.writeHead(416,{'Content-Range':'bytes */'+size});return res.end();
 }
 const headers={'Content-Type':u.pathname.endsWith('.webp')?'image/webp':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};
 if(range)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;
 res.writeHead(range?206:200,headers);
 if(req.method==='HEAD')return res.end();
 return fs.createReadStream(asset,{start,end}).on('error',()=>res.destroy()).pipe(res);
}
if(u.pathname==='/auth/logout' && req.method==='POST' && !authenticationConfigured){
 const token=(req.headers.cookie||'').match(/postdoc=([a-f0-9]+)/)?.[1];
 sessions.delete(token);
 res.setHeader('Set-Cookie','postdoc=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
 return json(res,200,{redirect:'/auth/login'});
}
if(u.pathname.startsWith('/auth/')||authenticationConfigured){
 const origin='http://'+req.headers.host;
 const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(req.method==='POST'?{body:u.pathname.startsWith('/auth/')?req:'{}',duplex:'half'}:{})});
 const response=await (await authHandler)(request);
 const cookieHeaders=response.headers.getSetCookie();
 for(const [name,value] of response.headers)if(!['set-cookie','content-type'].includes(name))res.setHeader(name,value);
 if(cookieHeaders.length)res.setHeader('Set-Cookie',cookieHeaders);
 if(u.pathname.startsWith('/auth/')||!response.ok||(response.headers.get('content-type')||'').includes('text/html')){
  res.statusCode=response.status;
  res.setHeader('Content-Type',response.headers.get('content-type')||'application/json; charset=utf-8');
  return res.end(Buffer.from(await response.arrayBuffer()));
 }
}
if(u.pathname==='/'){
 if(!authenticationConfigured){
  const token=crypto.randomBytes(24).toString('hex');sessions.add(token);
  res.setHeader('Set-Cookie',`postdoc=${token}; HttpOnly; SameSite=Strict; Path=/`);
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 return res.end(renderWorkspace());
}
if(!authenticationConfigured&&!sessions.has((req.headers.cookie||'').match(/postdoc=([a-f0-9]+)/)?.[1]))return json(res,403,{error:'פתחו את האפליקציה מחדש'});
if(req.method==='GET'&&u.pathname.startsWith('/legacy/')){let name=u.pathname.slice('/legacy/'.length)||'index.html';if(!['index.html','style.css','app.js','seed.js'].includes(name))throw Error('לא נמצא');res.setHeader('Content-Type',name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');return res.end(fs.readFileSync(path.join(__dirname,'legacy',name)))}
if(req.method==='POST'&&u.pathname==='/api/import-legacy'){let b=await body(req),s=read();let defaults=[];let source=path.join(__dirname,'legacy','app.js');if(fs.existsSync(source))defaults=JSON.parse(fs.readFileSync(source,'utf8').match(/const DEFAULT_RESEARCH_PLANS=(\[[^\n]+\]);/)[1]);require('./migrate-legacy.cjs')(s,b.backup,defaults);for(let p of s.papers)paperDir(p);return json(res,200,save(s,s.rev))}
if(req.method==='POST'&&u.pathname==='/api/open-window'){const result=await require('./standalone-window.cjs')('http://127.0.0.1:'+port+'/');return json(res,200,result)}
if(u.pathname==='/api/chat'){let b=req.method==='POST'?await body(req):{},pid=req.method==='POST'?(b.paperId||''):(u.searchParams.get('paperId')||''),s=read();if(pid&&!s.papers.some(p=>p.id===pid))throw Error('מאמר לא נמצא');let key='research-chat:'+pid,row=db.prepare('SELECT json FROM research_chats WHERE id=?').get(key),chat=row?JSON.parse(row.json):{id:key,paperId:pid,messages:[],contextPaperId:pid};if(req.method==='POST'){let question=String(b.question||'').trim();if(!question||question.length>2000)throw Error('יש להזין שאלה עד 2000 תווים');let answer=require('./research-chat.cjs').answerResearchQuestion(s,question,pid,chat.contextPaperId),at=new Date().toISOString();chat.messages.push({role:'user',text:question,date:at},{role:'assistant',text:answer.text,links:answer.links,date:at});chat.contextPaperId=answer.contextPaperId;chat.updated=at;db.prepare('INSERT INTO research_chats(id,json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(key,JSON.stringify(chat))}else if(req.method!=='GET')return json(res,405,{error:'פעולה לא נתמכת'});return json(res,200,chat)}
if(req.method==='POST'&&u.pathname==='/api/instrument-match'){let b=await body(req);try{return json(res,200,await require('./instrument-match.cjs')({input:b,tools:read().tools,apiKey:process.env.OPENAI_API_KEY}))}catch(e){return json(res,e.status||400,{error:e.message})}}
if(req.method==='GET'&&u.pathname==='/api/state')return json(res,200,{...read(),storage:folder});
if(req.method==='POST'&&u.pathname==='/api/save-record'){let b=await body(req),s=read();require('./record-saving.cjs').saveRecord(s,b);for(let p of s.papers)paperDir(p);return json(res,200,save(s,s.rev))}
if(req.method==='POST'&&u.pathname==='/api/workspace'){let b=await body(req),s=read();require('./workspace-actions.cjs')(s,b);return json(res,200,save(s,s.rev))}
if(req.method==='POST'&&u.pathname==='/api/draft'){let b=await body(req),s=read(),d=b.draft;if(!d||typeof d.key!=='string'||!d.data)throw Error('טיוטה לא תקינה');let i=s.drafts.findIndex(x=>x.key===d.key);if(i<0)s.drafts.push(d);else s.drafts[i]=d;return json(res,200,save(s,s.rev))}
if(req.method==='POST'&&u.pathname==='/api/state'){let b=await body(req),s=b.state;for(let k of Object.keys(blank()))if(!Array.isArray(s[k]))throw Error('מבנה נתונים לא תקין');const old=read();if(b.rev!==old.rev)throw Error('הנתונים השתנו בחלון אחר. רעננו לפני שמירה.');if(JSON.stringify(s.files)!==JSON.stringify(old.files))throw Error('יש לעדכן קבצים דרך פעולת הקבצים');for(let p of s.papers){let prev=old.papers.find(x=>x.id===p.id);if(prev&&(prev.code!==p.code||prev.folderName!==p.folderName))throw Error('אין לשנות את מזהה תיקיית המאמר');paperDir(p)}log(s,'נשמר עדכון');return json(res,200,save(s,b.rev))}
if(req.method==='POST'&&u.pathname==='/api/reassign-file'){let b=await body(req),s=read(),f=s.files.find(f=>f.id===b.fileId),p=s.papers.find(p=>p.id===b.paperId);if(!f)throw Error('קובץ לא נמצא');if(b.paperId&&!p)throw Error('מאמר לא נמצא');if(b.chapterId&&!s.chapters.some(c=>c.id===b.chapterId&&c.paperId===b.paperId))throw Error('הפרק אינו שייך למאמר');const cat=categories.includes(b.category)?b.category:f.category,src=location(f),dir=p?path.join(paperDir(p),cat):path.join(folder,'כללי');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,f.id+path.extname(src));if(dest!==src){if(fs.existsSync(dest)){if(!fs.readFileSync(src).equals(fs.readFileSync(dest)))throw Error('התנגשות קבצים, השיוך לא שונה')}else fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL);}let oldPaper=s.papers.find(x=>x.id===f.paperId);if(oldPaper&&oldPaper.id!==b.paperId&&oldPaper.workingFileId===f.id)delete oldPaper.workingFileId;f.paperId=b.paperId||'';f.chapterId=b.chapterId||'';f.category=cat;if(cat==='כלי מחקר'&&p)for(let tool of s.tools.filter(t=>t.fileId===f.id))tool.paperIds=[...new Set([...(tool.paperIds||[]),p.id])];f.storage=path.relative(root,dest);log(s,'עודכן שיוך קובץ למאמר',p?.id);return json(res,200,save(s,s.rev))}
if(req.method==='POST'&&u.pathname==='/api/upload'){let b=await body(req),s=read();let p=s.papers.find(p=>p.id===b.paperId),cat=categories.includes(b.category)?b.category:'טיוטות ופרקים';if(b.paperId&&!p)throw Error('מאמר לא נמצא');if(b.chapterId&&!s.chapters.some(c=>c.id===b.chapterId&&c.paperId===b.paperId))throw Error('הפרק אינו שייך למאמר שנבחר');const buf=Buffer.from(b.data,'base64');if(buf.length>50*1024*1024)throw Error('עד 50MB לקובץ');let fid=id(),base=p?path.join(paperDir(p),cat):path.join(folder,'כללי'),uploadFolder=require('./folder-upload.cjs')(base,b,safe);fs.mkdirSync(uploadFolder.directory,{recursive:true});let dest=path.join(uploadFolder.directory,uploadFolder.relativePath?safe(b.name):fid+'_'+safe(b.name));if(uploadFolder.relativePath){let existing=s.files.find(f=>f.folderUploadId===b.folderId&&f.relativePath===uploadFolder.relativePath);if(existing){if(!fs.readFileSync(location(existing)).equals(buf))throw Error('קובץ קיים בתוכן אחר; לא נדרס דבר');return json(res,200,s)}}fs.writeFileSync(dest,buf,{flag:'wx'});let f={id:fid,name:b.name,paperId:p?.id||'',chapterId:b.chapterId||'',category:cat,storage:path.relative(root,dest),date:new Date().toISOString(),size:buf.length,latest:true,relativePath:uploadFolder.relativePath||undefined,folderName:uploadFolder.folderName||undefined,folderUploadId:uploadFolder.folderId||undefined,sensitive:!!b.sensitive};s.files.push(f);if(cat==='כלי מחקר'&&p&&!b.sensitive){let hash=crypto.createHash('sha256').update(buf).digest('hex'),tool=s.tools.find(t=>t.contentHash===hash);if(tool){tool.paperIds=[...new Set([...(tool.paperIds||[]),p.id])]}else{s.tools.push({id:id(),name:b.name,fileId:fid,paperIds:[p.id],contentHash:hash,review:'הסבר אוטומטי – טעון בדיקה',purpose:/\.(txt|csv)$/i.test(b.name)?'קטע מתוך הקובץ, טעון בדיקה: '+buf.toString('utf8').slice(0,350):'לא הופק הסבר: פורמט הקובץ מחייב קריאה והזנה ידנית.',validity:'נדרש אימות',date:new Date().toISOString(),updated:new Date().toISOString()})}}log(s,b.sensitive?'צורף חומר פנימי למחקר':'צורף קובץ: '+b.name,p?.id);return json(res,200,save(s,s.rev))}
if(req.method==='GET'&&u.pathname.startsWith('/api/file/')){let f=read().files.find(x=>x.id===u.pathname.split('/').pop());if(!f)throw Error('קובץ לא נמצא');res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`);return res.end(fs.readFileSync(location(f)))}
if(req.method==='POST'&&u.pathname==='/api/export-writing'){let b=await body(req),s=read(),file=await require('./chapter-exports.cjs')({s,paperId:b.paperId,chapterId:b.chapterId,format:b.format,root,paperDir,word});log(s,'יוצא ונשמר קובץ '+b.format+': '+file.name,b.paperId);return json(res,200,{state:save(s,s.rev),file})}
if(req.method==='POST'&&u.pathname==='/api/session'){let b=await body(req),s=read(),p=s.papers.find(x=>x.id===b.paperId);if(!p)throw Error('מאמר לא נמצא');let chapters=s.chapters.filter(c=>c.paperId===p.id).sort((a,b)=>a.order-b.order);if(!chapters.length)throw Error('הוסיפו פרק לפני הפקת Word');let changed=chapters.filter(c=>!c.exportedAt||c.updated>c.exportedAt),date=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date()).replaceAll('/','.');let outputs=[];for(let c of [...changed,{id:'full',title:'מאמר-מלא'}]){let base=p.code+'_'+safe(c.title).replaceAll(' ','-')+'_'+date,n=1,name=base+'.docx',dir=path.join(paperDir(p),'טיוטות ופרקים');while(fs.existsSync(path.join(dir,name)))name=base+'_v'+(++n)+'.docx';let dest=path.join(dir,name),buffer=await word(p,c.id==='full'?chapters:[c]);fs.writeFileSync(dest,buffer,{flag:'wx'});for(let old of s.files.filter(f=>f.paperId===p.id&&f.chapterId===c.id&&f.generated))old.latest=false;let f={id:id(),name,paperId:p.id,chapterId:c.id,category:'טיוטות ופרקים',storage:path.relative(root,dest),date:new Date().toISOString(),size:buffer.length,latest:true,generated:true};s.files.push(f);outputs.push(f);if(c.id!=='full')c.exportedAt=new Date().toISOString();}log(s,'סיום מפגש: הופקו '+outputs.length+' קובצי Word',p.id);return json(res,200,{state:save(s,s.rev),outputs})}
if(req.method==='GET'&&u.pathname==='/api/backup'){let s={...read(),conversations:readChats()},scope=u.searchParams.get('paperId'),manifest={formatVersion:1,scope:scope?'paper':'all',paperId:scope||null,createdAt:new Date().toISOString()};if(scope){s=require('./paper-backup.cjs').selectPaperBackup(s,scope);manifest.title=s.papers[0].title}let zip=new JSZip();zip.file('state.json',JSON.stringify(s,null,2));zip.file('backup.json',JSON.stringify(manifest,null,2));for(let f of s.files){const file=location(f);fs.accessSync(file,fs.constants.R_OK);zip.file('files/'+f.id,fs.createReadStream(file));}res.setHeader('Content-Type','application/zip');res.setHeader('Content-Disposition','attachment; filename="'+(scope?'postdoc-article-backup':'postdoc-backup')+'.zip"');const stream=zip.generateNodeStream({streamFiles:true,compression:'STORE'});stream.on('error',e=>{console.error(e.message);res.destroy(e)});return stream.pipe(res)}
if(req.method==='POST'&&u.pathname==='/api/restore'){let binary=req.headers['content-type']==='application/zip',payload=binary?await rawBody(req):Buffer.from((await body(req)).data,'base64'),zip=await JSZip.loadAsync(payload),s=JSON.parse(await zip.file('state.json').async('string'));for(let k of Object.keys(blank()))if(!Array.isArray(s[k]))throw Error('גיבוי לא תקין');if(s.conversations!==undefined&&!Array.isArray(s.conversations))throw Error('היסטוריית שיחה לא תקינה');let staged=[];for(let f of s.files){if(!/^[a-f0-9-]+$/.test(f.id))throw Error('מזהה לא תקין');let entry=zip.file('files/'+f.id);if(!entry)throw Error('חסר קובץ בגיבוי');let dest=location(f),buf=await entry.async('nodebuffer');if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(buf))throw Error('התנגשות קבצים: לא בוצע שחזור');staged.push([dest,buf]);}const old=read(),manifest=zip.file('backup.json')?JSON.parse(await zip.file('backup.json').async('string')):{scope:'all'};if(manifest.scope==='paper')s=require('./paper-backup.cjs').mergePaperBackup(old,s,manifest.paperId);fs.writeFileSync(path.join(root,'before-restore-'+Date.now()+'.json'),JSON.stringify({...old,conversations:readChats()}));for(let [dest,buf] of staged){fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.writeFileSync(dest,buf,{flag:'wx'});}log(s,manifest.scope==='paper'?'שוחזר ומוזג גיבוי מאמר':'שוחזר גיבוי',manifest.paperId);let restoredChats=s.conversations;delete s.conversations;db.exec('BEGIN IMMEDIATE');try{let result=save(s,old.rev);if(Array.isArray(restoredChats)){if(manifest.scope!=='paper')db.exec('DELETE FROM research_chats');for(let chat of restoredChats){if(manifest.scope==='paper'&&chat.paperId!==manifest.paperId)throw Error('שיחה אינה שייכת למאמר בגיבוי');if(typeof chat.id!=='string'||!Array.isArray(chat.messages))throw Error('שיחה בגיבוי אינה תקינה');db.prepare('INSERT INTO research_chats(id,json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(chat.id,JSON.stringify(chat))}}db.exec('COMMIT');return json(res,200,result)}catch(e){db.exec('ROLLBACK');throw e}}
return json(res,404,{error:'לא נמצא'});
}catch(e){console.error(e.message);if(res.headersSent){res.destroy(e);return}json(res,400,{error:e.message})}});
server.on('error', error => {
  console.error(`Merhav Mahkar could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;
  console.log('Postdoc: ' + url);
  if (process.argv.includes('--open-browser')) {
    require('./standalone-window.cjs')(url).catch(error => {
      console.error('Open ' + url + ' in your browser. ' + error.message);
    });
  }
});
