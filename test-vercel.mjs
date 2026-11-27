import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
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
test('a rewritten HTML homepage renders the sign-in page while JSON requests require authentication', async () => {
 const handle = createHandler({env, fetcher: () => { throw Error('unexpected request'); }});
 const home = await handle(req('/api/workspace', {headers: {accept: 'text/html,application/xhtml+xml'}}));
 assert.equal(home.status, 200);
 assert.match(home.headers.get('content-type'), /text\/html/);
 assert.match(await home.text(), /כניסה/);
 const api = await handle(req('/api/workspace', {headers: {accept: 'application/json'}}));
 assert.equal(api.status, 401);
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

test('logout revokes the current session, clears both cookies and returns to the entrance', async () => {
 const calls=[];
 const handle=createHandler({env,fetcher:async(url,options)=>{
  calls.push(url);
  assert.equal(url,env.SUPABASE_URL+'/auth/v1/logout?scope=local');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.Authorization,'Bearer access-test');
  return new Response(null,{status:204});
 }});
 const response=await handle(req('/auth/logout',{method:'POST',headers:{Origin:'https://workspace.example',cookie:'rw-access=access-test; rw-refresh=refresh-test'},body:'{}'}));
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{redirect:'/auth/login'});
 const cookies=response.headers.getSetCookie();
 assert.equal(cookies.length,2);
 for(const cookie of cookies) {
  assert.match(cookie,/^(?:rw-access|rw-refresh)=;/);
  assert.match(cookie,/Max-Age=0/);
  assert.match(cookie,/HttpOnly; SameSite=Lax; Secure/);
 }
 assert.equal((await handle(req('/api/state'))).status,401);
 assert.match(await (await handle(req('/'))).text(),/id="entrance"/);
 const again=await handle(req('/auth/logout',{method:'POST',headers:{Origin:'https://workspace.example'},body:'{}'}));
 assert.equal(again.status,200);
 assert.equal(calls.length,1);
});

test('the direct login route displays the form without replaying the entrance', async () => {
 const handle=createHandler({env,fetcher:()=>{throw Error('unexpected request');}});
 const response=await handle(req('/auth/login'));
 const html=await response.text();
 assert.equal(response.status,200);
 assert.match(html,/<form id="login"/);
 assert.match(html,/type="email"/);
 assert.match(html,/type="password"/);
 assert.doesNotMatch(html,/id="entrance"|local-open|localSignedOut/);
});
test('local authorization reuses membership checks without loading hosted data', async () => {
 const handle=createHandler({env,authorizeOnly:true,fetcher:async url=>{
  if(url.includes('/auth/v1/user'))return Response.json({id:'owner',email:'owner@example.com'});
  if(url.includes('/rest/v1/workspace_members'))return Response.json([{role:'owner'}]);
  throw Error('Unexpected storage request');
 },loadWorker:()=>{throw Error('Hosted worker must not load');}});
 const response=await handle(req('/',{headers:{cookie:'rw-access=valid'}}));
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{ok:true,storage:'Supabase',private:true});
});
test('a local connection resolves the single workspace belonging to the verified user', async () => {
 let discovery=false;
 const handle=createHandler({env:{...env,RESEARCH_WORKSPACE_ID:undefined},authorizeOnly:true,discoverWorkspace:true,fetcher:async url=>{
  if(url.includes('/auth/v1/user'))return Response.json({id:'owner',email:'owner@example.com'});
  const params=new URL(url).searchParams;
  assert.equal(params.get('user_id'),'eq.owner');
  if(params.get('select')==='workspace_id'){
   discovery=true;assert.equal(params.get('limit'),'2');
   return Response.json([{workspace_id:'resolved-workspace'}]);
  }
  assert.equal(params.get('workspace_id'),'eq.resolved-workspace');
  return Response.json([{role:'owner'}]);
 }});
 assert.equal((await handle(req('/',{headers:{cookie:'rw-access=valid'}}))).status,200);
 assert.equal(discovery,true);
});
test('a local connection requires a selection when multiple workspaces are available', async () => {
 const handle=createHandler({env:{...env,RESEARCH_WORKSPACE_ID:undefined},authorizeOnly:true,discoverWorkspace:true,fetcher:async url=>
  url.includes('/auth/v1/user')?Response.json({id:'owner'}):Response.json([{workspace_id:'one'},{workspace_id:'two'}])
 });
 assert.equal((await handle(req('/',{headers:{cookie:'rw-access=valid'}}))).status,503);
});
test('an unapproved account cannot access the local data', async () => {
 const handle=createHandler({env:{...env,RESEARCH_WORKSPACE_ID:undefined},authorizeOnly:true,discoverWorkspace:true,fetcher:async url=>{
  if(url.includes('/auth/v1/user'))return Response.json({id:'pending',email:'pending@example.com'});
  if(url.includes('/rpc/'))return new Response(null,{status:204});
  return Response.json([]);
 }});
 assert.equal((await handle(req('/api/state',{headers:{cookie:'rw-access=valid'}}))).status,403);
 const root=await handle(req('/',{headers:{cookie:'rw-access=valid'}}));
 assert.match(await root.text(),/pending@example.com/);
});

