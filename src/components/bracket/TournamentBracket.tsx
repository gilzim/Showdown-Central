'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTournamentStore, MatchupNode } from '@/store/useTournamentStore'
import { ZoomIn, ZoomOut, Maximize, Shuffle, Trash2, RotateCcw } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'

import { BracketVisualizer } from './BracketVisualizer'
import BetModal from '../betting/BetModal'

interface TournamentBracketProps {
  isHost?: boolean;
  onMatchupSelect?: (matchup: MatchupNode) => void;
}

export default function TournamentBracket({ isHost = true, onMatchupSelect }: TournamentBracketProps) {
  const params = useParams()
  const tournamentId = params?.id as string | undefined

  const { 
    teamsCount, 
    teams, 
    matchups, 
    setTeamsCount, 
    updateTeam, 
    updateMatchupScore, 
    advanceWinner,
    randomizeTeams,
    resetBracket
  } = useTournamentStore()

  const { showConfirm } = useUIStore()

  const [zoom, setZoom] = useState(1)
  
  // Betting Modal State (Host Only - or if no onMatchupSelect provided)
  const [selectedMatchup, setSelectedMatchup] = useState<any>(null)
  const [isBetModalOpen, setIsBetModalOpen] = useState(false)

  useEffect(() => {
    // Initial load only if we don't have teams and we are the host INITIALIZING A NEW tournament
    // If there is no tournamentId in the URL, it's a new draft being created
    if (isHost && !tournamentId && teams.length === 0) {
      setTeamsCount(8)
    }
  }, [teams.length, setTeamsCount, isHost, tournamentId])

  const handleZoom = (amount: number) => {
    if (amount === 0) setZoom(1)
    else setZoom(Math.max(0.4, Math.min(2.0, zoom + amount)))
  }

  const handleMatchupClick = (matchup: any) => {
     if (onMatchupSelect) {
       onMatchupSelect(matchup)
     } else {
       setSelectedMatchup(matchup)
       setIsBetModalOpen(true)
     }
  }

  const getTeam = (teamId: string | null) => teams.find(t => t.id === teamId) || null

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Settings Bar */}
      {isHost && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg w-fit">
          <div className="flex items-center gap-2">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Teams:</label>
             <select 
               className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
               value={teamsCount}
               onChange={async (e) => {
                 const confirmed = await showConfirm(
                   'Reset Tournament',
                   `Changing team count to ${e.target.value} will reset the tournament. Are you sure?`,
                   'Reset Bracket',
                   'Keep Current',
                   'danger',
                   'RotateCcw'
                 )
                 if(confirmed) {
                    setTeamsCount(Number(e.target.value))
                 }
               }}
             >
               {[2, 4, 8, 16, 32].map(num => (
                 <option key={num} value={num}>{num} Teams</option>
               ))}
             </select>
          </div>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          <button onClick={randomizeTeams} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-semibold transition-all">
            <Shuffle className="w-4 h-4" /> Randomize
          </button>
          <button onClick={resetBracket} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm font-semibold transition-all">
            <RotateCcw className="w-4 h-4" /> Reset Bracket
          </button>
          <button onClick={async () => {
             const confirmed = await showConfirm(
               "New Tournament", 
               "Start new tournament? This will clear all existing data.",
               "New Tournament",
               "Cancel",
               "danger",
               "Trophy"
             )
             if(confirmed) setTeamsCount(8)
          }} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-semibold transition-all">
            <Trash2 className="w-4 h-4" /> New
          </button>
        </div>
      )}

      {/* Roster Section */}
      {isHost && (
        <div className="w-full overflow-x-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
            <span className="w-1 h-6 bg-blue-500 rounded-full" />
            Tournament Roster
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                <th className="pb-3 font-semibold w-16 px-4">Seed</th>
                <th className="pb-3 font-semibold px-4 w-[25%] text-white">Team Name</th>
                <th className="pb-3 font-semibold px-4 text-white">Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors group">
                  <td className="py-2 px-4 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-4">
                    <span className="font-bold text-white">{team.name}</span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap gap-2">
                      {team.members && team.members.length > 0 ? (
                        team.members.map(member => (
                          <span 
                            key={member.id} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs font-semibold text-slate-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {member.display_name || member.username}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs italic text-slate-600">No members</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold flex items-center gap-3">
             <span className="w-1 h-6 bg-emerald-500 rounded-full" />
             Tournament Bracket
           </h2>
           <div className="flex items-center gap-2">
             <span className="text-sm font-semibold text-slate-400 mr-2">Zoom:</span>
             <button onClick={() => handleZoom(-0.1)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md"><ZoomOut className="w-4 h-4" /></button>
             <button onClick={() => handleZoom(0.1)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md"><ZoomIn className="w-4 h-4" /></button>
             <button onClick={() => handleZoom(0)} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md font-semibold">Reset</button>
           </div>
        </div>
        
        <div 
           className="overflow-x-auto overflow-y-hidden w-full lg:w-auto"
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
             <BracketVisualizer isHost={isHost} onMatchupClick={handleMatchupClick} />
          </div>
        </div>
      </div>

      {!onMatchupSelect && (
        <BetModal 
          isOpen={isBetModalOpen} 
          onClose={() => setIsBetModalOpen(false)} 
          tournamentId={tournamentId || null}
          matchup={selectedMatchup}
          teamA={getTeam(selectedMatchup?.team1Id || null)}
          teamB={getTeam(selectedMatchup?.team2Id || null)}
        />
      )}
    </div>
  )
}
