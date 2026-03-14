'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Settings, Users, Key, Save } from 'lucide-react'
import { MatchupNode, Team, useTournamentStore } from '@/store/useTournamentStore'
import { PropBetsPanel } from '../betting/PropBetsPanel'
import { useUIStore } from '@/store/useUIStore'

export default function HostSettingsPanel() {
  const params = useParams()
  const tournamentId = params?.id as string | undefined

  const [mode, setMode] = useState<'Manual' | 'Self-Reg'>('Manual')
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [tournamentName, setTournamentName] = useState('My Awesome Tournament')
  const [gameName, setGameName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { showAlert } = useUIStore()

  const generateCode = () => {
    // Generate 6 alphanumeric chars
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setJoinCode(code)
    setMode('Self-Reg')
  }

  const { teamsCount, teams, matchups } = useTournamentStore()
  
  const handleSaveToCloud = async () => {
     setIsSaving(true)
     try {
       const res = await fetch('/api/tournaments', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: tournamentName,
           game: gameName.trim() || 'Any Game',
           mode,
           join_code: joinCode,
           max_teams: teamsCount,
           teams,
           matchups
         })
       })
       if (!res.ok) throw new Error('Failed to save')
       showAlert('Success', 'Tournament saved successfully!', 'Dismiss', 'success', 'Cloud')
     } catch (err) {
       console.error(err)
       showAlert('Error', 'Error saving tournament.', 'Dismiss', 'danger', 'AlertTriangle')
     } finally {
       setIsSaving(false)
     }
  }

  return (
    <div className="w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl mb-8 flex flex-col gap-6">
       <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold">Tournament Settings</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Info */}
          <div className="flex flex-col gap-4">
             <div>
                <label className="text-sm font-semibold text-slate-400 mb-1 block">Tournament Name</label>
                <input 
                  type="text" 
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg px-4 py-2 outline-none transition-all font-semibold"
                />
             </div>

             <div>
                <label className="text-sm font-semibold text-slate-400 mb-1 block">Game / Sport</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g. FIFA, Chess, Valorant"
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg px-4 py-2 outline-none transition-all"
                />
             </div>
             
             <div className="flex flex-col gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <label className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                   <Save className="w-4 h-4" /> Cloud Sync
                </label>
                <p className="text-xs text-slate-400 mb-2">Save current bracket state and roster to Supabase.</p>
                <button 
                  onClick={handleSaveToCloud}
                  disabled={isSaving}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Publish / Update Tournament'}
                </button>
             </div>
          </div>

          {/* Registration Mode */}
          <div className="flex flex-col gap-4">
             <label className="text-sm font-semibold text-slate-400 block">Registration Mode</label>
             <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setMode('Manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold text-sm transition-all ${mode === 'Manual' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Users className="w-4 h-4" /> Manual Host Entry
                </button>
                <button 
                  onClick={() => setMode('Self-Reg')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold text-sm transition-all ${mode === 'Self-Reg' ? 'bg-blue-600 text-white shadow-md border border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Key className="w-4 h-4" /> Open Join Code
                </button>
             </div>

             {mode === 'Self-Reg' ? (
                <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col items-center justify-center gap-2">
                   <p className="text-sm text-emerald-400 font-semibold mb-1">Players can join using this code:</p>
                   {joinCode ? (
                      <div className="text-3xl font-mono font-bold text-white tracking-widest bg-slate-900 px-6 py-2 rounded-lg border border-emerald-500/50">
                         {joinCode}
                      </div>
                   ) : (
                      <button onClick={generateCode} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all">
                         Generate Code
                      </button>
                   )}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-500 italic">
                   You must manually manage all team and player names in the roster below.
                </div>
             )}
          </div>
       </div>
       
       {tournamentId ? (
          <div className="mt-6 border-t border-slate-700/50 pt-8">
             <div className="flex items-center gap-3 mb-6">
                 <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest">Custom Host Bets</h2>
             </div>
             <PropBetsPanel tournamentId={tournamentId} isHost={true} />
          </div>
       ) : (
          <div className="mt-6 border-t border-slate-700/50 pt-8 text-center text-slate-500 italic text-sm">
             Save the tournament to the cloud to enable custom host bets.
          </div>
       )}
    </div>
  )
}
