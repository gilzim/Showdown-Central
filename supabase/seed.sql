-- Seed file for local development
-- This will be executed after migrations when you run 'supabase start'

-- Create a dummy host profile
-- Note: In a real app, users come from auth.users, but we can seed the profiles table.
-- However, since profiles has a FK to auth.users, seeding here is tricky without seeding auth.users.
-- Supabase CLI normally seeds auth.users via 'supabase db pull' or custom logic.
-- For now, we'll leave it empty or add some generic data if the user handles the auth part.

-- Example: insert categories or static data if we had any.
