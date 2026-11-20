const fs=require('node:fs'),path=require('node:path');
const modules='C:/Users/PSH-Nadeem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let out="import {Buffer} from 'node:buffer';\n";
out+=fs.readFileSync('vendor/docx.js','utf8')+'\n';
out+='const JSZip=(()=>{const module={exports:{}};const exports=module.exports;'+fs.readFileSync('vendor/jszip.js','utf8')+';return module.exports})();\n';
const base=path.resolve('app');
out+='const modules={};const path={sep:"/",join:(...p)=>p.join("/").replaceAll("\\\\","/"),resolve:(...p)=>p.join("/").replaceAll("\\\\","/"),dirname:p=>p.slice(0,p.lastIndexOf("/"))};\n';
out+='function require(n){if(n==="node:crypto")return crypto;if(n==="node:path")return path;if(n==="docx")return docx;if(modules[n])return modules[n];throw Error("Unsupported module: "+n)}\n';
for(const name of ['workspace-actions','chapter-structure','record-saving','paper-backup','research-chat','folder-upload','migrate-legacy','word','analysis-report','instrument-match']){
 let source=fs.readFileSync(path.join(base,name+'.cjs'),'utf8');
 if(name==='word'||name==='analysis-report')source=source.replace(/const \{createRequire\}[\s\S]*?const \{Document/, 'const {Document').replace("=r('docx');","=docx;");
 out+='modules["./'+name+'.cjs"]=(()=>{const module={exports:{}};'+source+';return module.exports})();\n';
}
let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
html=html.replace(/async function openAppWindow\(\)\{[^\n]+/,"function openAppWindow(){window.open(location.href,'_blank','noopener');}");
const analysisUi=fs.readFileSync(path.join(base,'analysis-workbench.js'),'utf8');
html=html.replace('</script></html>','</script><script>'+analysisUi+'</script></html>');
out+='const HTML='+JSON.stringify(html)+';\n';
out+='const researchMcp=(()=>{const module={exports:{}};'+fs.readFileSync('mcp-tasks.cjs','utf8')+';return module.exports})();\n';
out+=fs.readFileSync('worker.js','utf8');
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/index.js',out);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker built: '+Buffer.byteLength(out)+' bytes');
