-- ============================================================
-- Showdown Central — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text not null unique,
  display_name   text,
  avatar_url     text,
  saps_balance   integer not null default 500,
  role           text not null default 'player' check (role in ('player', 'host', 'admin')),
  last_refill_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Migration: add last_refill_at column if it does not already exist
alter table profiles add column if not exists last_refill_at timestamptz;

-- Auto-create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  candidate     text;
  counter       integer := 0;
begin
  base_username := split_part(new.email, '@', 1);
  candidate := base_username;
  -- Resolve collisions by appending an incrementing suffix
  loop
    exit when not exists (select 1 from profiles where username = candidate);
    counter := counter + 1;
    candidate := base_username || counter::text;
  end loop;
  insert into profiles (id, username)
  values (new.id, candidate);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- tournaments
-- ============================================================
create table if not exists tournaments (
  id          uuid primary key default uuid_generate_v4(),
  host_id     uuid not null references profiles (id) on delete cascade,
  name        text not null,
  game        text not null,
  mode        text not null default 'Manual' check (mode in ('Manual', 'Self-Reg')),
  status      text not null default 'draft' check (status in ('draft', 'upcoming', 'active', 'completed', 'cancelled')),
  join_code   text unique,          -- used in Self-Reg mode
  max_teams   integer not null default 8,
  prize_pool  integer not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- teams
-- ============================================================
create table if not exists teams (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  name          text not null,
  seed          integer,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- team_members
-- ============================================================
create table if not exists team_members (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references teams (id) on delete cascade,
  user_id       uuid not null references profiles (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  unique(team_id, user_id)
);

-- ============================================================
-- matchups
-- ============================================================
create table if not exists matchups (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  round         integer not null,
  position      integer not null,
  team_a_id     uuid references teams (id) on delete set null,
  team_b_id     uuid references teams (id) on delete set null,
  team_a_score  text,
  team_b_score  text,
  winner_id     uuid references teams (id) on delete set null,
  odds_a        numeric(6, 2) not null default 1.0,
  odds_b        numeric(6, 2) not null default 1.0,
  status        text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- bets
-- ============================================================
create table if not exists bets (
  id            uuid primary key default uuid_generate_v4(),
  bettor_id     uuid not null references profiles (id) on delete cascade,
  matchup_id    uuid not null references matchups (id) on delete cascade,
  team_id       uuid not null references teams (id) on delete cascade,
  amount        integer not null check (amount > 0),
  odds_at_bet   numeric(6, 2) not null,
  payout        integer,
  status        text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  placed_at     timestamptz not null default now(),
  settled_at    timestamptz
);

-- ============================================================
-- transactions
-- ============================================================
create table if not exists transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles (id) on delete cascade,
  type          text not null check (type in ('bet_place', 'bet_win', 'bet_loss', 'deposit', 'withdrawal', 'bonus')),
  amount        integer not null,   -- positive = credit, negative = debit
  reference_id  uuid,               -- optional: points to a bet or tournament
  description   text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table profiles     enable row level security;
alter table tournaments  enable row level security;
alter table teams        enable row level security;
alter table team_members enable row level security;
alter table matchups     enable row level security;
alter table bets         enable row level security;
alter table transactions enable row level security;

-- profiles: users can read all profiles; only own row is writable
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using ((select auth.uid()) = id);

-- tournaments: anyone can read; only hosts can insert/update
create policy "tournaments_select_all"  on tournaments for select using (true);
create policy "tournaments_insert_host" on tournaments for insert with check ((select auth.uid()) = host_id);
create policy "tournaments_update_host" on tournaments for update using ((select auth.uid()) = host_id);

-- teams: anyone can read; tournament host can modify
create policy "teams_select_all"   on teams for select using (true);
create policy "teams_insert_auth"  on teams for insert with check ((select auth.uid()) is not null);
create policy "teams_modify_host"  on teams for all using (
  (select auth.uid()) = (select host_id from tournaments where id = tournament_id)
);

-- team_members: anyone can read; members or host can modify
create policy "team_members_select_all" on team_members for select using (true);
create policy "team_members_insert_auth" on team_members for insert with check ((select auth.uid()) is not null);
create policy "team_members_delete_member" on team_members for delete using (
  (select auth.uid()) = user_id or 
  (select auth.uid()) = (
    select host_id from tournaments t join teams tm on t.id = tm.tournament_id where tm.id = team_id
  )
);

-- matchups: anyone can read; host updates
create policy "matchups_select_all"  on matchups for select using (true);
create policy "matchups_update_host" on matchups for update
  using (
    (select auth.uid()) = (
      select host_id from tournaments where id = tournament_id
    )
  );
create policy "matchups_insert_host" on matchups for insert
  with check (
    (select auth.uid()) = (
      select host_id from tournaments where id = tournament_id
    )
  );

-- bets: bettor owns their bets
create policy "bets_select_own"  on bets for select using ((select auth.uid()) = bettor_id);
create policy "bets_insert_own"  on bets for insert with check ((select auth.uid()) = bettor_id);

-- transactions: users see only their own
create policy "transactions_select_own" on transactions for select using ((select auth.uid()) = user_id);

-- ============================================================
-- Custom Host Bets (Prop Bets)
-- ============================================================
create table if not exists prop_bets (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  question      text not null,
  options       jsonb not null, -- e.g. [{"id": "opt1", "text": "Yes", "odds": 2.0}, {"id": "opt2", "text": "No", "odds": 1.5}]
  status        text not null default 'open' check (status in ('open', 'closed', 'settled')),
  winning_option_id text,
  created_at    timestamptz not null default now()
);

create table if not exists user_prop_bets (
  id            uuid primary key default uuid_generate_v4(),
  bettor_id     uuid not null references profiles (id) on delete cascade,
  prop_bet_id   uuid not null references prop_bets (id) on delete cascade,
  option_id     text not null,
  amount        integer not null check(amount > 0),
  odds_at_bet   numeric(6,2) not null,
  payout        integer,
  status        text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  placed_at     timestamptz not null default now(),
  settled_at    timestamptz
);

-- RLS
alter table prop_bets enable row level security;
alter table user_prop_bets enable row level security;

create policy "prop_bets_select_all" on prop_bets for select using (true);
create policy "prop_bets_insert_host" on prop_bets for insert with check (
  (select auth.uid()) = (select host_id from tournaments where id = tournament_id)
);
create policy "prop_bets_update_host" on prop_bets for update using (
  (select auth.uid()) = (select host_id from tournaments where id = tournament_id)
);
create policy "prop_bets_delete_host" on prop_bets for delete using (
  (select auth.uid()) = (select host_id from tournaments where id = tournament_id)
);

create policy "user_prop_bets_select" on user_prop_bets for select using ((select auth.uid()) = bettor_id);
create policy "user_prop_bets_insert" on user_prop_bets for insert with check ((select auth.uid()) = bettor_id);

-- Realtime
alter publication supabase_realtime add table prop_bets;
alter publication supabase_realtime add table matchups;

-- ============================================================
-- place_bet RPC
-- Atomically deducts SAPS balance, inserts a bet record, and
-- records a transaction ledger entry. Rolls back on any failure.
-- Must be called by the authenticated bettor.
-- ============================================================
create or replace function public.place_bet(
  p_matchup_id uuid,
  p_team_id    uuid,
  p_amount     int,
  p_odds       numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid;
  v_balance     integer;
  v_new_balance integer;
  v_bet_id      uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  -- Lock the profile row to prevent concurrent double-spend
  select saps_balance into v_balance
    from profiles
   where id = v_user_id
     for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient SAPS balance';
  end if;

  v_new_balance := v_balance - p_amount;

  -- Deduct balance
  update profiles
     set saps_balance = v_new_balance,
         updated_at   = now()
   where id = v_user_id;

  -- Insert bet record
  insert into bets (bettor_id, matchup_id, team_id, amount, odds_at_bet, status)
  values (v_user_id, p_matchup_id, p_team_id, p_amount, p_odds, 'pending')
  returning id into v_bet_id;

  -- Insert transaction ledger entry
  insert into transactions (user_id, type, amount, reference_id, description)
  values (v_user_id, 'bet_place', -p_amount, v_bet_id, 'Wager placed on Matchup');

  return json_build_object('bet_id', v_bet_id, 'new_balance', v_new_balance);
end;
$$;

-- ============================================================
-- place_prop_bet RPC
-- Atomically deducts SAPS balance, inserts a user_prop_bets
-- record, and records a transaction ledger entry.
-- Must be called by the authenticated bettor.
-- ============================================================
create or replace function public.place_prop_bet(
  p_prop_bet_id uuid,
  p_option_id   text,
  p_amount      int,
  p_odds        numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid;
  v_balance     integer;
  v_new_balance integer;
  v_payout      integer;
  v_bet_id      uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  -- Lock the profile row to prevent concurrent double-spend
  select saps_balance into v_balance
    from profiles
   where id = v_user_id
     for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient SAPS balance';
  end if;

  v_new_balance := v_balance - p_amount;
  v_payout      := floor(p_amount * p_odds);

  -- Deduct balance
  update profiles
     set saps_balance = v_new_balance,
         updated_at   = now()
   where id = v_user_id;

  -- Insert prop bet record
  insert into user_prop_bets (bettor_id, prop_bet_id, option_id, amount, odds_at_bet, payout, status)
  values (v_user_id, p_prop_bet_id, p_option_id, p_amount, p_odds, v_payout, 'pending')
  returning id into v_bet_id;

  -- Insert transaction ledger entry
  insert into transactions (user_id, type, amount, reference_id, description)
  values (v_user_id, 'bet_place', -p_amount, v_bet_id, 'Placed prop bet');

  return json_build_object(
    'bet_id',      v_bet_id,
    'new_balance', v_new_balance,
    'payout',      v_payout,
    'amount',      p_amount,
    'odds_at_bet', p_odds,
    'status',      'pending'
  );
end;
$$;

-- ============================================================
-- claim_refill RPC
-- Awards a 500-SAPS bankruptcy-protection refill to the
-- authenticated user when their balance is exactly 0.
--
-- Cooldown: the infrastructure is in place (last_refill_at is
-- recorded on every call). To enforce a 24-hour cooldown in the
-- future, change v_cooldown_hours from 0 to 24.
-- ============================================================
create or replace function public.claim_refill()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id          uuid;
  v_balance          integer;
  v_last_refill      timestamptz;
  -- Set to 0 to disable cooldown; change to 24 to enforce a 24-hour cooldown
  v_cooldown_hours   constant integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock profile row
  select saps_balance, last_refill_at
    into v_balance, v_last_refill
    from profiles
   where id = v_user_id
     for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  -- Balance must be 0 to claim a refill
  if v_balance <> 0 then
    raise exception 'Balance must be 0 to claim a refill';
  end if;

  -- Cooldown check
  if v_cooldown_hours > 0 and v_last_refill is not null then
    if now() - v_last_refill < (v_cooldown_hours || ' hours')::interval then
      raise exception 'Refill cooldown active. Please wait before claiming again.';
    end if;
  end if;

  -- Apply refill
  update profiles
     set saps_balance   = 500,
         last_refill_at = now(),
         updated_at     = now()
   where id = v_user_id;

  -- Log bonus
  insert into transactions (user_id, type, amount, description)
  values (v_user_id, 'bonus', 500, 'Bankruptcy protection refill');

  return jsonb_build_object('new_balance', 500);
end;
$$;

-- ============================================================
-- advance_team RPC
-- Marks a matchup as completed with the given winner and
-- populates the winner into the correct slot of the next
-- round's matchup. Must be called by the tournament host.
-- ============================================================
create or replace function public.advance_team(
  p_matchup_id uuid,
  p_winner_id  uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_round         integer;
  v_position      integer;
  v_host_id       uuid;
  v_next_round    integer;
  v_next_position integer;
  v_next_id       uuid;
begin
  -- Fetch the current matchup details
  select tournament_id, round, position
    into v_tournament_id, v_round, v_position
    from matchups
   where id = p_matchup_id;

  if not found then
    raise exception 'Matchup % not found', p_matchup_id;
  end if;

  -- Verify the caller is the tournament host
  select host_id
    into v_host_id
    from tournaments
   where id = v_tournament_id;

  if v_host_id is distinct from auth.uid() then
    raise exception 'Only the tournament host can advance teams';
  end if;

  -- Mark current matchup completed
  update matchups
     set winner_id    = p_winner_id,
         status       = 'completed',
         completed_at = now(),
         updated_at   = now()
   where id = p_matchup_id;

  -- Determine next round slot
  v_next_round    := v_round + 1;
  v_next_position := ceil(v_position::numeric / 2)::integer;

  select id
    into v_next_id
    from matchups
   where tournament_id = v_tournament_id
     and round         = v_next_round
     and position      = v_next_position;

  if found then
    -- Odd position fills team_a slot; even position fills team_b slot
    if v_position % 2 = 1 then
      update matchups
         set team_a_id  = p_winner_id,
             updated_at = now()
       where id = v_next_id;
    else
      update matchups
         set team_b_id  = p_winner_id,
             updated_at = now()
       where id = v_next_id;
    end if;
  end if;
end;
$$;