const googleStart=handle=>handle(req('/auth/google',{method:'POST',headers:{Origin:'https://workspace.example'},body:'{}'}));
const beginGoogle=async handle=>{
 const response=await googleStart(handle);
 assert.equal(response.status,200);
 const redirect=new URL((await response.json()).redirect);
 const callback=new URL(redirect.searchParams.get('redirect_to'));
 const flow=callback.searchParams.get('flow');
 const cookie=response.headers.getSetCookie()[0];
 return {response,redirect,callback,flow,cookie,pair:cookie.split(';')[0]};
};

test('Google start is same-origin POST and reports a disabled provider without session cookies',async()=>{
 let lookups=0;
 const handle=createHandler({env,fetcher:async url=>{
  assert.equal(url,env.SUPABASE_URL+'/auth/v1/settings');
  lookups++;
  return Response.json({external:{google:false}});
 }});
 assert.equal((await handle(req('/auth/google'))).status,405);
 assert.equal((await handle(req('/auth/google',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}))).status,403);
 assert.equal(lookups,0);
 const response=await googleStart(handle);
 assert.equal(response.status,409);
 assert.match((await response.json()).error,/Google/);
 assert.deepEqual(response.headers.getSetCookie(),[]);
 assert.equal(lookups,1);
});

test('Google creates a separate PKCE verifier for each browser flow and only returns the challenge',async()=>{
 const handle=createHandler({env,fetcher:async()=>Response.json({external:{google:true}})});
 const first=await beginGoogle(handle);
 const second=await beginGoogle(handle);
 assert.notEqual(first.flow,second.flow);
 assert.notEqual(first.pair,second.pair);
 assert.equal(first.redirect.origin,env.SUPABASE_URL);
 assert.equal(first.redirect.pathname,'/auth/v1/authorize');
 assert.equal(first.redirect.searchParams.get('provider'),'google');
 assert.equal(first.redirect.searchParams.get('code_challenge_method'),'s256');
 assert.equal(first.callback.origin,'https://workspace.example');
 assert.equal(first.callback.pathname,'/auth/callback');
 assert.match(first.flow,/^[a-f0-9]{32}$/);
 assert.match(first.cookie,/Path=\/auth\/callback; HttpOnly; SameSite=Lax; Secure; Max-Age=600$/);
 const verifier=first.pair.split('=')[1];
 assert.match(verifier,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(first.redirect.searchParams.get('code_challenge'),createHash('sha256').update(verifier).digest('base64url'));
 assert.equal(first.redirect.searchParams.has('code_verifier'),false);
 assert.equal(first.redirect.href.includes(verifier),false);
});

test('Google callback exchanges the bound code server-side, consumes the flow and establishes secure cookies',async()=>{
 let exchange;
 const handle=createHandler({env,fetcher:async(url,options)=>{
  if(url.endsWith('/settings'))return Response.json({external:{google:true}});
  assert.equal(url,env.SUPABASE_URL+'/auth/v1/token?grant_type=pkce');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);
  exchange=JSON.parse(options.body);
  return Response.json({access_token:'google-access',refresh_token:'google-refresh',expires_in:3600});
 }});
 const flow=await beginGoogle(handle);
 const response=await handle(req('/auth/callback?flow='+flow.flow+'&code=one-time-code',{headers:{cookie:flow.pair}}));
 assert.deepEqual(exchange,{auth_code:'one-time-code',code_verifier:flow.pair.split('=')[1]});
 assert.equal(response.status,303);
 assert.equal(response.headers.get('location'),'/');
 assert.equal(await response.text(),'');
 const cookies=response.headers.getSetCookie();
 assert.equal(cookies.length,3);
 assert.ok(cookies.some(c=>c.startsWith('rw-oauth-'+flow.flow+'=;')&&c.endsWith('Max-Age=0')));
 assert.ok(cookies.some(c=>c.startsWith('rw-access=google-access;')));
 assert.ok(cookies.some(c=>c.startsWith('rw-refresh=google-refresh;')));
 for(const cookie of cookies)assert.match(cookie,/HttpOnly; SameSite=Lax; Secure/);
});

