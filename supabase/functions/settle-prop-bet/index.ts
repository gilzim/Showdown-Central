// Follow this setup guide to integrate the Deno-based Edge Function in your Supabase project.
// 
// 1. Initialize Supabase CLI (if you haven't already):
//    npx supabase init
//
// 2. Create the Edge Function:
//    npx supabase functions new settle-prop-bet
//
// 3. Paste this code into supabase/functions/settle-prop-bet/index.ts
//
// 4. Deploy it:
//    npx supabase functions deploy settle-prop-bet

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need admin rights to process payouts
    )

    const { propBetId, winningOptionId } = await req.json()

    // 1. Validate Input
    if (!propBetId || !winningOptionId) {
      throw new Error('propBetId and winningOptionId are required')
    }

    // 2. Mark the prop bet as settled
    const { error: updatePropBetError } = await supabaseClient
      .from('prop_bets')
      .update({ status: 'settled', winning_option_id: winningOptionId })
      .eq('id', propBetId)

    if (updatePropBetError) throw updatePropBetError

    // 3. Fetch all active wagers for this prop bet
    const { data: wagers, error: wagersError } = await supabaseClient
      .from('user_prop_bets')
      .select('id, bettor_id, option_id, payout, amount')
      .eq('prop_bet_id', propBetId)
      .eq('status', 'pending')

    if (wagersError) throw wagersError
    if (!wagers || wagers.length === 0) {
       return new Response(JSON.stringify({ message: "No wagers to settle." }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       })
    }

    // 4. Process Payouts
    const winningWagers = wagers.filter(w => w.option_id === winningOptionId)
    const losingWagers = wagers.filter(w => w.option_id !== winningOptionId)

    // Mark losing wagers
    if (losingWagers.length > 0) {
      const losingIds = losingWagers.map(w => w.id)
      await supabaseClient
        .from('user_prop_bets')
        .update({ status: 'lost', settled_at: new Date().toISOString() })
        .in('id', losingIds)
    }

    // Mark winning wagers and update balances
    if (winningWagers.length > 0) {
      const winningIds = winningWagers.map(w => w.id)
      await supabaseClient
        .from('user_prop_bets')
        .update({ status: 'won', settled_at: new Date().toISOString() })
        .in('id', winningIds)

      // Ideally this is a stored procedure (RPC) to prevent race conditions when updating balances.
      // For this prototype, we iterate:
      for (const wager of winningWagers) {
         // Get current balance
         const { data: profile } = await supabaseClient
           .from('profiles')
           .select('saps_balance')
           .eq('id', wager.bettor_id)
           .single()

         if (profile) {
            const newBalance = profile.saps_balance + wager.payout
            
            // Update balance
            await supabaseClient
               .from('profiles')
               .update({ saps_balance: newBalance })
               .eq('id', wager.bettor_id)

            // Log Transaction
            await supabaseClient
               .from('transactions')
               .insert({
                  user_id: wager.bettor_id,
                  type: 'bet_win',
                  amount: wager.payout,
                  reference_id: wager.id,
                  description: 'Prop bet won'
               })
         }
      }
    }

    return new Response(JSON.stringify({ 
       success: true, 
       message: `Settled ${wagers.length} bets. ${winningWagers.length} winners, ${losingWagers.length} losers.` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
