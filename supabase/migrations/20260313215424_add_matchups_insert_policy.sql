-- Add missing INSERT policy for matchups table to allow tournament hosts to create matchups.
CREATE POLICY "matchups_insert_host" ON public.matchups FOR INSERT
WITH CHECK (
  auth.uid() = (
    SELECT host_id FROM public.tournaments WHERE id = tournament_id
  )
);
