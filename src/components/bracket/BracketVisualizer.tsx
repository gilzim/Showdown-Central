'use client'

import { useTournamentStore, MatchupNode } from '@/store/useTournamentStore'
import { Trophy } from 'lucide-react'
import { useMemo, useCallback } from 'react'

// Sub-component that only subscribes to specific matchup data
const MatchupBox = ({ mId, isHost, onMatchupClick }: { mId: string, isHost: boolean, onMatchupClick?: (m: MatchupNode) => void }) => {
   const matchup = useTournamentStore(useCallback(state => state.matchups.find(m => m.id === mId)!, [mId]))
   const team1Name = useTournamentStore(useCallback(state => state.teams.find(t => t.id === matchup.team1Id)?.name || 'TBD', [matchup.team1Id]))
   const team2Name = useTournamentStore(useCallback(state => state.teams.find(t => t.id === matchup.team2Id)?.name || 'TBD', [matchup.team2Id]))
   // we do not need to bind advanceWinner and updateScore inside useCallback in a way that causes re-renders 
   const advanceWinner = useTournamentStore(state => state.advanceWinner)
   const updateMatchupScore = useTournamentStore(state => state.updateMatchupScore)

   return (
      <div 
        className={`relative z-10 bg-slate-800 border-2 rounded-xl p-3 shadow-xl transition-all ${
          !isHost && !matchup.winnerId && matchup.team1Id && matchup.team2Id
          ? 'border-indigo-500/50 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer hover:-translate-y-1'
          : 'border-slate-700'
        }`}
        onClick={() => {
           if (!isHost && !matchup.winnerId && matchup.team1Id && matchup.team2Id && onMatchupClick) {
              onMatchupClick(matchup)
           }
        }}
      >
        {/* Team 1 */}
        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 border-b border-slate-700/50">
          <span className={`font-semibold truncate max-w-[120px] ${matchup.winnerId === matchup.team1Id ? 'text-emerald-400 font-bold' : 'text-slate-200'} ${matchup.winnerId && matchup.winnerId !== matchup.team1Id ? 'opacity-50 line-through' : ''}`}>
            {team1Name}
          </span>
          <div className="flex items-center gap-2">
            {isHost ? (
              <>
                <input 
                  type="number"
                  value={matchup.team1Score}
                  onChange={(e) => updateMatchupScore(matchup.id, 1, e.target.value)}
                  className="w-10 h-8 bg-black/30 border border-transparent focus:border-blue-500 text-center rounded-md font-bold text-white focus:bg-black/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="-"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); advanceWinner(matchup.id, matchup.team1Id!); }}
                  disabled={!matchup.team1Id || !!matchup.winnerId}
                  className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-all"
                >
                   ✓
                </button>
              </>
            ) : (
              <span className="w-10 text-center font-bold text-lg text-white">{matchup.team1Score || '-'}</span>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5">
          <span className={`font-semibold truncate max-w-[120px] ${matchup.winnerId === matchup.team2Id ? 'text-emerald-400 font-bold' : 'text-slate-200'} ${matchup.winnerId && matchup.winnerId !== matchup.team2Id ? 'opacity-50 line-through' : ''}`}>
            {team2Name}
          </span>
          <div className="flex items-center gap-2">
            {isHost ? (
              <>
                <input 
                  type="number"
                  value={matchup.team2Score}
                  onChange={(e) => updateMatchupScore(matchup.id, 2, e.target.value)}
                  className="w-10 h-8 bg-black/30 border border-transparent focus:border-blue-500 text-center rounded-md font-bold text-white focus:bg-black/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="-"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); advanceWinner(matchup.id, matchup.team2Id!); }}
                  disabled={!matchup.team2Id || !!matchup.winnerId}
                  className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-all"
                >
                   ✓
                </button>
              </>
            ) : (
              <span className="w-10 text-center font-bold text-lg text-white">{matchup.team2Score || '-'}</span>
            )}
          </div>
        </div>
      </div>
   )
}

interface BracketVisualizerProps {
  isHost?: boolean
  onMatchupClick?: (matchup: MatchupNode) => void
}

export function BracketVisualizer({ isHost = true, onMatchupClick }: BracketVisualizerProps) {
  // Only subscribe to the structure (teamsCount) to avoid re-renders on score changes
  const teamsCount = useTournamentStore(state => state.teamsCount)
  // We need matchup IDs per round, but we can memoize it or just use the raw matchups array structure without subscribing to deep changes
  const matchups = useTournamentStore(state => state.matchups)

  // Memoize rounds structure by matchup ID to prevent deep re-renders
  const rounds = useMemo(() => {
    const totalRounds = Math.log2(teamsCount)
    const grouped = []
    
    for (let r = 0; r < totalRounds; r++) {
       const roundMatchups = matchups.filter(m => m.roundIndex === r).sort((a,b) => a.matchIndex - b.matchIndex).map(m => m.id)
       grouped.push(roundMatchups)
    }
    return grouped
  }, [teamsCount, matchups.length]) // Only recompute if total number of matchups changes

  // Champion logic (needs to know about the final match winner)
  const finalMatch = useTournamentStore(useCallback(state => state.matchups.find(m => m.roundIndex === Math.log2(teamsCount) - 1), [teamsCount]))
  const championName = useTournamentStore(useCallback(state => state.teams.find(t => t.id === finalMatch?.winnerId)?.name || 'TBD', [finalMatch?.winnerId]))

  return (
    <div className="w-full mt-10 overflow-x-auto pb-10">
      <div className="flex gap-12 min-w-max transition-transform origin-top-left">
        
        {rounds.map((roundMatchups, rIndex) => (
          <div key={`round-${rIndex}`} className="flex flex-col justify-around min-h-[500px] w-64 relative gap-6">
            <h3 className="absolute -top-10 w-full text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
              {rIndex === rounds.length - 1 ? 'Finals' : rIndex === rounds.length - 2 ? 'Semifinals' : `Round ${rIndex + 1}`}
            </h3>
            
            {roundMatchups.map((mId) => (
              <div key={mId as string} className="relative">
                {/* Connector Lines */}
                {rIndex < rounds.length - 1 && (
                  <div className="absolute -right-6 top-1/2 w-6 h-[2px] bg-slate-700 -z-10" />
                )}
                {rIndex > 0 && (
                  <div className="absolute -left-6 top-1/2 w-6 h-[2px] bg-slate-700 -z-10" />
                )}
                
                <MatchupBox mId={mId as string} isHost={isHost} onMatchupClick={onMatchupClick} />
              </div>
            ))}
          </div>
        ))}

        {/* Champion Box */}
        <div className="flex flex-col justify-center min-h-[500px] w-64 pl-6 relative">
             <div className="absolute -left-6 top-1/2 w-6 h-[2px] bg-slate-700 -z-10" />
             <div className="relative text-center bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500 p-8 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 rounded-full w-12 h-12 flex items-center justify-center border border-emerald-500/50">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 uppercase tracking-widest mt-2 truncate">
                   {championName}
                </div>
                <div className="text-sm text-emerald-500/50 font-semibold mt-2">CHAMPION</div>
             </div>
        </div>

      </div>
    </div>
  )
}