test('Google callbacks reject a missing verifier, an unrelated flow or a malformed callback before token exchange',async()=>{
 const handle=createHandler({env,fetcher:()=>{throw Error('The callback must not exchange a code');}});
 const flow='a'.repeat(32),other='b'.repeat(32),verifier='x'.repeat(43);
 for(const [path,cookie] of [
  ['/auth/callback?flow='+flow+'&code=test',''],
  ['/auth/callback?flow='+flow+'&code=test','rw-oauth-'+other+'='+verifier],
  ['/auth/callback?flow='+flow,'rw-oauth-'+flow+'='+verifier],
  ['/auth/callback?flow=invalid&code=test','rw-oauth-'+flow+'='+verifier],
  ['/auth/callback?flow='+flow+'&code=test','rw-oauth-'+flow+'=short']
 ]){
  const response=await handle(req(path,{headers:{cookie}}));
  assert.equal(response.status,303);
  assert.equal(response.headers.get('location'),'/auth/login?auth=google-failed');
  assert.ok(response.headers.getSetCookie().every(c=>!c.startsWith('rw-access=')&&!c.startsWith('rw-refresh=')));
 }
 assert.equal((await handle(req('/auth/callback',{method:'POST',headers:{Origin:'https://workspace.example'},body:'{}'}))).status,405);
});

test('Google cancellation and failed code exchange return to a localized, retryable login',async()=>{
 for(const failure of ['cancelled','invalid-code','network']){
  const handle=createHandler({env,fetcher:async url=>{
   if(url.endsWith('/settings'))return Response.json({external:{google:true}});
   if(failure==='network')throw Error('Fixture network failure');
   return Response.json({error:'expired code'},{status:400});
  }});
  const flow=await beginGoogle(handle);
  const query=failure==='cancelled'?'error=access_denied':'code=expired';
  const response=await handle(req('/auth/callback?flow='+flow.flow+'&'+query,{headers:{cookie:flow.pair}}));
  const location='/auth/login?auth='+(failure==='cancelled'?'google-cancelled':'google-failed');
  assert.equal(response.status,303);
  assert.equal(response.headers.get('location'),location);
  assert.equal(response.headers.getSetCookie().length,1);
  assert.match(response.headers.getSetCookie()[0],/Max-Age=0$/);
  const page=await handle(req(location));
  const html=await page.text();
  assert.match(html,/id="google-signin"/);
  assert.doesNotMatch(html,/id="entrance"/);
  assert.ok(html.includes('let messageKey = "'+(failure==='cancelled'?'googleCancelled':'googleFailed')+'";'));
 }
 const handle=createHandler({env});
 for(const outcome of ['__proto__','toString','<script>']){
  const html=await (await handle(req('/auth/login?auth='+encodeURIComponent(outcome)))).text();
  assert.ok(html.includes('let messageKey = "";'));
 }
});

