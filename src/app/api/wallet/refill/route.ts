import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    // 2. Call the claim_refill RPC which enforces balance = 0 server-side
    const { data, error } = await supabase.rpc('claim_refill')

    if (error) {
      if (error.message.includes('Balance must be 0')) {
        return NextResponse.json(
          { error: 'Balance must be 0 to claim a refill.' },
          { status: 400 }
        )
      }
      if (error.message.includes('cooldown')) {
        return NextResponse.json({ error: error.message }, { status: 429 })
      }
      return NextResponse.json({ error: 'Failed to process refill.' }, { status: 500 })
    }

    return NextResponse.json({ newBalance: (data as { new_balance: number }).new_balance }, { status: 200 })
  } catch (err: unknown) {
    console.error('Refill API Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
