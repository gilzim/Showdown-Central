'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTournamentStore, MatchupNode } from '@/store/useTournamentStore'
import { ZoomIn, ZoomOut, Maximize, Shuffle, Trash2, RotateCcw } from 'lucide-react'

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
               onChange={(e) => {
                 if(confirm(`Changing team count to ${e.target.value} will reset the tournament. Are you sure?`)) {
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
          <button onClick={() => {
             if(confirm("Start new tournament?")) setTeamsCount(8)
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
                <th className="pb-3 font-semibold px-4 w-[30%]">Team Name</th>
                <th className="pb-3 font-semibold px-4">Player 1</th>
                <th className="pb-3 font-semibold px-4">Player 2</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors group">
                  <td className="py-2 px-4 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-4">
                    <input 
                      value={team.name}
                      onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                      className="bg-transparent border border-transparent focus:border-slate-600 focus:bg-slate-900/50 rounded-md px-2 py-1 w-full outline-none transition-all font-semibold"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      value={team.p1}
                      placeholder="P1 Name"
                      onChange={(e) => updateTeam(team.id, { p1: e.target.value })}
                      className="bg-transparent border border-transparent focus:border-slate-600 focus:bg-slate-900/50 rounded-md px-2 py-1 w-full outline-none transition-all text-slate-300 placeholder:text-slate-600"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      value={team.p2}
                      placeholder="P2 Name"
                      onChange={(e) => updateTeam(team.id, { p2: e.target.value })}
                      className="bg-transparent border border-transparent focus:border-slate-600 focus:bg-slate-900/50 rounded-md px-2 py-1 w-full outline-none transition-all text-slate-300 placeholder:text-slate-600"
                    />
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
