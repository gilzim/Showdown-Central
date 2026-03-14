import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, User, Coins, Calendar, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch tournaments hosted by the user
  const { data: hostedTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, ends_at, created_at')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch tournaments where the user participated as a team captain
  const { data: captainTeams } = await supabase
    .from('teams')
    .select('id, name, tournament_id, tournaments(id, name, status, ends_at, created_at)')
    .eq('captain_id', user.id)
    .order('created_at', { ascending: false })

  const hostedEntries = (hostedTournaments ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status as string,
    endsAt: t.ends_at as string | null,
    role: 'Host' as const,
    href: `/tournaments/${t.id}/manage`,
  }))

  // Build participant entries, excluding tournaments already listed as hosted
  const hostedIds = new Set(hostedEntries.map((e) => e.id))
  const participantEntries = (captainTeams ?? []).flatMap((team) => {
    const t = Array.isArray(team.tournaments) ? team.tournaments[0] : team.tournaments
    if (!t || hostedIds.has(t.id)) return []
    return [{
      id: t.id,
      name: t.name,
      status: t.status as string,
      endsAt: (t.ends_at ?? null) as string | null,
      role: `Captain (${team.name})` as string,
      href: `/tournaments/${t.id}`,
    }]
  })

  const tournamentHistory = [...hostedEntries, ...participantEntries]

  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    upcoming: 'Upcoming',
    active: 'Live',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-300',
    upcoming: 'bg-blue-500/20 text-blue-400',
    active: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-purple-500/20 text-purple-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  const roleColor: Record<string, string> = {
    'Host': 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
           <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <h1 className="text-3xl font-extrabold text-white">Player Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Sidebar Bio Card */}
         <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center gap-4 h-fit">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full flex items-center justify-center p-1 shadow-lg">
               <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-500" />
               </div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-white">{profile?.username || user.email?.split('@')[0]}</h2>
               <p className="text-slate-400">{user.email}</p>
            </div>
            
            <div className="w-full h-px bg-slate-700 my-2" />

            <div className="w-full">
               <div className="w-full flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-400">Current Balance</span>
               </div>
               <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-3">
                  <Coins className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl font-black text-emerald-400">{profile?.saps_balance || 500}</span>
               </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="md:col-span-2 flex flex-col gap-8">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
               <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                 <Trophy className="w-5 h-5 text-blue-400" /> Tournament History
               </h3>
               
               {tournamentHistory.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl">
                     <p className="text-slate-500">No tournament history found.</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-4">
                     {tournamentHistory.map((entry) => (
                        <Link
                           key={`${entry.id}-${entry.role}`}
                           href={entry.href}
                           className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 hover:border-slate-500 rounded-xl lg:flex-row flex-col gap-4 transition-colors"
                        >
                           <div>
                              <h4 className="font-bold text-slate-200">{entry.name}</h4>
                              <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                 <Calendar className="w-3 h-3" />
                                 {entry.endsAt
                                    ? (entry.status === 'completed' || entry.status === 'cancelled'
                                       ? `Ended ${new Date(entry.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                       : `Ends ${new Date(entry.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
                                    : statusLabel[entry.status] ?? entry.status}
                              </p>
                           </div>
                           <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${statusColor[entry.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                 {statusLabel[entry.status] ?? entry.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-fit ${roleColor[entry.role] ?? 'bg-slate-700 text-slate-300'}`}>
                                 {entry.role}
                              </span>
                           </div>
                        </Link>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}
