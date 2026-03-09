'use client'

import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

type SupabaseContext = {
  user: User | null
  session: Session | null
  isLoading: boolean
}

const Context = createContext<SupabaseContext>({
  user: null,
  session: null,
  isLoading: true,
})

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider value={{ user, session, isLoading }}>
      {children}
    </Context.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useAuth must be used inside SupabaseProvider')
  }
  return context
}
