const fs=require('node:fs'),assert=require('node:assert/strict');
const JSZip=require('./vendor/jszip.js');
class Bucket{constructor(){this.map=new Map();this.rev=0}async get(k){const x=this.map.get(k);return x?{etag:x.etag,size:x.data.length,json:async()=>JSON.parse(x.data),arrayBuffer:async()=>x.data,body:new Response(x.data).body}:null}async head(k){const x=this.map.get(k);return x?{etag:x.etag,size:x.data.length}:null}async put(k,data,opt){const x=this.map.get(k);if(opt?.onlyIf?.etagMatches&&x?.etag!==opt.onlyIf.etagMatches)return null;if(opt?.onlyIf?.etagDoesNotMatch==='*'&&x)return null;const buf=typeof data==='string'?Buffer.from(data):Buffer.from(data);const etag=String(++this.rev);this.map.set(k,{data:buf,etag});return {etag}}async delete(k){this.map.delete(k)}}
(async()=>{const worker=(await import('data:text/javascript;base64,'+fs.readFileSync('dist/server/index.js').toString('base64'))).default,env={BUCKET:new Bucket()};const request=async(path,b)=>{let r=await worker.fetch(new Request('https://example.test'+path,b===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),env);if(r.status!==200)throw Error(await r.text());return r};
let s=await (await request('/api/state')).json();assert.equal(s.papers.length,0);
s=await (await request('/api/save-record',{kind:'papers',data:{id:'paper1',code:'P1',title:'בדיקת ענן'},baseline:{}})).json();assert.equal(s.chapters.length,9);
s=await (await request('/api/upload',{paperId:'paper1',name:'test.txt',data:Buffer.from('hello').toString('base64')})).json();const f=s.files[0];assert.equal(await (await request('/api/file/'+f.id)).text(),'hello');
s=await (await request('/api/workspace',{action:'delete-file',fileId:f.id})).json();assert.equal(s.files.length,0);assert.equal(s.deletedFiles[0].id,f.id);
s=await (await request('/api/workspace',{action:'restore-file',fileId:f.id})).json();assert.equal(s.files[0].id,f.id);assert.equal(await (await request('/api/file/'+f.id)).text(),'hello');
s=await (await request('/api/workspace',{action:'paper-order',ids:['paper1']})).json();assert.deepEqual(s.dashboard.paperOrder,['paper1']);
s=await (await request('/api/workspace',{action:'activity',day:'2026-11-10',message:'תכנון פגישה',paperId:'paper1'})).json();assert.equal(s.activity[0].date.slice(0,10),'2026-11-10');
const parent=s.chapters[0];s=await (await request('/api/save-record',{kind:'chapters',data:{id:'child1',paperId:'paper1',parentId:parent.id,title:'שאלת מחקר',content:'תוכן תת פרק',order:1},baseline:{}})).json();assert.equal(s.chapters.find(c=>c.id==='child1').parentId,parent.id);
const cyclic=await worker.fetch(new Request('https://example.test/api/save-record',{method:'POST',body:JSON.stringify({kind:'chapters',data:{...parent,parentId:'child1'},baseline:parent})}),env);assert.equal(cyclic.status,400);
const chat=await (await request('/api/chat',{paperId:'paper1',question:'מה חסר להשלמה?'})).json();assert.equal(chat.messages.length,2);
const ex=await (await request('/api/export-writing',{paperId:'paper1',format:'docx'})).json();assert(ex.file.size>1000);
const backup=Buffer.from(await (await request('/api/backup')).arrayBuffer());const zip=await JSZip.loadAsync(backup);assert.equal(await zip.file('files/'+f.id).async('string'),'hello');
let restored=await worker.fetch(new Request('https://example.test/api/restore',{method:'POST',headers:{'Content-Type':'application/zip'},body:backup}),env);assert.equal(restored.status,200,await restored.clone().text());assert.equal(await (await request('/api/file/'+f.id)).text(),'hello');
// A paper ZIP must restore its chat and recycled files without replacing the workspace chat.
await request('/api/workspace',{action:'delete-file',fileId:f.id});
await request('/api/chat',{question:'מה תמונת המצב הכללית?'});
const scopedResponse=await request('/api/backup?paperId=paper1');
const scopedBytes=await scopedResponse.arrayBuffer();
const scopedZip=await JSZip.loadAsync(scopedBytes);
const manifest=JSON.parse(await scopedZip.file('backup.json').async('string'));
const snapshot=JSON.parse(await scopedZip.file('state.json').async('string'));
assert.equal(manifest.scope,'paper');
assert.equal(manifest.paperId,'paper1');
assert.deepEqual(snapshot.conversations.map(c=>c.paperId),['paper1']);
assert.ok(snapshot.deletedFiles.some(file=>file.id===f.id));
assert.equal(await scopedZip.file('files/'+f.id).async('string'),'hello');
const workspaceChat=await (await request('/api/chat',{question:'What should I work on next?',language:'en'})).json();
assert.doesNotMatch(workspaceChat.messages.at(-1).text,/[\u0590-\u05ff]/);
await request('/api/chat',{paperId:'paper1',question:'אילו מקורות יש?'});
const restoredPaper=await worker.fetch(new Request('https://example.test/api/restore',{
 method:'POST',headers:{'Content-Type':'application/zip'},body:scopedBytes
}),env);
assert.equal(restoredPaper.status,200,await restoredPaper.clone().text());
assert.deepEqual((await (await request('/api/chat?paperId=paper1')).json()).messages,chat.messages);
assert.deepEqual((await (await request('/api/chat')).json()).messages,workspaceChat.messages);
await request('/api/workspace',{action:'restore-file',fileId:f.id});
assert.equal(await (await request('/api/file/'+f.id)).text(),'hello');
console.log('PASS cloud: records, chapters, file recovery, scoped conversations, Word export, full and paper ZIP restore');
})().catch(e=>{console.error(e.message.slice(0,1200));process.exit(1)});
