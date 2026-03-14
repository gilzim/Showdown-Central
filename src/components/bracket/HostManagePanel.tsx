'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, CheckCircle, Swords, ChevronRight, Save, Loader2, Users, Plus, Trash2, Edit2, X, Check, Shuffle, PlayCircle, XCircle, FlagTriangleRight } from 'lucide-react'
import { PropBetsPanel } from '@/components/betting/PropBetsPanel'

interface Team {
  id: string
  name: string
}

interface Matchup {
  id: string
  round: number
  position: number
  team_a_id: string | null
  team_b_id: string | null
  team_a_score: string | null
  team_b_score: string | null
  winner_id: string | null
  status: 'pending' | 'active' | 'completed'
}

type TournamentStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'

interface HostManagePanelProps {
  tournamentId: string
  tournamentName: string
  initialTeams: Team[]
  initialMatchups: Matchup[]
  initialStatus?: TournamentStatus
}

export default function HostManagePanel({
  tournamentId,
  tournamentName,
  initialTeams,
  initialMatchups,
  initialStatus = 'draft',
}: HostManagePanelProps) {
  const [activeTab, setActiveTab] = useState<'bracket' | 'participants' | 'bets'>('bracket')
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [matchups, setMatchups] = useState<Matchup[]>(initialMatchups)
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus>(initialStatus)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Participant State
  const [newTeamName, setNewTeamName] = useState('')
  const [editingTeam, setEditingTeam] = useState<{ id: string, name: string } | null>(null)
  const [isProcessingTeam, setIsProcessingTeam] = useState(false)

  const hydrated = useRef(false)
  const supabase = createClient()

  // Initialize scores
  useEffect(() => {
    const initial: Record<string, { a: string; b: string }> = {}
    initialMatchups.forEach((m) => {
      initial[m.id] = { a: m.team_a_score ?? '', b: m.team_b_score ?? '' }
    })
    setScores(initial)
  }, [initialMatchups])

  // Realtime
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const channel = supabase
      .channel(`host-manage-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matchups', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Matchup
            setMatchups((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
            setScores((prev) => ({
              ...prev,
              [updated.id]: {
                a: updated.team_a_score ?? prev[updated.id]?.a ?? '',
                b: updated.team_b_score ?? prev[updated.id]?.b ?? '',
              },
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTeams((prev) => [...prev, payload.new as Team])
          } else if (payload.eventType === 'UPDATE') {
            setTeams((prev) => prev.map(t => t.id === payload.new.id ? payload.new as Team : t))
          } else if (payload.eventType === 'DELETE') {
            setTeams((prev) => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournamentId, supabase])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleUpdateStatus = async (newStatus: TournamentStatus) => {
    if (!confirm(`Set tournament status to "${newStatus}"?`)) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setTournamentStatus(newStatus)
      showToast(`Tournament status set to "${newStatus}".`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'An unexpected error occurred.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSaveScores = async (matchupId: string) => {
    setSaving(matchupId)
    try {
      const s = scores[matchupId]
      const res = await fetch(`/api/tournaments/${tournamentId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchup_id: matchupId,
          team_a_score: s?.a ?? '',
          team_b_score: s?.b ?? '',
        }),
      })
      if (!res.ok) throw new Error('Failed to save scores')
      showToast('Scores saved!', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(null)
    }
  }

  const handleDeclareWinner = async (matchupId: string, winnerId: string) => {
    if (!confirm('Declare this team as winner? This will advance the bracket.')) return
    setAdvancing(matchupId)
    try {
      const { error } = await supabase.rpc('advance_team', {
        p_matchup_id: matchupId,
        p_winner_id: winnerId
      })
      if (error) throw error
      showToast('Bracket advanced!', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setAdvancing(null)
    }
  }

  // Team Management
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return
    setIsProcessingTeam(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      })
      if (!res.ok) throw new Error('Failed to add team')
      setNewTeamName('')
      showToast('Team added!', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsProcessingTeam(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !editingTeam.name.trim()) return
    setIsProcessingTeam(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: editingTeam.id, name: editingTeam.name }),
      })
      if (!res.ok) throw new Error('Failed to update team')
      setEditingTeam(null)
      showToast('Team updated!', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsProcessingTeam(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Remove this team? This may break existing matchups.')) return
    setIsProcessingTeam(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId }),
      })
      if (!res.ok) throw new Error('Failed to remove team')
      showToast('Team removed.', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsProcessingTeam(false)
    }
  }

  const getTeam = (id: string | null) => teams.find(t => t.id === id) ?? null

  const rounds = Array.from(new Set(matchups.map((m) => m.round))).sort((a, b) => a - b)
  const totalRounds = rounds.length > 0 ? Math.max(...rounds) : 1

  const roundLabel = (round: number) => {
    const fromEnd = totalRounds - round
    if (fromEnd === 0) return 'Grand Final'
    if (fromEnd === 1) return 'Semi-Finals'
    if (fromEnd === 2) return 'Quarter-Finals'
    return `Round ${round}`
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border font-semibold text-sm shadow-2xl animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' : 'bg-red-900/90 border-red-500/50 text-red-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Tournament Status Management */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status:</span>
          <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg border ${
            tournamentStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
            tournamentStatus === 'completed' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
            tournamentStatus === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
            tournamentStatus === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
            'bg-slate-700/50 text-slate-400 border-slate-600'
          }`}>
            {tournamentStatus === 'active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />}
            {tournamentStatus}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tournamentStatus === 'draft' && (
            <button
              onClick={() => handleUpdateStatus('upcoming')}
              disabled={updatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
            >
              <FlagTriangleRight className="w-3.5 h-3.5" />
              Open Registration
            </button>
          )}
          {(tournamentStatus === 'draft' || tournamentStatus === 'upcoming') && (
            <button
              onClick={() => handleUpdateStatus('active')}
              disabled={updatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Tournament
            </button>
          )}
          {tournamentStatus === 'active' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={updatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Complete
            </button>
          )}
          {tournamentStatus !== 'cancelled' && tournamentStatus !== 'completed' && (
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={updatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-slate-700/50 rounded-xl self-start">
        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'bracket' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Swords className="w-4 h-4" />
          Bracket
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'participants' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Participants
        </button>
        <button
          onClick={() => setActiveTab('bets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'bets' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Custom Bets
        </button>
      </div>

      {activeTab === 'bracket' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Swords className="w-5 h-5 text-blue-400" />
              Match Management
            </h2>
          </div>

          <div className="divide-y divide-slate-700/30">
            {rounds.map(round => (
              <div key={round} className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                  <h3 className="font-bold text-slate-200 uppercase tracking-widest text-sm">{roundLabel(round)}</h3>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {matchups.filter(m => m.round === round).sort((a,b) => a.position - b.position).map(matchup => {
                    const tA = getTeam(matchup.team_a_id)
                    const tB = getTeam(matchup.team_b_id)
                    const isDone = matchup.status === 'completed'
                    const s = scores[matchup.id] ?? { a: '', b: '' }
                    
                    return (
                      <div key={matchup.id} className={`p-4 rounded-xl border transition-all ${
                        isDone ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 shadow-lg'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Team A */}
                            <div className="flex items-center justify-between">
                              <span className={`font-bold truncate ${matchup.winner_id === tA?.id ? 'text-yellow-400' : 'text-white'}`}>
                                {tA?.name || 'TBD'}
                              </span>
                              {!isDone && tA && (
                                <input
                                  type="text" value={s.a}
                                  onChange={e => setScores(p => ({ ...p, [matchup.id]: { ...p[matchup.id], a: e.target.value }}))}
                                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-sm"
                                  placeholder="0"
                                />
                              )}
                              {isDone && <span className="font-mono text-slate-400">{matchup.team_a_score || '0'}</span>}
                            </div>
                            <div className="text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">VS</div>
                            {/* Team B */}
                            <div className="flex items-center justify-between">
                              <span className={`font-bold truncate ${matchup.winner_id === tB?.id ? 'text-yellow-400' : 'text-white'}`}>
                                {tB?.name || 'TBD'}
                              </span>
                              {!isDone && tB && (
                                <input
                                  type="text" value={s.b}
                                  onChange={e => setScores(p => ({ ...p, [matchup.id]: { ...p[matchup.id], b: e.target.value }}))}
                                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-sm"
                                  placeholder="0"
                                />
                              )}
                              {isDone && <span className="font-mono text-slate-400">{matchup.team_b_score || '0'}</span>}
                            </div>
                          </div>

                          <div className="w-px h-16 bg-slate-800 mx-2" />

                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {isDone ? (
                              <div className="text-emerald-400 text-[10px] font-black uppercase text-center flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Settled
                              </div>
                            ) : (!tA || !tB) ? (
                              <div className="text-slate-600 text-[10px] italic text-center uppercase tracking-tighter">Waiting for bracket</div>
                            ) : (
                              <>
                                <button
                                  disabled={saving === matchup.id}
                                  onClick={() => handleSaveScores(matchup.id)}
                                  className="flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold transition-all"
                                >
                                  {saving === matchup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-blue-400" />}
                                  Match Flow
                                </button>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleDeclareWinner(matchup.id, tA!.id)}
                                    className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                  >
                                    A Win
                                  </button>
                                  <button
                                    onClick={() => handleDeclareWinner(matchup.id, tB!.id)}
                                    className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                  >
                                    B Win
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              Manage Participants
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Team/Player Name"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all min-w-[200px]"
              />
              <button
                onClick={handleAddTeam}
                disabled={isProcessingTeam || !newTeamName.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                {isProcessingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map(team => (
                <div key={team.id} className="group p-4 bg-slate-900/50 border border-slate-700 rounded-xl flex items-center justify-between hover:border-slate-500 transition-all">
                  {editingTeam?.id === team.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        autoFocus
                        value={editingTeam.name}
                        onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateTeam()}
                        className="flex-1 bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                      />
                      <button onClick={handleUpdateTeam} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-bold truncate">{team.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">ID: {team.id.slice(0,8)}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTeam({ id: team.id, name: team.name })}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 italic">No participants added yet.</div>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-900/30 border-t border-slate-700/50 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-300">{teams.length}</span> Participants
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle Bracket Seeds
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bets' && (
        <div className="animate-in fade-in duration-300">
          <PropBetsPanel tournamentId={tournamentId} isHost={true} />
        </div>
      )}
    </div>
  )
}
