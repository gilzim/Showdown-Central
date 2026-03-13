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
    const { matchup_id, team_id, amount, odds_at_bet } = body

    if (!matchup_id || !team_id || !amount || amount <= 0 || !odds_at_bet) {
      return NextResponse.json({ error: 'Invalid bet parameters.' }, { status: 400 })
    }

    // Atomically deduct balance, insert bet, and record transaction via RPC.
    // The database function uses SELECT ... FOR UPDATE to prevent race conditions
    // and rolls back all changes if any step fails.
    const { data, error } = await supabase.rpc('place_bet', {
      p_matchup_id: matchup_id,
      p_team_id: team_id,
      p_amount: amount,
      p_odds: odds_at_bet,
    })

    if (error) {
      if (error.message.includes('Insufficient SAPS balance')) {
        return NextResponse.json({ error: 'Insufficient SAPS balance.' }, { status: 400 })
      }
      console.error('place_bet RPC error:', error)
      return NextResponse.json({ error: 'Failed to place bet.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Bet placed successfully', newBalance: data.new_balance }, { status: 200 })

  } catch (err: any) {
    console.error('Bet API Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
