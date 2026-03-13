'use client'

import { useState, useRef, useEffect } from 'react'
import { useTournamentStore, MatchupNode, Team } from '@/store/useTournamentStore'
import TournamentBracket from './TournamentBracket'
import { createClient } from '@/lib/supabase/client'
import BettingSlip from '../betting/BettingSlip'
import { PropBetsPanel } from '../betting/PropBetsPanel'

interface SpectatorBracketProps {
  tournamentId: string
  tournamentName: string
  isHost?: boolean
  initialData: {
    teamsCount: number
    teams: Team[]
    matchups: MatchupNode[]
  }
}

export default function SpectatorBracket({ tournamentId, tournamentName, isHost = false, initialData }: SpectatorBracketProps) {
  const { 
    teams,
    setInitialData, 
    updateMatchupScore, 
    advanceWinner, 
    updateTeam 
  } = useTournamentStore()
  
  const hydrated = useRef(false)
  const [selectedMatchup, setSelectedMatchup] = useState<MatchupNode | null>(null)

  useEffect(() => {
    // Only hydrate once on mount so we don't override realtime updates if initialData reference changes
    if (!hydrated.current) {
      setInitialData(initialData)
      hydrated.current = true
    }

    const supabase = createClient()
    
    const channel = supabase
      .channel(`bracket-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matchups',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          const m = payload.new as any
          if (m.team_a_score !== null) updateMatchupScore(m.id, 1, m.team_a_score)
          if (m.team_b_score !== null) updateMatchupScore(m.id, 2, m.team_b_score)
          if (m.winner_id) advanceWinner(m.id, m.winner_id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          const t = payload.new as any
          if (t.name) updateTeam(t.id, { name: t.name })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId, initialData, setInitialData, updateMatchupScore, advanceWinner, updateTeam])

  const getTeam = (teamId: string | null) => teams.find(t => t.id === teamId) || null

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
       <div className="flex-1 w-full overflow-hidden flex flex-col gap-8">
         {/* Intercept the visualizer clicks here by rendering it manually since TournamentBracket handles host stuff too */}
         {/* Since TournamentBracket encapsulates a lot, let's just use it and rely on its internal selectedMatchup handler */}
         {/* Wait, TournamentBracket has a BetModal built in now. Let's remove BetModal from TournamentBracket and handle it here for spectator mode. */}
         <TournamentBracket isHost={isHost} onMatchupSelect={setSelectedMatchup} />
         
         <div className="w-full border-t border-slate-700/50 pt-8 mt-4">
             <div className="flex items-center gap-3 mb-6">
                 <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest">Custom Host Bets</h2>
             </div>
             <PropBetsPanel tournamentId={tournamentId} isHost={false} />
         </div>
       </div>
       
       <div className="w-full xl:w-80 shrink-0 sticky top-8">
         {selectedMatchup ? (
            <BettingSlip 
               tournamentId={tournamentId}
               tournamentName={tournamentName}
               matchupId={selectedMatchup.id}
               teamA={{ id: selectedMatchup.team1Id!, name: getTeam(selectedMatchup.team1Id)?.name || 'TBD' }}
               teamB={{ id: selectedMatchup.team2Id!, name: getTeam(selectedMatchup.team2Id)?.name || 'TBD' }}
               onSuccess={() => setSelectedMatchup(null)}
            />
         ) : (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 border-dashed p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
               <span className="font-semibold text-sm">Select a matchup on the bracket to place a wager.</span>
            </div>
         )}
       </div>
    </div>
  )
}
