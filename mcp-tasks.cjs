// Stateless MCP adapter. Reads and creates tasks through the app's existing state storage.
const VERSION='2026-07-28';
const filters={research_project_id:{type:'string',description:'Exact project ID; use list_research_projects to discover IDs.'},research_project_name:{type:'string',description:'Case-insensitive substring of the research project name.'},status:{type:'string',description:'Exact stored status or todo, in_progress, waiting, completed.'},priority:{type:'string',description:'Exact stored priority or normal, high, urgent.'},due_date:{type:'string',format:'date',description:'Exact due date YYYY-MM-DD.'},due_from:{type:'string',format:'date',description:'Inclusive earliest due date YYYY-MM-DD.'},due_to:{type:'string',format:'date',description:'Inclusive latest due date YYYY-MM-DD.'},has_due_date:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:100,default:50},offset:{type:'integer',minimum:0,maximum:100000,default:0}};
const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const TOOLS=[
 {name:'list_research_projects',description:'Read research project IDs and names from the current private Site records. Does not change data.',inputSchema:object({}),annotations},
 {name:'list_research_tasks',description:'List current research tasks, optionally filtered by project, status, priority and inclusive due dates. Sorted by due date then ID; tasks without a due date are last. Pagination is over a fresh live snapshot per call.',inputSchema:object(filters),annotations},
 {name:'search_research_tasks',description:'Search current task titles, descriptions and research project names. All whitespace-separated search terms must match. Supports the same task filters. No data changes.',inputSchema:object({query:{type:'string',minLength:1,maxLength:500},...filters},['query']),annotations},
 {name:'get_research_task',description:'Read one current task by its exact task ID, with description and available scheduling details. Does not change data.',inputSchema:object({task_id:{type:'string',minLength:1,maxLength:300}},['task_id']),annotations},
 {name:'create_research_task',description:'Create one task ONLY when the user explicitly asks to create a research task. Do not use for suggestions, drafts, reading, summaries or testing live records. Requires an existing research project. Keep the same idempotency_key and inputs on every retry, including after a timeout or ambiguous result. Same key with changed inputs is rejected. Returns the saved task; no editing or deletion is supported.',inputSchema:object({research_project_id:{type:'string',minLength:1,maxLength:300},title:{type:'string',minLength:1,maxLength:300},description:{type:'string',maxLength:5000},due_date:{type:'string',format:'date'},priority:{type:'string',enum:['normal','high','urgent','רגילה','גבוהה','דחופה'],default:'normal'},initial_status:{type:'string',enum:['todo','in_progress','waiting','completed','לביצוע','בעבודה','ממתין לשותף','הושלם'],default:'todo'},idempotency_key:{type:'string',minLength:8,maxLength:200,pattern:'^[A-Za-z0-9_.:-]+$',description:'Unique operation key, e.g. a UUID. Generate once and reuse unchanged for retries.'}},['research_project_id','title','idempotency_key']),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false}}
];
const fold=s=>String(s??'').normalize('NFKC').trim().toLocaleLowerCase();
const statusAliases={todo:'לביצוע',in_progress:'בעבודה',waiting:'ממתין לשותף',completed:'הושלם'};
const priorityAliases={normal:'רגילה',high:'גבוהה',urgent:'דחופה'};
function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value}
function argsFor(tool,args){if(args===undefined)args={};if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Arguments must be an object.');const schema=tool.inputSchema;
 for(const k of Object.keys(args)){const p=schema.properties[k];if(!p)throw Error('Unknown argument: '+k);const v=args[k];if(p.type==='string'&&(typeof v!=='string'||p.minLength&&v.trim().length<p.minLength||v.length>(p.maxLength||1000)))throw Error('Invalid string: '+k);if(p.format==='date'&&!validDate(v))throw Error('Invalid YYYY-MM-DD date: '+k);if(p.type==='integer'&&(!Number.isInteger(v)||v<p.minimum||v>p.maximum))throw Error('Invalid integer: '+k);if(p.type==='boolean'&&typeof v!=='boolean')throw Error('Invalid boolean: '+k)}
 for(const [k,p]of Object.entries(schema.properties))if(args[k]!==undefined){if(p.enum&&!p.enum.includes(args[k]))throw Error('Invalid value: '+k);if(p.pattern&&!new RegExp(p.pattern).test(args[k]))throw Error('Invalid format: '+k)}
 for(const k of schema.required)if(args[k]===undefined)throw Error('Missing argument: '+k);if(args.due_from&&args.due_to&&args.due_from>args.due_to)throw Error('due_from must not be after due_to.');return args;
}
function taskRecord(t,state){const p=(state.papers||[]).find(p=>p.id===t.paperId);const description=[['Description',t.description],['Notes',t.notes||t.note],['Completed work',t.done],['Remaining work',t.remaining]].filter(([,s])=>typeof s==='string'&&s.trim()).map(([k,s])=>k+': '+s.trim()).join('\n');
 return {id:t.id,title:t.title||'',research_project_id:t.paperId||null,research_project_name:p?.title||null,due_date:t.due||null,priority:t.priority||null,status:t.status||null,description:description||null,start_date:t.start||null,work_status:t.work||null,assigned_to:t.owner||null,chapter_id:t.chapterId||null,dependency_task_id:t.dependency||null,updated_at:t.updated||null};
}
function callReadTool(state,name,input){const tool=TOOLS.find(t=>t.name===name&&t.annotations.readOnlyHint);if(!tool)throw Error('Unknown read-only tool.');const a=argsFor(tool,input);const meta={snapshot_revision:state.rev??null,read_at:new Date().toISOString()};
 if(name==='list_research_projects')return {...meta,projects:(state.papers||[]).map(p=>({id:p.id,name:p.title||'',code:p.code||null}))};
 if(name==='get_research_task'){const t=(state.tasks||[]).find(t=>t.id===a.task_id);if(!t)throw Error('Task not found.');return {...meta,task:taskRecord(t,state)}}
 const terms=fold(a.query||'').split(/\s+/).filter(Boolean),status=statusAliases[a.status]||a.status,priority=priorityAliases[a.priority]||a.priority;
 const matched=(state.tasks||[]).map(t=>taskRecord(t,state)).filter(t=>(!a.research_project_id||t.research_project_id===a.research_project_id)&&(!a.research_project_name||fold(t.research_project_name).includes(fold(a.research_project_name)))&&(!status||fold(t.status)===fold(status))&&(!priority||fold(t.priority)===fold(priority))&&(!a.due_date||t.due_date===a.due_date)&&(!a.due_from||t.due_date&&t.due_date>=a.due_from)&&(!a.due_to||t.due_date&&t.due_date<=a.due_to)&&(a.has_due_date===undefined||Boolean(t.due_date)===a.has_due_date)&&terms.every(term=>fold([t.title,t.description,t.research_project_name].join(' ')).includes(term))).sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999')||String(a.id).localeCompare(String(b.id)));
 const offset=a.offset??0,limit=a.limit??50;return {...meta,total:matched.length,offset,limit,next_offset:offset+limit<matched.length?offset+limit:null,tasks:matched.slice(offset,offset+limit)};
}
const response=(body,status=200,headers={})=>new Response(body===null?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
class CreateError extends Error{constructor(code,message){super(message);this.code=code}}
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
async function createTask(input,identity,readState,writeState,saveTask){
 let a;try{a=argsFor(TOOLS.find(t=>t.name==='create_research_task'),input)}catch(e){throw new CreateError('VALIDATION_ERROR',e.message)}
 if(typeof writeState!=='function'||typeof saveTask!=='function')throw new CreateError('SAVE_UNAVAILABLE','Task creation is unavailable. No task was created.');
 const payload={paperId:a.research_project_id.trim(),title:a.title.trim(),description:(a.description||'').trim(),due:a.due_date||'',priority:priorityAliases[a.priority]||a.priority||'רגילה',status:statusAliases[a.initial_status]||a.initial_status||'לביצוע'};
 const key=await digest(identity.id+'\0'+identity.email+'\0'+a.idempotency_key),fingerprint=await digest(JSON.stringify(payload));
 const replay=s=>{const entry=s.mcpTaskCreates?.[key];if(!entry)return null;if(entry.fingerprint!==fingerprint)throw new CreateError('IDEMPOTENCY_CONFLICT','This idempotency key was already used with different task inputs.');const task=s.tasks.find(t=>t.id===entry.taskId);if(!task)throw new CreateError('IDEMPOTENCY_RESULT_MISSING','The original task is no longer present. This key will not create it again.');return {created:false,replayed:true,idempotency_key:a.idempotency_key,snapshot_revision:s.rev,task:taskRecord(task,s)}};
 for(let attempt=0;attempt<5;attempt++){
  const snapshot=await readState(),s=snapshot.s||snapshot;const prior=replay(s);if(prior)return prior;
  if(!s.papers.some(p=>p.id===payload.paperId))throw new CreateError('PROJECT_NOT_FOUND','Choose an existing research project ID. No task was created.');
  if(s.mcpTaskCreates!==undefined&&(!s.mcpTaskCreates||typeof s.mcpTaskCreates!=='object'||Array.isArray(s.mcpTaskCreates)))throw new CreateError('INVALID_RECEIPT_STORAGE','Task creation receipts are invalid; no task was created.');
  const stamp=new Date().toISOString(),task={id:crypto.randomUUID(),paperId:payload.paperId,title:payload.title,due:payload.due,priority:payload.priority,status:payload.status,work:payload.status==='הושלם'?'הושלם':'טרם התחיל',done:payload.status==='הושלם'?payload.description:'',remaining:payload.status==='הושלם'?'':payload.description,updated:stamp,createdAt:stamp};
  saveTask(s,task);s.mcpTaskCreates={...(s.mcpTaskCreates||{}),[key]:{taskId:task.id,fingerprint,createdAt:stamp}};
  try{const saved=await writeState(s,snapshot.etag);const persisted=saved.tasks.find(t=>t.id===task.id);if(!persisted)throw Error('Saved task could not be confirmed');return {created:true,replayed:false,idempotency_key:a.idempotency_key,snapshot_revision:saved.rev,task:taskRecord(persisted,saved)}}
  catch(e){if(e.code==='STATE_CONFLICT')continue;try{const check=await readState(),confirmed=replay(check.s||check);if(confirmed)return confirmed}catch(checkError){if(checkError instanceof CreateError)throw checkError}throw new CreateError('SAVE_UNCONFIRMED','The save could not be confirmed. Retry with exactly the same idempotency key and inputs; do not assume the task was not created.');}
 }
 throw new CreateError('RETRYABLE_CONFLICT','Concurrent changes prevented a confirmed save. Retry with the same idempotency key and inputs.');
}
async function handleMcp(request,env,readState,writeState,saveTask){
 if(request.method!=='POST')return response({error:'Use POST for the stateless MCP endpoint.'},405,{Allow:'POST'});
 let rpc;try{const text=await request.text();if(text.length>65536)throw Error();rpc=JSON.parse(text)}catch{return response({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON-RPC request.'}},400)}
 if(!rpc||Array.isArray(rpc)||rpc.jsonrpc!=='2.0'||typeof rpc.method!=='string'||rpc.id!==undefined&&typeof rpc.id!=='string'&&typeof rpc.id!=='number'&&rpc.id!==null)return response({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Invalid Request'}},400);
 const id=rpc.id??null,success=result=>response({jsonrpc:'2.0',id,result});
 if(rpc.method==='server/discover')return success({supportedVersions:[VERSION],capabilities:{tools:{}}});
 if(rpc.method==='initialize')return success({protocolVersion:VERSION,capabilities:{tools:{}},serverInfo:{name:'research-workspace',version:'1.1.0'}});
 if(rpc.method==='notifications/initialized')return response(null,202);
 if(rpc.method==='ping')return success({});
 if(rpc.method==='tools/list')return success({tools:TOOLS});
 if(rpc.method!=='tools/call')return response({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 // Discovery exposes schemas only. Access to records additionally requires verified owner identity.
 const callerId=request.headers.get('oai-authenticated-user-id'),email=fold(request.headers.get('oai-authenticated-user-email')),owner=fold(env.MCP_OWNER_EMAIL);
 if(!callerId||!email||!owner||email!==owner)return response({jsonrpc:'2.0',id,error:{code:-32001,message:'Authenticated Site owner required.'}},403);
 try{if(!rpc.params||typeof rpc.params.name!=='string')throw Error('Tool name is required.');if(!TOOLS.some(t=>t.name===rpc.params.name))throw Error('Unknown tool. No edit or delete tools are exposed.');let result;if(rpc.params.name==='create_research_task')result=await createTask(rpc.params.arguments,{id:callerId,email},readState,writeState,saveTask);else {const snapshot=await readState();result=callReadTool(snapshot.s||snapshot,rpc.params.name,rpc.params.arguments)}return success({content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result,isError:false})}
 catch(e){return success({content:[{type:'text',text:e.message||'Operation failed.'}],structuredContent:{error_code:e.code||'TOOL_ERROR',message:e.message||'Operation failed.'},isError:true})}
}
module.exports={handleMcp,callReadTool,createTask,TOOLS,VERSION};
