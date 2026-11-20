const clone=x=>JSON.parse(JSON.stringify(x));
function selectPaperBackup(state,paperId){const paper=state.papers.find(p=>p.id===paperId);if(!paper)throw Error('מאמר לא נמצא');let result={};for(let [key,value]of Object.entries(state))if(Array.isArray(value))result[key]=[];result.papers=[clone(paper)];
 for(let key of ['chapters','tasks','notes','submissions','requirements','analyses'])result[key]=clone((state[key]||[]).filter(r=>r.paperId===paperId));
 for(let key of ['tools','sources','opportunities'])result[key]=clone((state[key]||[]).filter(r=>(r.paperIds||[]).includes(paperId))).map(r=>({...r,paperIds:[paperId]}));
 const toolIds=new Set(result.tools.map(t=>t.id));let added=true;while(added){added=false;for(let t of [...result.tools])if(t.parentId&&!toolIds.has(t.parentId)){let parent=state.tools.find(x=>x.id===t.parentId);if(parent){result.tools.push({...clone(parent),paperIds:[]});toolIds.add(parent.id);added=true}}}
 const fileIds=new Set(state.files.filter(f=>f.paperId===paperId).map(f=>f.id));for(let key of ['chapters','tasks','notes','submissions','requirements','analyses','tools','sources','opportunities'])for(let r of result[key]||[])if(r.fileId)fileIds.add(r.fileId);if(paper.workingFileId)fileIds.add(paper.workingFileId);
 result.deletedFiles=clone((state.deletedFiles||[]).filter(f=>f.paperId===paperId));
 result.files=clone(state.files.filter(f=>fileIds.has(f.id))).map(f=>f.paperId===paperId?f:{...f,paperId:'',chapterId:''});
 result.activity=clone((state.activity||[]).filter(x=>x.paperId===paperId));result.drafts=clone((state.drafts||[]).filter(d=>d.data?.paperId===paperId||(d.key||'').split(':').includes(paperId)));result.conversations=clone((state.conversations||[]).filter(c=>c.paperId===paperId));result.legacySnapshots=[];result.rev=state.rev;return result;
}
function mergePaperBackup(current,incoming,paperId){if(incoming.papers.length!==1||incoming.papers[0].id!==paperId)throw Error('גיבוי המאמר אינו תקין');let merged=clone(current);const shared=new Set(['tools','sources','opportunities']);for(let [key,rows]of Object.entries(incoming)){if(!Array.isArray(rows)||key==='legacySnapshots')continue;merged[key]??=[];for(let r of rows){let record=clone(r),identity=key==='drafts'?'key':'id',i=merged[key].findIndex(x=>x[identity]===record[identity]);if(i<0){merged[key].push(record);continue}let old=merged[key][i];if(shared.has(key)){let ids=[...new Set([...(old.paperIds||[]),...(record.paperIds||[])])];record=(old.paperIds||[]).some(id=>id!==paperId)?{...record,...old,paperIds:ids}:{...old,...record,paperIds:ids}}else if(key==='files'&&!record.paperId&&old.paperId&&old.paperId!==paperId)record=old;merged[key][i]=record}}
 merged.rev=current.rev;return merged;
}
module.exports={selectPaperBackup,mergePaperBackup};
