import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify User Session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bettorId, propBetId, optionId, amount, odds } = await req.json()

    // 2. Validate Input
    if (!bettorId || !propBetId || !optionId || !amount || !odds || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bet parameters' }, { status: 400 })
    }
    if (bettorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized user attempt' }, { status: 403 })
    }

    // Atomically deduct balance, insert prop bet, and record transaction via RPC.
    // The database function uses SELECT ... FOR UPDATE to prevent race conditions
    // and rolls back all changes if any step fails.
    const { data, error } = await supabase.rpc('place_prop_bet', {
      p_prop_bet_id: propBetId,
      p_option_id: optionId,
      p_amount: amount,
      p_odds: odds,
    })

    if (error) {
      if (error.message.includes('Insufficient SAPS balance')) {
        return NextResponse.json({ error: 'Insufficient SAPS balance' }, { status: 400 })
      }
      console.error('place_prop_bet RPC error:', error)
      return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newBalance: data.new_balance,
      bet: {
        id: data.bet_id,
        amount: data.amount,
        odds_at_bet: data.odds_at_bet,
        payout: data.payout,
        status: data.status,
      },
    })

  } catch (error: any) {
    console.error('Error placing prop bet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
