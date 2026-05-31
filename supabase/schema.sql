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
  palico_name  text,
  player_name  text,
  weapon_type  text not null,
  -- equipped gear ids by slot, e.g. {"weapon":"mudslide-axe","head":"barroth-helm"}
  equipped     jsonb not null default '{}'::jsonb,
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
  select id into cid from public.campaign where join_code = upper(code);
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
begin
  select id into cid from public.campaign where join_code = upper(code);
  if cid is null then
    raise exception 'Kampagne nicht gefunden';
  end if;
  select coalesce(json_agg(h.weapon_type), '[]'::json)
    into taken
    from public.hunter h
    where h.campaign_id = cid;
  return json_build_object('campaign_id', cid, 'taken_weapons', taken);
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
begin
  select id into cid from public.campaign where join_code = upper(code);
  if cid is null then
    raise exception 'Kampagne nicht gefunden';
  end if;
  if exists (
    select 1 from public.hunter h
    where h.campaign_id = cid and h.weapon_type = join_campaign_hunter.weapon_type
  ) then
    raise exception 'Waffe bereits belegt';
  end if;
  if exists (
    select 1 from public.hunter h
    where h.campaign_id = cid and h.user_id = auth.uid()
  ) then
    raise exception 'Du bist bereits in dieser Kampagne';
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