test('a Google-authenticated account still needs workspace membership before any research is loaded',async()=>{
 let workerCalled=false;
 const handle=createHandler({env:{...env,GOOGLE_SIGN_IN_ONLY:'true'},fetcher:async url=>{
  if(url.endsWith('/settings'))return Response.json({external:{google:true}});
  if(url.includes('grant_type=pkce'))return Response.json({access_token:'unapproved-google',refresh_token:'fixture-refresh'});
  if(url.endsWith('/user'))return Response.json({id:'google-user',email:'pending@example.com',app_metadata:{provider:'google'}});
  if(url.includes('/rpc/'))return new Response(null,{status:204});
  return Response.json([]);
 },loadWorker:()=>{workerCalled=true;throw Error('Private research must stay protected');}});
 const flow=await beginGoogle(handle);
 const callback=await handle(req('/auth/callback?flow='+flow.flow+'&code=valid',{headers:{cookie:flow.pair}}));
 const session=callback.headers.getSetCookie().find(c=>c.startsWith('rw-access=')).split(';')[0];
 const data=await handle(req('/api/state',{headers:{cookie:session}}));
 assert.equal(data.status,403);
 assert.equal(workerCalled,false);
 const home=await handle(req('/',{headers:{cookie:session}}));
 assert.match(await home.text(),/pending@example.com/);
});

test('Google-only mode replaces the password form and refuses password endpoints without contacting Supabase',async()=>{
 const handle=createHandler({env:{...env,GOOGLE_SIGN_IN_ONLY:'true'},fetcher:()=>{throw Error('Password endpoints must not contact Supabase');}});
 for(const url of ['/','/auth/login','/auth/signup']){
  const response=await handle(req(url));assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/id="google-signin"/);
  assert.match(html,/class="social-login google-only"/);
  assert.doesNotMatch(html,/<form id="login"/);
  assert.doesNotMatch(html,/<input[^>]+name="password"/);
  if(url==='/')assert.match(html,/id="entrance"/);
 }
 for(const path of ['/auth/login','/auth/signup']){
  const response=await handle(req(path,{method:'POST',headers:{Origin:'https://workspace.example'},body:JSON.stringify({email:'fixture@example.com',password:'unused-password'})}));
  assert.equal(response.status,403);
  assert.deepEqual(response.headers.getSetCookie(),[]);
 }
 const fallback=createHandler({env,fetcher:()=>{throw Error('unexpected request');}});
 const html=await (await fallback(req('/auth/login'))).text();
 assert.match(html,/<form id="login"/);
 assert.match(html,/id="password-toggle"/);
});

test('signed-in account remains inside the collapsible sidebar with the workspace controls',async()=>{
 const renderWorkspace=createRequire(import.meta.url)('./app/render-workspace.cjs');
 const fetcher=async url=>url.includes('/auth/v1/user')
  ? Response.json({id:'owner',email:'owner@example.com'})
  : url.includes('workspace_members')?Response.json([{role:'owner'}]):Response.json([{data:{rev:1},version:'etag'}]);
 const handle=createHandler({env,fetcher,loadWorker:async()=>({default:{fetch:async()=>new Response(renderWorkspace(),{headers:{'Content-Type':'text/html; charset=utf-8'}})}})});
 const response=await handle(req('/',{headers:{cookie:'rw-access=valid'}}));
 assert.equal(response.status,200);
 const html=await response.text();
 const aside=html.match(/<aside>([\s\S]*?)<\/aside><main>/)?.[1]||'';
 assert.match(aside,/class="workspace-sidebar-tools"/);
 assert.match(aside,/class="studio-account"/);
 assert.match(aside,/owner@example.com/);
 assert.match(aside,/id="quickAdd"/);
 assert.match(aside,/id="workspace-logout"/);
});
