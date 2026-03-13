import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // 1. Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Verify host ownership
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (tError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 })
    }

    if (tournament.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden. Only the host can update scores.' }, { status: 403 })
    }

    // 3. Parse body
    const { matchup_id, team_a_score, team_b_score } = await request.json()

    if (!matchup_id) {
      return NextResponse.json({ error: 'matchup_id is required.' }, { status: 400 })
    }

    // 4. Build update payload (only include defined fields)
    const updatePayload: Record<string, string> = {}
    if (team_a_score !== undefined) updatePayload.team_a_score = String(team_a_score)
    if (team_b_score !== undefined) updatePayload.team_b_score = String(team_b_score)

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No score fields provided.' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('matchups')
      .update(updatePayload)
      .eq('id', matchup_id)
      .eq('tournament_id', tournamentId)

    if (updateError) {
      console.error('Score update error:', updateError)
      return NextResponse.json({ error: 'Failed to update scores.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Scores updated.' }, { status: 200 })
  } catch (err) {
    console.error('Score API error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
