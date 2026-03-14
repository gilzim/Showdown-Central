import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['draft', 'upcoming', 'active', 'completed', 'cancelled'] as const
type TournamentStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // 1. Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Verify host ownership
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('host_id, status')
      .eq('id', tournamentId)
      .single()

    if (tError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 })
    }

    if (tournament.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the host can update tournament status.' },
        { status: 403 }
      )
    }

    // 3. Parse and validate new status
    const { status } = await request.json()

    if (!status || !VALID_STATUSES.includes(status as TournamentStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` },
        { status: 400 }
      )
    }

    // 4. Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId)

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json({ error: 'Failed to update tournament status.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tournament status updated.', status }, { status: 200 })
  } catch (err) {
    console.error('Status API error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
