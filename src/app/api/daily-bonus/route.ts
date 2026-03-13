import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAILY_BONUS_AMOUNT = 100
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('saps_balance, last_bonus_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    // Check if 24 hours have elapsed since the last bonus claim
    if (profile.last_bonus_at) {
      const lastClaimed = new Date(profile.last_bonus_at).getTime()
      const elapsed = Date.now() - lastClaimed
      if (elapsed < TWENTY_FOUR_HOURS_MS) {
        const nextAvailableMs = TWENTY_FOUR_HOURS_MS - elapsed
        return NextResponse.json(
          { error: 'Daily bonus already claimed.', nextAvailableMs },
          { status: 429 }
        )
      }
    }

    const newBalance = profile.saps_balance + DAILY_BONUS_AMOUNT

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ saps_balance: newBalance, last_bonus_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to claim bonus.' }, { status: 500 })
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'bonus',
      amount: DAILY_BONUS_AMOUNT,
      description: 'Daily login bonus',
    })

    return NextResponse.json({ message: 'Daily bonus claimed!', newBalance, amount: DAILY_BONUS_AMOUNT }, { status: 200 })
  } catch (err: unknown) {
    console.error('Daily bonus API error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
