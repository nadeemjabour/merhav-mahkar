import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from './api/workspace.mjs';
import {SupabaseBucket} from './server/supabase-bucket.mjs';

const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',RESEARCH_WORKSPACE_ID:'workspace-test'};
const req=(path='/',options={})=>new Request('https://workspace.example'+path,options);
test('anonymous root shows sign-in and APIs require authentication',async()=>{
 const h=createHandler({env,fetcher:()=>{throw Error('unexpected request')}});
 const root=await h(req());assert.equal(root.status,200);assert.match(await root.text(),/כניסה/);
 const api=await h(req('/api/state'));assert.equal(api.status,401);assert.equal(api.headers.get('cache-control'),'private, no-store');
});
test('cross-site mutations are rejected before reading credentials',async()=>{
 const h=createHandler({env,fetcher:()=>{throw Error('unexpected request')}});
 const result=await h(req('/auth/login',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}));
 assert.equal(result.status,403);
});
test('invalid sessions cannot reach research data',async()=>{
 const h=createHandler({env,fetcher:async()=>Response.json({error:'invalid'},{status:401})});
 assert.equal((await h(req('/api/state',{headers:{cookie:'rw-access=bad'}}))).status,401);
});
test('registered user without a membership remains blocked',async()=>{
 let workerCalled=false;
 const h=createHandler({env,fetcher:async url=>url.includes('/auth/v1/user')?Response.json({id:'someone',email:'x@example.com'}):url.includes('/rpc/')?new Response(null,{status:204}):Response.json([]),loadWorker:()=>{workerCalled=true;throw Error('must not run')}});
 assert.equal((await h(req('/api/state',{headers:{cookie:'rw-access=valid'}}))).status,403);assert.equal(workerCalled,false);
});
test('authorized users receive the runtime; migration endpoints stay closed',async()=>{
 const fetcher=async url=>url.includes('/auth/v1/user')?Response.json({id:'owner',email:'owner@example.com'}):url.includes('workspace_members')?Response.json([{role:'owner'}]):Response.json([{data:{rev:1},version:'etag'}]);
 const h=createHandler({env,fetcher,loadWorker:async()=>({default:{fetch:async(_r,bindings)=>{assert.ok(bindings.BUCKET);return Response.json({ok:true})}}})});
 assert.equal((await h(req('/api/state',{headers:{cookie:'rw-access=valid'}}))).status,200);
 assert.equal((await h(req('/api/migration/status',{headers:{cookie:'rw-access=valid'}}))).status,404);
});
test('read-only members cannot mutate the workspace',async()=>{
 const h=createHandler({env,fetcher:async url=>url.includes('/auth/v1/user')?Response.json({id:'viewer'}):Response.json([{role:'viewer'}])});
 assert.equal((await h(req('/api/save-record',{method:'POST',headers:{cookie:'rw-access=valid',Origin:'https://workspace.example'},body:'{}'}))).status,403);
});
test('login stores secure HttpOnly cookies, never tokens in JSON',async()=>{
 const h=createHandler({env,fetcher:async()=>Response.json({access_token:'access-test',refresh_token:'refresh-test',expires_in:3600})});
 const r=await h(req('/auth/login',{method:'POST',headers:{Origin:'https://workspace.example'},body:JSON.stringify({email:'owner@example.com',password:'test-password'})}));
 assert.deepEqual(await r.json(),{redirect:'/'});const c=r.headers.getSetCookie();assert.equal(c.length,2);for(const v of c)assert.match(v,/HttpOnly; SameSite=Lax; Secure/);
});
test('expired tokens refresh and still require server-verified identity',async()=>{
 const calls=[];
 const h=createHandler({env,fetcher:async(url,o)=>{calls.push([url,o]);if(url.includes('grant_type=refresh_token'))return Response.json({access_token:'fresh',refresh_token:'renewed'});if(url.includes('/user'))return o.headers.Authorization==='Bearer fresh'?Response.json({id:'owner'}):Response.json({error:'expired'},{status:401});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);return Response.json([{data:{rev:1},version:'etag'}]);},loadWorker:async()=>({default:{fetch:async()=>Response.json({ok:true})}})});
 const r=await h(req('/api/state',{headers:{cookie:'rw-access=expired; rw-refresh=refresh'}}));assert.equal(r.status,200);assert.ok(calls.some(([url])=>url.includes('grant_type=refresh_token')));assert.match(r.headers.get('set-cookie'),/fresh/);
});
test('state saves pass the expected version and do not conceal a conflict',async()=>{
 let payload;
 const b=new SupabaseBucket({url:env.SUPABASE_URL,key:'public',token:'user-token',workspace:'w',fetcher:async(_url,o)=>{payload=JSON.parse(o.body);assert.equal(o.headers.get('authorization'),'Bearer user-token');return Response.json(null)}});
 assert.equal(await b.put('state.json',JSON.stringify({rev:2}),{onlyIf:{etagMatches:'old-version'}}),null);assert.equal(payload.p_expected,'old-version');
});
test('file paths stay scoped; restores do not overwrite the imported file',()=>{
 const b=new SupabaseBucket({workspace:'w'});assert.equal(b.objectPath('files/abc'),'w/abc');assert.equal(b.objectPath('restore/new/files/abc'),'w/restore/new/files/abc');assert.throws(()=>b.objectPath('../other/file'));
});
test('missing runtime state fails explicitly instead of inventing an empty workspace',async()=>{
 const h=createHandler({env,fetcher:async url=>url.includes('/auth/v1/user')?Response.json({id:'owner'}):url.includes('workspace_members')?Response.json([{role:'owner'}]):Response.json([])});
 assert.equal((await h(req('/api/state',{headers:{cookie:'rw-access=valid'}}))).status,503);
});
