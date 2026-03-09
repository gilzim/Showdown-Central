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

    // 2. Wrap in a transaction-like flow (Since Supabase REST doesn't have true multi-statement transactions without RPC)
    // We will verify balance -> deduct balance (via RPC or safe update) -> create bet entry -> create ledger entry
    
    // Check balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('saps_balance')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to access user wallet.' }, { status: 500 })
    }

    if (profile.saps_balance < amount) {
      return NextResponse.json({ error: 'Insufficient SAPS balance.' }, { status: 400 })
    }

    // Since we don't have an RPC for atomic deduction, we will do sequential updates.
    // For a real production app with currency, an RPC is strictly required to prevent race conditions.
    
    // Deduct Balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ saps_balance: profile.saps_balance - amount })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to deduct balance.' }, { status: 500 })
    }

    // 3. Create Bet Entry
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        bettor_id: user.id,
        matchup_id,
        team_id,
        amount,
        odds_at_bet,
        status: 'pending'
      })
      .select('id')
      .single()

    if (betError) {
       // Ideally we rollback the balance here if this fails
       console.error("Bet insert failed:", betError)
       return NextResponse.json({ error: 'Failed to record bet.' }, { status: 500 })
    }

    // 4. Create Transaction Ledger Entry
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'bet_place',
        amount: -Math.abs(amount), // Negative for debit
        reference_id: bet.id,
        description: `Wager placed on Matchup`
      })

    if (txError) {
       console.error("Tx insert failed:", txError)
    }

    return NextResponse.json({ message: 'Bet placed successfully', newBalance: profile.saps_balance - amount }, { status: 200 })

  } catch (err: any) {
    console.error('Bet API Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
