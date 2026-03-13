import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Coins, Users, TrendingUp, LogOut } from 'lucide-react'
import DashboardJoinButton from '@/components/dashboard/DashboardJoinButton'
import DailyBonusButton from '@/components/dashboard/DailyBonusButton'
import Link from 'next/link'

type JoinedTeam = {
  tournament_id: string
  tournaments: {
    id: string
    name: string
    game: string
    status: string
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch tournaments hosted by the user
  const { data: hostedTournaments } = await supabase
    .from('tournaments')
    .select('id, name, game, status')
    .eq('host_id', user.id)
    .in('status', ['draft', 'upcoming', 'active'])
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch tournaments the user has joined as a team captain
  const { data: joinedTeams } = await supabase
    .from('teams')
    .select('tournament_id, tournaments(id, name, game, status)')
    .eq('captain_id', user.id)
    .limit(5)

  // Fetch active bets for the user
  const { data: activeBets } = await supabase
    .from('bets')
    .select('id, amount, odds_at_bet, status')
    .eq('bettor_id', user.id)
    .eq('status', 'pending')
    .limit(5)

  // For logout button
  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center w-full mb-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome, {profile?.username || user.email?.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-2">Manage your tournaments and wagers.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Saps Balance</span>
            <span className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {profile?.saps_balance ?? 500}
            </span>
          </div>

          <DailyBonusButton lastBonusAt={profile?.last_bonus_at ?? null} />
          
          <form action={signOut}>
            <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-semibold" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hosted Tournaments */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
           <div className="flex items-center gap-3 text-blue-400 pb-4 border-b border-slate-700/50">
             <Trophy className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Live Tournaments</h2>
           </div>
           {hostedTournaments && hostedTournaments.length > 0 ? (
             <ul className="flex flex-col gap-2">
               {hostedTournaments.map((t) => (
                 <li key={t.id}>
                   <Link href={`/tournaments/${t.id}`} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                     <div>
                       <p className="font-semibold text-white text-sm">{t.name}</p>
                       <p className="text-xs text-slate-400">{t.game}</p>
                     </div>
                     <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                       {t.status}
                     </span>
                   </Link>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-slate-400">You have no active tournaments.</p>
           )}
           <Link href="/tournaments/host" className="mt-auto py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-center w-full block">
             Host New Tournament
           </Link>
        </div>

        {/* Joined Tournaments */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
           <div className="flex items-center gap-3 text-emerald-400 pb-4 border-b border-slate-700/50">
             <Users className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Joined by You</h2>
           </div>
           {joinedTeams && joinedTeams.length > 0 ? (
             <ul className="flex flex-col gap-2">
               {joinedTeams.map((jt: JoinedTeam) => {
                 const t = jt.tournaments
                 if (!t) return null
                 return (
                   <li key={jt.tournament_id}>
                     <Link href={`/tournaments/${t.id}`} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                       <div>
                         <p className="font-semibold text-white text-sm">{t.name}</p>
                         <p className="text-xs text-slate-400">{t.game}</p>
                       </div>
                       <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                         {t.status}
                       </span>
                     </Link>
                   </li>
                 )
               })}
             </ul>
           ) : (
             <p className="text-slate-400">You haven&apos;t joined any standard brackets yet.</p>
           )}
           <DashboardJoinButton />
        </div>

        {/* Active Bets */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4 md:col-span-3 lg:col-span-1 border-emerald-500/20 shadow-emerald-900/10">
           <div className="flex items-center gap-3 text-purple-400 pb-4 border-b border-slate-700/50">
             <TrendingUp className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Active Bets</h2>
           </div>
           {activeBets && activeBets.length > 0 ? (
             <ul className="flex flex-col gap-2">
               {activeBets.map((bet) => (
                 <li key={bet.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                   <span className="text-sm font-semibold text-white">{bet.amount} SAPS</span>
                   <span className="text-xs text-emerald-400 font-bold">{bet.odds_at_bet}x</span>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-slate-400">No open wagers. Find a live tournament to bet!</p>
           )}
           <Link href="/betting" className="mt-auto py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors text-center w-full block">
             Browse Bets
           </Link>
        </div>
      </div>
    </div>
  )
}

