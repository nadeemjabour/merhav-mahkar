export class SupabaseBucket {
  constructor({url,key,token,workspace,fetcher=fetch}) {
    Object.assign(this,{url,key,token,workspace,fetcher});
  }
  async request(path,options={}) {
    const headers = new Headers(options.headers);
    headers.set('apikey',this.key);
    headers.set('Authorization','Bearer '+this.token);
    return this.fetcher(this.url+path,{...options,headers});
  }
  isDocument(key) { return key==='state.json'||key.startsWith('chats/')||key.startsWith('safety/'); }
  objectPath(key) {
    if(!key || key.includes('..') || key.startsWith('/')) throw Error('Invalid storage path');
    // Imported files were uploaded under their original IDs, including archived files.
    const id=/^files\/([a-zA-Z0-9_-]+)$/.exec(key);
    return this.workspace+'/'+(id?id[1]:key);
  }
  async get(key) {
    if(this.isDocument(key)) {
      const q=new URLSearchParams({workspace_id:'eq.'+this.workspace,key:'eq.'+key,select:'data,version'});
      const response=await this.request('/rest/v1/workspace_runtime_objects?'+q);
      if(!response.ok) throw Error('לא ניתן לקרוא את נתוני המרחב');
      const [row]=await response.json();
      if(!row)return null;
      const bytes=new TextEncoder().encode(JSON.stringify(row.data));
      return {etag:row.version,size:bytes.length,json:async()=>structuredClone(row.data),
        arrayBuffer:async()=>bytes.buffer,body:new Response(bytes).body};
    }
    const path=this.objectPath(key).split('/').map(encodeURIComponent).join('/');
    const r=await this.request('/storage/v1/object/authenticated/research-files/'+path);
    if(r.status===404)return null;
    if(!r.ok) {
      // Storage uses 400 for a missing object on some versions.
      if(r.status===400){const body=await r.clone().json().catch(()=>({}));if(body.error==='not_found'||body.statusCode==='404')return null;}
      throw Error('לא ניתן לקרוא את הקובץ השמור');
    }
    return {etag:r.headers.get('etag'),size:Number(r.headers.get('content-length')),body:r.body,
      arrayBuffer:()=>r.arrayBuffer(),json:()=>r.json()};
  }
  async head(key) { const r=await this.get(key);if(!r)return null;await r.body?.cancel();return {etag:r.etag,size:r.size}; }
  async put(key,value,options={}) {
    if(this.isDocument(key)) {
      const data=typeof value==='string'?JSON.parse(value):JSON.parse(new TextDecoder().decode(value));
      const r=await this.request('/rest/v1/rpc/write_workspace_object',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({p_workspace:this.workspace,p_key:key,p_data:data,
          p_expected:options.onlyIf?.etagMatches||null,p_if_absent:options.onlyIf?.etagDoesNotMatch==='*'})});
      if(!r.ok)throw Error('שמירת הנתונים נכשלה. הנתונים הקודמים נשארו שמורים.');
      return r.json();
    }
    const path=this.objectPath(key).split('/').map(encodeURIComponent).join('/');
    const r=await this.request('/storage/v1/object/research-files/'+path,{method:'POST',
      headers:{'Content-Type':'application/octet-stream','x-upsert':'true'},body:value});
    if(!r.ok)throw Error('שמירת הקובץ נכשלה');
    return {etag:r.headers.get('etag')||'uploaded'};
  }
  async delete(key) {
    let r;
    if(this.isDocument(key)) {
      const q=new URLSearchParams({workspace_id:'eq.'+this.workspace,key:'eq.'+key});
      r=await this.request('/rest/v1/workspace_runtime_objects?'+q,{method:'DELETE'});
    } else {
      r=await this.request('/storage/v1/object/research-files',{method:'DELETE',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prefixes:[this.objectPath(key)]})});
    }
    if(!r.ok)throw Error('לא ניתן להסיר את הפריט');
  }
}
