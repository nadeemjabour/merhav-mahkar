import {randomBytes,createHash} from 'node:crypto';
import {SupabaseBucket} from '../server/supabase-bucket.mjs';
import {authPage,escapeHtml} from '../server/auth-page.mjs';

const json=(data,status=200)=>Response.json(data,{status});
export function createHandler({env=process.env,fetcher=fetch,loadWorker=()=>import('../dist/server/workspace.mjs'),authorizeOnly=false,discoverWorkspace=false}={}) {
 return async function handle(request) {
  const url = new URL(request.url);
  // A Vercel document rewrite can pass the function destination as the request URL.
  // The workspace API uses POST for mutations. A browser document GET is the homepage.
  if (url.pathname === '/api/workspace' && request.method === 'GET' &&
      (request.headers.get('accept') || '').includes('text/html')) {
    url.pathname = '/';
    request = new Request(url, request);
  }
  const path = url.pathname;
  const cookies=new Map((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split(/=(.*)/s)).filter(x=>x[0]).map(([k,v])=>[k,decodeURIComponent(v||'')]));
  const setCookies=[];
  const secure=url.protocol==='https:'?'; Secure':'';
  const setSession=session=>{
   for(const [name,value,age] of [['rw-access',session?.access_token,session?.expires_in||3600],['rw-refresh',session?.refresh_token,2592000]])
    setCookies.push(name+'='+encodeURIComponent(value||'')+'; Path=/; HttpOnly; SameSite=Lax'+secure+'; Max-Age='+(value?age:0));
  };
  const setOAuthCookie=(flow,verifier='')=>{
   setCookies.push('rw-oauth-'+flow+'='+verifier+'; Path=/auth/callback; HttpOnly; SameSite=Lax'+secure+'; Max-Age='+(verifier?600:0));
  };
  const finish=r=>{const headers=new Headers(r.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('X-Frame-Options','DENY');for(const cookie of setCookies)headers.append('Set-Cookie',cookie);return new Response(r.body,{status:r.status,headers});};
  const googleOnly=env.GOOGLE_SIGN_IN_ONLY==='true';
  const page=options=>new Response(authPage({...options,googleOnly}),{headers:{'Content-Type':'text/html; charset=utf-8'}});
  try {
   if(!['GET','HEAD','POST'].includes(request.method))return finish(json({error:'Method not allowed'},405));
   if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return finish(json({error:'מקור בקשה לא מורשה'},403));
   if((path==='/auth/login'||path==='/auth/signup')&&request.method!=='POST') {
    const outcome=url.searchParams.get('auth');
    const notice=outcome==='google-failed'?'googleFailed':outcome==='google-cancelled'?'googleCancelled':'';
    return finish(page({entrance:false,notice}));
   }
   const {SUPABASE_URL:base,SUPABASE_PUBLISHABLE_KEY:key,RESEARCH_WORKSPACE_ID:configuredWorkspace}=env;
   let workspace=configuredWorkspace;
   if(!base||!key||(!workspace&&!discoverWorkspace))return finish(json({error:'חיבור המרחב עדיין לא הוגדר'},503));
   const auth=async(endpoint,body,token)=>{
    const r=await fetcher(base+'/auth/v1/'+endpoint,{method:body?'POST':'GET',headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));return {ok:r.ok,status:r.status,data};
   };
   if(path==='/auth/google') {
    if(request.method!=='POST')return finish(json({error:'Method not allowed'},405));
    const response=await fetcher(base+'/auth/v1/settings',{headers:{apikey:key}});
    const settings=await response.json();
    if(!response.ok)throw Error('Google configuration unavailable');
    if(!settings.external?.google)return finish(json({error:'החיבור ל־Google ממתין להפעלה בידי בעל המרחב.'},409));
    const flow=randomBytes(16).toString('hex');
    const verifier=randomBytes(32).toString('base64url');
    const callback=new URL('/auth/callback',url.origin);
    callback.searchParams.set('flow',flow);
    const authorize=new URL(base+'/auth/v1/authorize');
    authorize.searchParams.set('provider','google');
    authorize.searchParams.set('redirect_to',callback.href);
    authorize.searchParams.set('code_challenge',createHash('sha256').update(verifier).digest('base64url'));
    authorize.searchParams.set('code_challenge_method','s256');
    setOAuthCookie(flow,verifier);
    return finish(json({redirect:authorize.href}));
   }
   if(path==='/auth/callback') {
    if(request.method!=='GET')return finish(json({error:'Method not allowed'},405));
    const flow=url.searchParams.get('flow')||'';
    const validFlow=/^[a-f0-9]{32}$/.test(flow);
    const verifier=validFlow?cookies.get('rw-oauth-'+flow)||'':'';
    if(validFlow)setOAuthCookie(flow);
    const failure=reason=>finish(new Response(null,{status:303,headers:{Location:'/auth/login?auth='+reason}}));
    const providerError=url.searchParams.get('error');
    if(providerError)return failure(providerError==='access_denied'?'google-cancelled':'google-failed');
    const code=url.searchParams.get('code')||'';
    if(!validFlow||!/^[A-Za-z0-9_-]{43,128}$/.test(verifier)||!code||code.length>2048)return failure('google-failed');
    const exchanged=await auth('token?grant_type=pkce',{auth_code:code,code_verifier:verifier}).catch(()=>null);
    if(!exchanged?.ok||!exchanged.data.access_token||!exchanged.data.refresh_token)return failure('google-failed');
    setSession(exchanged.data);
    return finish(new Response(null,{status:303,headers:{Location:'/'}}));
   }
   if(path==='/auth/login'||path==='/auth/signup') {
    if(googleOnly)return finish(json({error:'הכניסה למרחב זמינה באמצעות Google בלבד.'},403));
    const text=await request.text();if(text.length>10000)return finish(json({error:'הבקשה גדולה מדי'},413));
    const b=JSON.parse(text),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
    if(!email.includes('@')||password.length<8)return finish(json({error:'יש להזין דוא״ל וסיסמה באורך 8 תווים לפחות'},400));
    const signup=path==='/auth/signup';
    // Signup remains subject to Supabase email confirmation. Only a confirmed,
    // preapproved address may subsequently claim a workspace membership.
    const r=await auth(signup?'signup?redirect_to='+encodeURIComponent((env.APP_URL||url.origin)+'/auth/confirmed'):'token?grant_type=password',{email,password});
    if(!r.ok)return finish(json({error:r.status===429?'בוצעו ניסיונות רבים. נסו שוב בעוד מספר דקות.':signup?'לא ניתן ליצור חשבון כרגע. בדקו את הכתובת והסיסמה.':'הכניסה לא הצליחה. בדקו את הפרטים ואמתו את כתובת הדוא״ל.'},r.status===429?429:400));
    if(r.data.access_token){setSession(r.data);return finish(json({redirect:'/'}));}
    return finish(json({message:'בדקו את הדוא״ל, אשרו את הכתובת, ואז חזרו לכאן לכניסה.'}));
   }
   if(path==='/auth/confirmed')return finish(page({confirmed:true}));
   if(path==='/auth/logout') {
    if(request.method!=='POST')return finish(json({error:'Method not allowed'},405));
    if(cookies.get('rw-access'))await auth('logout?scope=local',{},cookies.get('rw-access'));
    setSession(null);return finish(json({redirect:'/auth/login'}));
   }
   let token=cookies.get('rw-access'),identity=token?await auth('user',null,token):null;
   if(!identity?.ok&&cookies.get('rw-refresh')) {
    const refreshed=await auth('token?grant_type=refresh_token',{refresh_token:cookies.get('rw-refresh')});
    if(refreshed.ok&&refreshed.data.access_token){setSession(refreshed.data);token=refreshed.data.access_token;identity=await auth('user',null,token);}else setSession(null);
   }
   if(!identity?.ok)return finish(path==='/'?page():json({error:'יש להתחבר למרחב המחקר מחדש'},401));
   if(!workspace && discoverWorkspace) {
    const access=new SupabaseBucket({url:base,key,token,fetcher});
    const query=new URLSearchParams({user_id:'eq.'+identity.data.id,select:'workspace_id',limit:'2'});
    const memberships=async()=>{
     const response=await access.request('/rest/v1/workspace_members?'+query);
     if(!response.ok)throw Error('בדיקת ההרשאה נכשלה');
     return response.json();
    };
    let available=await memberships();
    if(!available.length) {
     const claimed=await access.request('/rest/v1/rpc/claim_workspace_access',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
     if(!claimed.ok)throw Error('בדיקת ההרשאה נכשלה');
     available=await memberships();
    }
    if(available.length>1)return finish(json({error:'יש לבחור מרחב מחקר בהגדרות החיבור המקומי'},503));
    workspace=available[0]?.workspace_id;
    if(!workspace)return finish(path==='/'?page({pending:true,email:identity.data.email}):json({error:'אין לחשבון זה הרשאה למרחב'},403));
   }
   const bucket=new SupabaseBucket({url:base,key,token,workspace,fetcher});
   let membership=await bucket.request('/rest/v1/workspace_members?'+new URLSearchParams({workspace_id:'eq.'+workspace,user_id:'eq.'+identity.data.id,select:'role'}));
   if(!membership.ok)throw Error('בדיקת ההרשאה נכשלה');
   let members=await membership.json();
   if(!members.length) {
    const claimed=await bucket.request('/rest/v1/rpc/claim_workspace_access',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!claimed.ok)throw Error('בדיקת ההרשאה נכשלה');
    membership=await bucket.request('/rest/v1/workspace_members?'+new URLSearchParams({workspace_id:'eq.'+workspace,user_id:'eq.'+identity.data.id,select:'role'}));
    if(!membership.ok)throw Error('בדיקת ההרשאה נכשלה');
    members=await membership.json();
   }
   if(!members.length)return finish(path==='/'?page({pending:true,email:identity.data.email}):json({error:'אין לחשבון זה הרשאה למרחב'},403));
   if(request.method==='POST'&&!['owner','editor'].includes(members[0].role))return finish(json({error:'לחשבון זה הרשאת צפייה בלבד'},403));
   // Migration endpoints and the old Sites-specific MCP are not public APIs.
   if(path==='/mcp'||path.startsWith('/api/migration/'))return finish(json({error:'Not found'},404));
   if(path==='/api/health'||authorizeOnly)return finish(json({ok:true,storage:'Supabase',private:true}));
   // Prevent a failed initialization from silently presenting an empty workspace.
   if(!await bucket.head('state.json'))return finish(json({error:'נתוני המרחב טרם הוכנו. אין צורך להעלות את הקבצים מחדש.'},503));
   const worker=(await loadWorker()).default;
   let response=await worker.fetch(request,{BUCKET:bucket,OPENAI_API_KEY:env.OPENAI_API_KEY});
   if(path==='/'&&response.ok) {
    const account = `<details class="studio-account"><summary data-ui-aria="החשבון שלי" aria-label="החשבון שלי"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></summary><div><bdi>${escapeHtml(identity.data.email)}</bdi><button type="button" data-ui-text="יציאה" data-workspace-logout onclick="signOut()">יציאה</button></div></details>`;
    const html = (await response.text()).replace('<!-- signed-in-account -->', () => account);
    response=new Response(html,{headers:response.headers});
   }
   return finish(response);
  }catch(error){console.error('Workspace request failed:',error.name);return finish(json({error:'הבקשה לא הושלמה. הנתונים השמורים לא נמחקו; נסו שוב.'},500));}
 };
}
export default {fetch:createHandler()};
