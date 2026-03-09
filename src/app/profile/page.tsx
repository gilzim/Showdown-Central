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
               
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-xl lg:flex-row flex-col gap-4">
                     <div>
                        <h4 className="font-bold text-slate-200">The Ultimate Showdown 2026</h4>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> Hosted by you • Ended Mar 10</p>
                     </div>
                     <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold uppercase w-fit">Host</span>
                  </div>
                  {/* Empty state hook for when DB query returns empty */}
                  <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl">
                     <p className="text-slate-500">No other tournament history found.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
