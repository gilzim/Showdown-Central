import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify host
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (!tournament || tournament.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('teams')
      .insert({ tournament_id: tournamentId, name })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { team_id, name } = await request.json()
    if (!team_id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Verify tournament ownership
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (!tournament || tournament.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('teams')
      .update({ name })
      .eq('id', team_id)
      .eq('tournament_id', tournamentId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { team_id } = await request.json()
    if (!team_id) return NextResponse.json({ error: 'Missing team_id' }, { status: 400 })

    // Verify tournament ownership
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (!tournament || tournament.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', team_id)
      .eq('tournament_id', tournamentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
