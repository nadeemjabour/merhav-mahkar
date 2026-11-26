import {SupabaseBucket} from '../server/supabase-bucket.mjs';
import {authPage,escapeHtml} from '../server/auth-page.mjs';

const json=(data,status=200)=>Response.json(data,{status});
export function createHandler({env=process.env,fetcher=fetch,loadWorker=()=>import('../dist/server/workspace.mjs')}={}) {
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
  const finish=r=>{const headers=new Headers(r.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('X-Frame-Options','DENY');for(const cookie of setCookies)headers.append('Set-Cookie',cookie);return new Response(r.body,{status:r.status,headers});};
  const page=options=>new Response(authPage(options),{headers:{'Content-Type':'text/html; charset=utf-8'}});
  try {
   if(!['GET','HEAD','POST'].includes(request.method))return finish(json({error:'Method not allowed'},405));
   if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return finish(json({error:'מקור בקשה לא מורשה'},403));
   const {SUPABASE_URL:base,SUPABASE_PUBLISHABLE_KEY:key,RESEARCH_WORKSPACE_ID:workspace}=env;
   if(!base||!key||!workspace)return finish(json({error:'חיבור המרחב עדיין לא הוגדר'},503));
   const auth=async(endpoint,body,token)=>{
    const r=await fetcher(base+'/auth/v1/'+endpoint,{method:body?'POST':'GET',headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));return {ok:r.ok,status:r.status,data};
   };
   if(path==='/auth/login'||path==='/auth/signup') {
    if(request.method!=='POST')return finish(page());
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
    setSession(null);return finish(json({redirect:'/'}));
   }
   let token=cookies.get('rw-access'),identity=token?await auth('user',null,token):null;
   if(!identity?.ok&&cookies.get('rw-refresh')) {
    const refreshed=await auth('token?grant_type=refresh_token',{refresh_token:cookies.get('rw-refresh')});
    if(refreshed.ok&&refreshed.data.access_token){setSession(refreshed.data);token=refreshed.data.access_token;identity=await auth('user',null,token);}else setSession(null);
   }
   if(!identity?.ok)return finish(path==='/'?page():json({error:'יש להתחבר למרחב המחקר מחדש'},401));
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
   if(path==='/api/health')return finish(json({ok:true,storage:'Supabase',private:true}));
   // Prevent a failed initialization from silently presenting an empty workspace.
   if(!await bucket.head('state.json'))return finish(json({error:'נתוני המרחב טרם הוכנו. אין צורך להעלות את הקבצים מחדש.'},503));
   const worker=(await loadWorker()).default;
   let response=await worker.fetch(request,{BUCKET:bucket,OPENAI_API_KEY:env.OPENAI_API_KEY});
   if(path==='/'&&response.ok) {
    const account = `<details class="studio-account"><summary data-ui-aria="החשבון שלי" aria-label="החשבון שלי"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></summary><div><bdi>${escapeHtml(identity.data.email)}</bdi><button type="button" data-ui-text="יציאה" onclick="fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>{if(r.ok)location.assign('/')})">יציאה</button></div></details>`;
    const html = (await response.text()).replace('<!-- signed-in-account -->', () => account);
    response=new Response(html,{headers:response.headers});
   }
   return finish(response);
  }catch(error){console.error('Workspace request failed:',error.name);return finish(json({error:'הבקשה לא הושלמה. הנתונים השמורים לא נמחקו; נסו שוב.'},500));}
 };
}
export default {fetch:createHandler()};
