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

    // 3. Fetch User Balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('saps_balance')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.saps_balance < amount) {
      return NextResponse.json({ error: 'Insufficient SAPS balance' }, { status: 400 })
    }

    // 4. Determine Payout
    const potentialPayout = Math.floor(amount * odds)

    // 5. Deduct Balance (Optimistic server-side, real systems use RPC for atomic ops)
    const newBalance = profile.saps_balance - amount
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ saps_balance: newBalance })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to deduct balance' }, { status: 500 })
    }

    // 6. Record the Bet
    const { data: bet, error: betError } = await supabase
      .from('user_prop_bets')
      .insert({
        bettor_id: bettorId,
        prop_bet_id: propBetId,
        option_id: optionId,
        amount: amount,
        odds_at_bet: odds,
        payout: potentialPayout,
        status: 'pending'
      })
      .select()
      .single()

    if (betError) {
       // Rollback balance (Again, need RPC for full safety)
       await supabase.from('profiles').update({ saps_balance: profile.saps_balance }).eq('id', user.id)
       return NextResponse.json({ error: 'Failed to record bet' }, { status: 500 })
    }

    // 7. Record Transaction Ledger
    await supabase.from('transactions').insert({
       user_id: user.id,
       type: 'bet_place',
       amount: -amount,
       reference_id: bet.id,
       description: `Placed prop bet`
    })

    return NextResponse.json({ success: true, newBalance, bet })

  } catch (error: any) {
    console.error('Error placing prop bet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
