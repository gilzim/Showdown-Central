import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const { joinCode } = await request.json()
    if (!joinCode || typeof joinCode !== 'string' || joinCode.length !== 6) {
      return NextResponse.json({ error: 'Invalid join code.' }, { status: 400 })
    }

    // 2. Look up tournament by join code
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, mode, status, max_teams')
      .eq('join_code', joinCode)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found for this code.' }, { status: 404 })
    }

    // 3. Verify tournament mode and status
    if (tournament.mode !== 'Self-Reg') {
      return NextResponse.json({ error: 'This tournament does not allow open registration.' }, { status: 403 })
    }

    if (tournament.status !== 'draft' && tournament.status !== 'upcoming') {
      return NextResponse.json({ error: 'Registration for this tournament is closed.' }, { status: 403 })
    }

    // 4. Verify availability (max_teams)
    const { count: currentTeams, error: countError } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)

    if (countError) {
      return NextResponse.json({ error: 'Failed to verify tournament capacity.' }, { status: 500 })
    }

    if (currentTeams !== null && currentTeams >= tournament.max_teams) {
      return NextResponse.json({ error: 'Tournament is full.' }, { status: 403 })
    }

    // 5. Check if user is already enrolled
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('captain_id', user.id)
      .single()

    if (existingTeam) {
      // User is already in the tournament, just redirect them
      return NextResponse.json({ message: 'Already joined', tournamentId: tournament.id }, { status: 200 })
    }

    // Fetch user profile username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const teamName = profile?.username || user.email?.split('@')[0] || 'Unknown Player'

    // 6. Insert into teams table
    const { error: insertError } = await supabase
      .from('teams')
      .insert({
        tournament_id: tournament.id,
        name: teamName,
        captain_id: user.id,
      })

    if (insertError) {
      console.error('Insert team error:', insertError)
      return NextResponse.json({ error: 'Failed to join tournament bracket.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined', tournamentId: tournament.id }, { status: 200 })

  } catch (err: any) {
    console.error('Join API Route Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
