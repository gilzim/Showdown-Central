-- ============================================================
-- Showdown Central — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  saps_balance integer not null default 500,
  role         text not null default 'player' check (role in ('player', 'host', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

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
  captain_id    uuid references profiles (id) on delete set null,
  seed          integer,
  created_at    timestamptz not null default now()
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
alter table matchups     enable row level security;
alter table bets         enable row level security;
alter table transactions enable row level security;

-- profiles: users can read all profiles; only own row is writable
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);

-- tournaments: anyone can read; only hosts can insert/update
create policy "tournaments_select_all"  on tournaments for select using (true);
create policy "tournaments_insert_host" on tournaments for insert with check (auth.uid() = host_id);
create policy "tournaments_update_host" on tournaments for update using (auth.uid() = host_id);

-- teams: anyone can read; team captain or tournament host can modify
create policy "teams_select_all"   on teams for select using (true);
create policy "teams_insert_auth"  on teams for insert with check (auth.uid() is not null);
create policy "teams_update_owner" on teams for update using (auth.uid() = captain_id);

-- matchups: anyone can read; host updates
create policy "matchups_select_all"  on matchups for select using (true);
create policy "matchups_update_host" on matchups for update
  using (
    auth.uid() = (
      select host_id from tournaments where id = tournament_id
    )
  );

-- bets: bettor owns their bets
create policy "bets_select_own"  on bets for select using (auth.uid() = bettor_id);
create policy "bets_insert_own"  on bets for insert with check (auth.uid() = bettor_id);

-- transactions: users see only their own
create policy "transactions_select_own" on transactions for select using (auth.uid() = user_id);
