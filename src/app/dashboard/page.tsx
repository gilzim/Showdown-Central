import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Coins, Users, TrendingUp, LogOut } from 'lucide-react'
import DashboardJoinButton from '@/components/dashboard/DashboardJoinButton'
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
              {profile?.saps_balance || 500}
            </span>
          </div>
          
          <form action={signOut}>
            <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-semibold" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
           <div className="flex items-center gap-3 text-blue-400 pb-4 border-b border-slate-700/50">
             <Trophy className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Live Tournaments</h2>
           </div>
           <p className="text-slate-400">You have no active tournaments.</p>
           <a href="/tournaments/host" className="mt-auto py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-center w-full block">
             Host New Tournament
           </a>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
           <div className="flex items-center gap-3 text-emerald-400 pb-4 border-b border-slate-700/50">
             <Users className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Joined by You</h2>
           </div>
           <p className="text-slate-400">You haven't joined any standard brackets yet.</p>
           <DashboardJoinButton />
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4 md:col-span-3 lg:col-span-1 border-emerald-500/20 shadow-emerald-900/10">
           <div className="flex items-center gap-3 text-purple-400 pb-4 border-b border-slate-700/50">
             <TrendingUp className="w-6 h-6" />
             <h2 className="text-xl font-bold text-slate-100">Active Bets</h2>
           </div>
           <p className="text-slate-400">No open wagers. Find a live tournament to bet!</p>
        </div>
      </div>
    </div>
  )
}

