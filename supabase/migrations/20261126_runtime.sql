-- The normalized import tables retain the verified migration snapshot.
-- Runtime documents preserve the existing application's atomic state contract.
create table public.workspace_runtime_objects (
 workspace_id uuid not null references public.research_workspaces(id),
 key text not null check(length(key) between 1 and 500),
 data jsonb not null,
 version uuid not null default gen_random_uuid(),
 updated_at timestamptz not null default now(),
 primary key(workspace_id,key)
);
alter table public.workspace_runtime_objects enable row level security;
revoke all on public.workspace_runtime_objects from anon, authenticated;
grant select,insert,update,delete on public.workspace_runtime_objects to authenticated;
grant all on public.workspace_runtime_objects to service_role;
create policy member_read on public.workspace_runtime_objects for select to authenticated using (
 workspace_id in (select workspace_id from public.workspace_members where user_id=(select auth.uid()))
);
create policy editor_write on public.workspace_runtime_objects for all to authenticated using (
 workspace_id in (select workspace_id from public.workspace_members where user_id=(select auth.uid()) and role in ('owner','editor'))
) with check (
 workspace_id in (select workspace_id from public.workspace_members where user_id=(select auth.uid()) and role in ('owner','editor'))
);
create function public.write_workspace_object(p_workspace uuid,p_key text,p_data jsonb,
 p_expected uuid default null,p_if_absent boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v uuid;
begin
 if p_expected is not null then
  update public.workspace_runtime_objects set data=p_data,version=gen_random_uuid(),updated_at=now()
  where workspace_id=p_workspace and key=p_key and version=p_expected returning version into v;
 elsif p_if_absent then
  insert into public.workspace_runtime_objects(workspace_id,key,data) values(p_workspace,p_key,p_data)
  on conflict do nothing returning version into v;
 else
  insert into public.workspace_runtime_objects(workspace_id,key,data) values(p_workspace,p_key,p_data)
  on conflict(workspace_id,key) do update set data=excluded.data,version=gen_random_uuid(),updated_at=now()
  returning version into v;
 end if;
 if v is null then return null; end if;
 return jsonb_build_object('etag',v);
end $$;
revoke all on function public.write_workspace_object(uuid,text,jsonb,uuid,boolean) from public,anon;
grant execute on function public.write_workspace_object(uuid,text,jsonb,uuid,boolean) to authenticated;

-- Only an administrator can preapprove an email; a user can claim only their
-- own confirmed email. Registration alone never grants workspace access.
create table public.workspace_access_grants (
 workspace_id uuid not null references public.research_workspaces(id),
 email text not null check(email=lower(email)),
 role text not null check(role in ('owner','editor','viewer')),
 primary key(workspace_id,email)
);
alter table public.workspace_access_grants enable row level security;
revoke all on public.workspace_access_grants from public,anon,authenticated;
grant all on public.workspace_access_grants to service_role;
create function public.claim_workspace_access() returns void
language sql security definer set search_path='' as $$
 insert into public.workspace_members(workspace_id,user_id,role)
 select g.workspace_id,u.id,g.role from public.workspace_access_grants g
 join auth.users u on lower(u.email)=g.email
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null
 on conflict(workspace_id,user_id) do nothing;
$$;
revoke all on function public.claim_workspace_access() from public,anon;
grant execute on function public.claim_workspace_access() to authenticated;
