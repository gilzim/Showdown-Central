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

    const body = await request.json()
    const { name, game, mode, join_code, max_teams, teams, matchups } = body

    // 2. Insert Tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        host_id: user.id,
        name: name || 'Untitled Tournament',
        game: game || 'Any Game',
        mode: mode || 'Manual',
        join_code: mode === 'Self-Reg' ? join_code : null,
        max_teams: max_teams || 8,
        status: 'draft',
      })
      .select('id')
      .single()

    if (tournamentError || !tournament) {
      console.error('Error creating tournament:', tournamentError)
      return NextResponse.json({ error: 'Failed to create tournament.' }, { status: 500 })
    }

    // 3. Insert Teams and build ID mapping
    const teamMapping: Record<string, string> = {} // frontend_id -> db_uuid

    if (teams && Array.isArray(teams)) {
      const teamsToInsert = teams.map((t: any) => ({
        tournament_id: tournament.id,
        name: t.name || 'TBD',
      }))

      const { data: insertedTeams, error: teamsError } = await supabase
        .from('teams')
        .insert(teamsToInsert)
        .select('id, name')

      if (teamsError || !insertedTeams) {
        console.error('Error creating teams:', teamsError)
        return NextResponse.json({ error: 'Failed to create teams.' }, { status: 500 })
      }

      // We have to match them back based on order, assuming Supabase returns them in the same order we inserted, or match by name
      // To be safe against identical names, we can insert them one by one, OR we can just rely on the order returned if we use `.select()`
      // A better way is inserting with a known temporary ID, but our schema doesn't have a temporary ID column.
      // We'll rely on index mapping assuming order is preserved for bulk insert.
      for (let i = 0; i < teams.length; i++) {
         teamMapping[teams[i].id] = insertedTeams[i].id
      }
    }

    // 4. Insert Matchups
    if (matchups && Array.isArray(matchups)) {
      const matchupsToInsert = matchups.map((m: any) => {
        return {
          tournament_id: tournament.id,
          round: m.roundIndex + 1, // DB 1-indexed for rounds
          position: m.matchIndex + 1, // DB 1-indexed for positions
          team_a_id: m.team1Id ? teamMapping[m.team1Id] : null,
          team_b_id: m.team2Id ? teamMapping[m.team2Id] : null,
          team_a_score: m.team1Score || '',
          team_b_score: m.team2Score || '',
          winner_id: m.winnerId ? teamMapping[m.winnerId] : null,
          status: 'pending'
        }
      })

      const { error: matchupsError } = await supabase
        .from('matchups')
        .insert(matchupsToInsert)

      if (matchupsError) {
        console.error('Error creating matchups:', matchupsError)
        return NextResponse.json({ error: 'Failed to create matchups.' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Tournament created successfully', tournamentId: tournament.id }, { status: 200 })

  } catch (err: any) {
    console.error('Tournament Creation API Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
