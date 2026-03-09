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
create policy "prop_bets_modify_host" on prop_bets for all using (
  auth.uid() = (select host_id from tournaments where id = tournament_id)
);

create policy "user_prop_bets_select" on user_prop_bets for select using (auth.uid() = bettor_id);
create policy "user_prop_bets_insert" on user_prop_bets for insert with check (auth.uid() = bettor_id);

-- Realtime
alter publication supabase_realtime add table prop_bets;
