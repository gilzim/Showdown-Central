import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BettingSlip from "@/components/betting/BettingSlip";
import SapsWallet from "@/components/betting/SapsWallet";

type Team = { id: string; name: string }
type Tournament = { id: string; name: string; status: string }
type ActiveMatchup = {
  id: string
  odds_a: number
  odds_b: number
  status: string
  team_a_id: string | null
  team_b_id: string | null
  tournaments: Tournament
  team_a: Team | null
  team_b: Team | null
}

export default async function BettingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch active matchups with team and tournament data
  const { data: matchups } = await supabase
    .from('matchups')
    .select(`
      id,
      odds_a,
      odds_b,
      status,
      team_a_id,
      team_b_id,
      tournaments!inner(id, name, status),
      team_a:teams!matchups_team_a_id_fkey(id, name),
      team_b:teams!matchups_team_b_id_fkey(id, name)
    `)
    .eq('status', 'active')
    .eq('tournaments.status', 'active')

  const activeMatchups = (matchups || []) as unknown as ActiveMatchup[]

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">
        Betting
      </h1>
      <p className="text-slate-500 mb-8">
        Place bets on live matchups using SAPS.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Open Matchups
          </h2>
          {activeMatchups.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl">
              <p className="text-slate-500">No live matchups right now.</p>
              <p className="text-slate-600 text-sm mt-2">Check back when a tournament is active.</p>
            </div>
          ) : (
            activeMatchups.map((matchup) => {
              const teamA = matchup.team_a
              const teamB = matchup.team_b
              if (!teamA || !teamB) return null
              return (
                <BettingSlip
                  key={matchup.id}
                  tournamentId={matchup.tournaments.id}
                  tournamentName={matchup.tournaments.name}
                  matchupId={matchup.id}
                  teamA={{ id: teamA.id, name: teamA.name }}
                  teamB={{ id: teamB.id, name: teamB.name }}
                  oddsA={matchup.odds_a}
                  oddsB={matchup.odds_b}
                />
              )
            })
          )}
        </div>
        <div>
          <SapsWallet />
        </div>
      </div>
    </div>
  );
}
