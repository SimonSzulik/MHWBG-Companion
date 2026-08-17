-- =============================================================================
-- MHW Board Game Companion — Supabase schema (Postgres)
-- =============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) to set up
-- cloud sync for shared campaigns.
--
-- Model:
--   campaign            one save, owned by its creator, shareable via join code
--   campaign_member     which auth users belong to a campaign (+ role)
--   hunter              a hunter sheet within a campaign
--   campaign_state      the mutable save blob (inventory/zenny/hunts/owned gear)
--
-- The static catalog (materials, gear, recipes) stays bundled in the client —
-- it is read-only game data, not user data, so it does not live in the DB.
--
-- Security: Row Level Security is ON for every table. A user may only read or
-- write rows belonging to a campaign they are a member of. Membership is the
-- single source of truth, checked via the is_campaign_member() helper.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.campaign (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Neue Kampagne',
  box         text not null default 'Ancient Forest',
  -- short human-friendly code others type in to join, e.g. "MHW-7Q2K"
  join_code   text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    check (join_code ~ '^[A-Z0-9]{8}$'),
  day         int  not null default 1 check (day >= 1),
  max_day     int  not null default 60 check (max_day >= 1),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  leader_hunter_id uuid references public.hunter (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.campaign_member (
  campaign_id uuid not null references public.campaign (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'player' check (role in ('owner', 'player')),
  joined_at   timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table if not exists public.hunter (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaign (id) on delete cascade,
  -- optional: which auth user "plays" this hunter (null = unassigned)
  user_id      uuid references auth.users (id) on delete set null,
  name         text not null default 'Hunter',
  player_name  text,
  weapon_type  text not null,
  -- equipped gear ids by slot, e.g. {"weapon":"mudslide-axe","head":"barroth-helm"}
  equipped     jsonb not null default '{}'::jsonb,
  -- per-hunter material stash
  materials      jsonb not null default '{}'::jsonb,
  -- crafted/owned gear ids for this hunter
  owned_gear     jsonb not null default '[]'::jsonb,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- One row per campaign holding the shared mutable save. Kept as a single row
-- (1:1 with campaign) so the client can read/write the whole save atomically
-- and subscribe to it via Realtime.
create table if not exists public.campaign_state (
  campaign_id     uuid primary key references public.campaign (id) on delete cascade,
  zenny           int  not null default 0 check (zenny >= 0),
  -- materialId -> qty
  materials       jsonb not null default '{}'::jsonb,
  -- itemId -> qty
  items           jsonb not null default '{}'::jsonb,
  -- crafted/owned gear ids
  owned_gear      jsonb not null default '[]'::jsonb,
  -- huntId -> completion count (legacy: bool)
  hunts_completed jsonb not null default '{}'::jsonb,
  -- in-progress quest lobby / active / looting state
  active_quest    jsonb,
  -- day number -> { monsterId, stars, result }
  day_log         jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

create index if not exists hunter_campaign_idx on public.hunter (campaign_id);
create index if not exists member_user_idx on public.campaign_member (user_id);

-- One weapon type per campaign (no duplicate hunter weapons).
alter table public.hunter
  drop constraint if exists hunter_weapon_unique;
alter table public.hunter
  add constraint hunter_weapon_unique unique (campaign_id, weapon_type);

-- Player profile linked to auth.users (Jägername login).
create table if not exists public.player_profile (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists player_profile_username_lower_idx
  on public.player_profile (lower(username));

alter table public.player_profile enable row level security;

drop policy if exists profile_select on public.player_profile;
create policy profile_select on public.player_profile
  for select using (user_id = auth.uid());

drop policy if exists profile_insert on public.player_profile;
create policy profile_insert on public.player_profile
  for insert with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Helper: is the current user a member of a campaign?
-- SECURITY DEFINER so it bypasses RLS on campaign_member and avoids the
-- recursive policy problem (policies that query the same table they guard).
-- -----------------------------------------------------------------------------
create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.campaign_member m
    where m.campaign_id = cid
      and m.user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- updated_at touch trigger
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_campaign_touch on public.campaign;
create trigger trg_campaign_touch before update on public.campaign
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_hunter_touch on public.hunter;
create trigger trg_hunter_touch before update on public.hunter
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_state_touch on public.campaign_state;
create trigger trg_state_touch before update on public.campaign_state
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- When a campaign is created, make the creator owner + member, and seed state.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_member (campaign_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict do nothing;
  insert into public.campaign_state (campaign_id)
    values (new.id)
    on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_campaign_after_insert on public.campaign;
create trigger trg_campaign_after_insert after insert on public.campaign
  for each row execute function public.handle_new_campaign();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.campaign        enable row level security;
alter table public.campaign_member enable row level security;
alter table public.hunter          enable row level security;
alter table public.campaign_state  enable row level security;

-- campaign --------------------------------------------------------------------
-- Read: members. Also allow reading by join_code is handled via a SECURITY
-- DEFINER RPC (join_campaign) rather than a broad select policy, so codes
-- aren't enumerable.
drop policy if exists campaign_select on public.campaign;
create policy campaign_select on public.campaign
  for select using (public.is_campaign_member(id));

drop policy if exists campaign_insert on public.campaign;
create policy campaign_insert on public.campaign
  for insert with check (owner_id = auth.uid());

drop policy if exists campaign_update on public.campaign;
create policy campaign_update on public.campaign
  for update using (public.is_campaign_member(id));

drop policy if exists campaign_delete on public.campaign;
create policy campaign_delete on public.campaign
  for delete using (owner_id = auth.uid());

-- campaign_member -------------------------------------------------------------
-- A user can always see their own membership rows; members can see co-members.
drop policy if exists member_select on public.campaign_member;
create policy member_select on public.campaign_member
  for select using (
    user_id = auth.uid() or public.is_campaign_member(campaign_id)
  );

-- Joining is done through the join_campaign() RPC (SECURITY DEFINER); we still
-- allow a user to insert their own membership row for that path / owner setup.
drop policy if exists member_insert on public.campaign_member;
create policy member_insert on public.campaign_member
  for insert with check (user_id = auth.uid());

-- A user may leave (delete own row); owner may remove members.
drop policy if exists member_delete on public.campaign_member;
create policy member_delete on public.campaign_member
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.campaign c
      where c.id = campaign_id and c.owner_id = auth.uid()
    )
  );

-- hunter ----------------------------------------------------------------------
drop policy if exists hunter_all on public.hunter;
create policy hunter_all on public.hunter
  for all
  using (public.is_campaign_member(campaign_id))
  with check (public.is_campaign_member(campaign_id));

-- campaign_state --------------------------------------------------------------
drop policy if exists state_select on public.campaign_state;
create policy state_select on public.campaign_state
  for select using (public.is_campaign_member(campaign_id));

drop policy if exists state_update on public.campaign_state;
create policy state_update on public.campaign_state
  for update using (public.is_campaign_member(campaign_id))
  with check (public.is_campaign_member(campaign_id));

-- insert handled by trigger; allow members just in case
drop policy if exists state_insert on public.campaign_state;
create policy state_insert on public.campaign_state
  for insert with check (public.is_campaign_member(campaign_id));

-- -----------------------------------------------------------------------------
-- RPC: join a campaign by code. SECURITY DEFINER so the lookup bypasses the
-- members-only select policy without exposing the campaign table broadly.
-- -----------------------------------------------------------------------------
create or replace function public.join_campaign(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select id into cid from public.campaign where join_code = upper(trim(both from code));
  if cid is null then
    raise exception 'Kampagne nicht gefunden';
  end if;
  insert into public.campaign_member (campaign_id, user_id, role)
    values (cid, auth.uid(), 'player')
    on conflict do nothing;
  return cid;
end;
$$;

-- Preview taken weapons before joining (no membership required).
create or replace function public.peek_join_campaign(code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  taken json;
  normalized text;
  already_member boolean;
begin
  normalized := upper(trim(both from code));
  select id into cid from public.campaign where join_code = normalized;
  if cid is null then
    raise exception 'Kampagne nicht gefunden';
  end if;
  select exists (
    select 1 from public.campaign_member m
    where m.campaign_id = cid and m.user_id = auth.uid()
  ) into already_member;
  select coalesce(json_agg(h.weapon_type), '[]'::json)
    into taken
    from public.hunter h
    where h.campaign_id = cid;
  return json_build_object(
    'campaign_id', cid,
    'taken_weapons', taken,
    'already_member', already_member
  );
end;
$$;

-- List all campaigns for the current user (with owner membership backfill).
create or replace function public.list_my_campaigns()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if auth.uid() is null then
    raise exception 'Nicht eingeloggt';
  end if;

  insert into public.campaign_member (campaign_id, user_id, role)
  select c.id, c.owner_id, 'owner'
  from public.campaign c
  where c.owner_id = auth.uid()
    and not exists (
      select 1 from public.campaign_member m
      where m.campaign_id = c.id and m.user_id = auth.uid()
    );

  select coalesce(json_agg(row_to_json(t) order by t.updated_at desc), '[]'::json)
  into result
  from (
    select
      c.id,
      c.name,
      c.join_code,
      c.day,
      c.max_day,
      c.updated_at,
      m.role,
      h.name as hunter_name,
      h.weapon_type
    from public.campaign_member m
    join public.campaign c on c.id = m.campaign_id
    left join public.hunter h on h.campaign_id = c.id and h.user_id = auth.uid()
    where m.user_id = auth.uid()
  ) t;
  return result;
end;
$$;

-- Join campaign and create hunter in one step.
create or replace function public.join_campaign_hunter(
  code text,
  hunter_name text,
  weapon_type text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  normalized text;
begin
  normalized := upper(trim(both from code));
  select id into cid from public.campaign where join_code = normalized;
  if cid is null then
    raise exception 'Kampagne nicht gefunden';
  end if;
  if exists (
    select 1 from public.campaign_member m
    where m.campaign_id = cid and m.user_id = auth.uid()
  ) then
    raise exception 'Du bist bereits in dieser Kampagne';
  end if;
  if exists (
    select 1 from public.hunter h
    where h.campaign_id = cid and h.weapon_type = join_campaign_hunter.weapon_type
  ) then
    raise exception 'Waffe bereits belegt';
  end if;
  insert into public.campaign_member (campaign_id, user_id, role)
    values (cid, auth.uid(), 'player')
    on conflict do nothing;
  insert into public.hunter (campaign_id, user_id, name, weapon_type)
    values (cid, auth.uid(), hunter_name, weapon_type);
  return cid;
end;
$$;

grant execute on function public.join_campaign(text) to authenticated;
grant execute on function public.peek_join_campaign(text) to authenticated;
grant execute on function public.join_campaign_hunter(text, text, text) to authenticated;
grant execute on function public.list_my_campaigns() to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: broadcast row changes for live shared state.
-- Idempotent: skip if tables are already in supabase_realtime (re-run safe).
-- -----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.campaign_state;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.hunter;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.campaign;
exception when duplicate_object then null;
end $$;

-- Migration: enforce 8-char join code format on existing projects (re-run safe).
do $$ begin
  alter table public.campaign
    add constraint campaign_join_code_format check (join_code ~ '^[A-Z0-9]{8}$');
exception when duplicate_object then null;
end $$;

-- Migration v5: per-hunter inventory + active quest state (re-run safe).
alter table public.hunter
  add column if not exists materials jsonb not null default '{}'::jsonb;
alter table public.hunter
  add column if not exists owned_gear jsonb not null default '[]'::jsonb;
alter table public.campaign_state
  add column if not exists active_quest jsonb;
alter table public.campaign_state
  add column if not exists day_log jsonb not null default '{}'::jsonb;
alter table public.campaign_state
  add column if not exists active_downtime jsonb;
alter table public.campaign_state
  add column if not exists pending_handler_quest text;
alter table public.hunter
  add column if not exists element_resistance text;
alter table public.campaign_state
  add column if not exists pending_trades jsonb not null default '[]'::jsonb;

-- Migration: drop the Palico name feature (hunters use their username) (re-run safe).
alter table public.hunter
  drop column if exists palico_name;

-- ---------------------------------------------------------------------------
-- Atomic per-hunter writes to campaign_state.active_quest (re-run safe).
--
-- `active_quest` is a single jsonb blob holding every hunter's sub-state
-- (readyHunterIds, lootProgress, investigationLoot), while the sync engine is
-- last-write-wins per column. Two clients that each build the blob from their
-- own snapshot silently clobber one another — a hunter gets dropped from the
-- lobby, or loses their loot confirmation. Both are the normal case at a table:
-- everyone taps "join" at once and everyone resolves loot together.
-- See docs/qa/e2e-report.md (QA-1, QA-2).
--
-- Merge rule, per key of the per-hunter maps:
--   * the caller's own key                    -> whatever the caller sent
--   * another hunter's key already stored      -> the stored value wins
--   * another hunter's key that is new         -> accepted (initialisation)
-- `a || b` lets b win, hence: incoming, overlaid with (stored minus own key).
create or replace function public.jsonb_merge_own_key(
  p_existing jsonb,
  p_incoming jsonb,
  p_key text
) returns jsonb
language sql
immutable
as $$
  select coalesce(p_incoming, '{}'::jsonb) || (coalesce(p_existing, '{}'::jsonb) - p_key);
$$;

create or replace function public.merge_active_quest(
  p_campaign_id uuid,
  p_quest jsonb,
  p_hunter_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing jsonb;
  v_result   jsonb;
  v_ready    jsonb;
begin
  if not public.is_campaign_member(p_campaign_id) then
    raise exception 'not a campaign member';
  end if;

  select active_quest into v_existing
    from public.campaign_state
   where campaign_id = p_campaign_id
   for update;

  -- No quest, a different quest, or the client is clearing it: take the
  -- client's value wholesale. Only concurrent edits to the SAME quest merge.
  if p_quest is null
     or jsonb_typeof(p_quest) = 'null'
     or v_existing is null
     or jsonb_typeof(v_existing) = 'null'
     or (v_existing ->> 'questId') is distinct from (p_quest ->> 'questId')
  then
    update public.campaign_state
       set active_quest = p_quest
     where campaign_id = p_campaign_id;
    return p_quest;
  end if;

  v_result := p_quest;

  -- readyHunterIds: keep every other hunter's membership as stored and apply
  -- only this caller's own join/leave. A plain union would break "leave lobby".
  select coalesce(jsonb_agg(e.value), '[]'::jsonb) into v_ready
    from (
      select distinct value
        from jsonb_array_elements(coalesce(v_existing -> 'readyHunterIds', '[]'::jsonb))
       where value <> to_jsonb(p_hunter_id)
    ) e;

  if coalesce(p_quest -> 'readyHunterIds', '[]'::jsonb) @> jsonb_build_array(to_jsonb(p_hunter_id)) then
    v_ready := v_ready || jsonb_build_array(to_jsonb(p_hunter_id));
  end if;

  v_result := jsonb_set(v_result, '{readyHunterIds}', v_ready);

  v_result := jsonb_set(
    v_result, '{lootProgress}',
    public.jsonb_merge_own_key(v_existing -> 'lootProgress', p_quest -> 'lootProgress', p_hunter_id)
  );
  v_result := jsonb_set(
    v_result, '{investigationLoot}',
    public.jsonb_merge_own_key(v_existing -> 'investigationLoot', p_quest -> 'investigationLoot', p_hunter_id)
  );

  update public.campaign_state
     set active_quest = v_result
   where campaign_id = p_campaign_id;

  return v_result;
end;
$$;

revoke all on function public.merge_active_quest(uuid, jsonb, text) from public;
grant execute on function public.merge_active_quest(uuid, jsonb, text) to authenticated;
grant execute on function public.jsonb_merge_own_key(jsonb, jsonb, text) to authenticated;

-- merge_active_downtime: the same atomic merge for campaign_state.active_downtime,
-- whose six hunter-keyed maps plus confirmedHunterIds carry the same hazard.
--
-- NOT YET WIRED UP. The function exists and is applied, but the client still
-- writes active_downtime as a plain column update, because the end-to-end test
-- for it (tests/e2e/downtime-race.spec.ts) does not pass yet and an unverified
-- change to the sync path is not worth shipping. See QA-6 in docs/qa/e2e-report.md.
-- On the client there is already a partial mitigation: mergeActiveDowntime()
-- in src/domain/downtime.ts merges local over remote when a remote row arrives.
create or replace function public.merge_active_downtime(
  p_campaign_id uuid,
  p_downtime jsonb,
  p_hunter_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing  jsonb;
  v_result    jsonb;
  v_confirmed jsonb;
  v_map       text;
  v_maps      text[] := array[
    'picks', 'provisions', 'resourceRoll', 'chefElement',
    'handlerProposals', 'poogieDone'
  ];
begin
  if not public.is_campaign_member(p_campaign_id) then
    raise exception 'not a campaign member';
  end if;

  select active_downtime into v_existing
    from public.campaign_state
   where campaign_id = p_campaign_id
   for update;

  if p_downtime is null
     or jsonb_typeof(p_downtime) = 'null'
     or v_existing is null
     or jsonb_typeof(v_existing) = 'null'
  then
    update public.campaign_state
       set active_downtime = p_downtime
     where campaign_id = p_campaign_id;
    return p_downtime;
  end if;

  v_result := p_downtime;

  foreach v_map in array v_maps loop
    v_result := jsonb_set(
      v_result,
      array[v_map],
      public.jsonb_merge_own_key(v_existing -> v_map, p_downtime -> v_map, p_hunter_id)
    );
  end loop;

  select coalesce(jsonb_agg(e.value), '[]'::jsonb) into v_confirmed
    from (
      select distinct value
        from jsonb_array_elements(coalesce(v_existing -> 'confirmedHunterIds', '[]'::jsonb))
       where value <> to_jsonb(p_hunter_id)
    ) e;

  if coalesce(p_downtime -> 'confirmedHunterIds', '[]'::jsonb) @> jsonb_build_array(to_jsonb(p_hunter_id)) then
    v_confirmed := v_confirmed || jsonb_build_array(to_jsonb(p_hunter_id));
  end if;

  v_result := jsonb_set(v_result, '{confirmedHunterIds}', v_confirmed);

  update public.campaign_state
     set active_downtime = v_result
   where campaign_id = p_campaign_id;

  return v_result;
end;
$$;

revoke all on function public.merge_active_downtime(uuid, jsonb, text) from public;
grant execute on function public.merge_active_downtime(uuid, jsonb, text) to authenticated;

-- Migration: per-campaign box ownership (re-run safe).
--
-- Which physical boxes a group owns. Filters what the quest board and weapon
-- picker OFFER; it never removes gear or materials a hunter already has.
-- See src/data/expansions.ts.
--
-- The default is everything the app shipped before this column existed, so
-- pre-existing campaigns keep exactly the content they already had. Defaulting
-- to Ancient Forest alone would make a Wildspire stash or an Arsenal hunter
-- vanish from the UI.
alter table public.campaign
  add column if not exists boxes jsonb not null
  default '["core","ancient-forest","wildspire-waste","hunters-arsenal"]'::jsonb;
