-- Seed file for local development

-- 1. Create a host user in auth.users
-- Password is 'password123'
INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    recovery_sent_at, 
    last_sign_in_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'bfe0d864-9e63-4396-8862-66a0e216cdfa',
    'authenticated',
    'authenticated',
    'host@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure profile exists (in case trigger is disabled or delayed in some environments)
INSERT INTO profiles (id, username, display_name, saps_balance, role)
VALUES (
    'bfe0d864-9e63-4396-8862-66a0e216cdfa',
    'host_user',
    'Tournament Host',
    10000,
    'host'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create sample tournaments
INSERT INTO tournaments (id, name, host_id, game, status, prize_pool)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Ultimate Showdown 2024', 'bfe0d864-9e63-4396-8862-66a0e216cdfa', 'Super Smash Bros', 'active', 10000),
  ('b2222222-2222-2222-2222-222222222222', 'Spring Amateur Cup', 'bfe0d864-9e63-4396-8862-66a0e216cdfa', 'Tekken 8', 'upcoming', 5000);

-- 4. Create some teams for the first tournament
INSERT INTO teams (id, tournament_id, name, captain_id)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Team Alpha', 'bfe0d864-9e63-4396-8862-66a0e216cdfa'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Team Beta',  'bfe0d864-9e63-4396-8862-66a0e216cdfa'),
  ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Team Gamma', 'bfe0d864-9e63-4396-8862-66a0e216cdfa'),
  ('c4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'Team Delta', 'bfe0d864-9e63-4396-8862-66a0e216cdfa');

-- 5. Create initial matchups
INSERT INTO matchups (id, tournament_id, team_a_id, team_b_id, round, position, odds_a, odds_b, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 1, 1, 1.85, 2.05, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 1, 2, 1.50, 2.50, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', null, null, 2, 1, 1.00, 1.00, 'pending');
