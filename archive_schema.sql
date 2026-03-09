-- ============================================================
-- Old Tournament Archival (Row Limit Optimization)
-- ============================================================

-- Table to store archived tournaments as JSON
create table if not exists archives (
  id            uuid primary key default uuid_generate_v4(),
  original_id   uuid not null, -- The original tournament ID
  data          jsonb not null, -- The entire deep object: { tournament, teams, matchups }
  archived_at   timestamptz not null default now()
);

-- RLS
alter table archives enable row level security;
create policy "archives_read_all" on archives for select using (true);
-- Only the host can manually archive, or the system
create policy "archives_insert_host" on archives for insert with check (
  auth.uid() = (data->>'host_id')::uuid
);

-- Note: In a real production system, you would schedule a pg_cron job 
-- to run this function periodically (e.g., daily) to find completed tournaments
-- older than 30 days and move them to the archives table.

-- create extension if not exists pg_cron;
-- select cron.schedule('archive_old_tournaments', '0 0 * * *', $$
--   -- SQL logic to select old tournaments, insert into archives as JSON, and delete the original rows
-- $$);
