import SpectatorBracket from '@/components/bracket/SpectatorBracket'
import SapsWallet from '@/components/betting/SapsWallet'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function SpectatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params
  const supabase = await createClient()

  // 0. Get the current user (if any)
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch tournament
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single()

  if (tError || !tournament) {
    notFound()
  }

  // 2. Fetch Teams with Members
  const { data: teamsData } = await supabase
    .from('teams')
    .select(`
      id, 
      name,
      team_members (
        profiles (
          id,
          username,
          display_name
        )
      )
    `)
    .eq('tournament_id', tournamentId)

  // 3. Fetch Matchups (order to preserve correct bracket rendering)
  const { data: matchupsData } = await supabase
    .from('matchups')
    .select('id, round, position, team_a_id, team_b_id, team_a_score, team_b_score, winner_id')
    .eq('tournament_id', tournamentId)

  const mappedTeams = (teamsData || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    members: t.team_members?.map((m: any) => ({
      id: m.profiles.id,
      username: m.profiles.username,
      display_name: m.profiles.display_name
    })) || []
  }))

  const mappedMatchups = (matchupsData || []).map(m => ({
    id: String(m.id),
    roundIndex: m.round - 1,
    matchIndex: m.position - 1,
    team1Id: m.team_a_id,
    team2Id: m.team_b_id,
    team1Score: m.team_a_score || '',
    team2Score: m.team_b_score || '',
    winnerId: m.winner_id
  }))

  const initialData = {
    teamsCount: tournament.max_teams,
    teams: mappedTeams,
    matchups: mappedMatchups
  }

  const isHost = !!user && user.id === tournament.host_id

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
             <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
               {tournament.status === 'active' && (
                 <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded-md border border-red-500/30 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live
                 </span>
               )}
               <h1 className="text-3xl font-extrabold text-white">{tournament.name}</h1>
            </div>
            <p className="text-slate-400 mt-1">Spectating Match. Select a matchup to put SAPS on the line.</p>
          </div>
        </div>
        
        <div className="w-full md:w-64">
           <SapsWallet />
        </div>
      </div>
      
      <SpectatorBracket 
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        isHost={isHost}
        initialData={initialData} 
      />
    </div>
  )
}
