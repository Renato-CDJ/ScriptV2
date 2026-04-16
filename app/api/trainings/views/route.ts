import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST - Registrar visualização de treinamento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { training_filename, training_title, user_id, user_name } = body

    if (!training_filename || !user_id || !user_name) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.from('training_views').insert({
      training_filename,
      training_title: training_title || training_filename,
      user_id,
      user_name,
      viewed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[v0] Error registering training view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in training views POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Buscar visualizações (para relatório)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('training_views')
      .select('*')
      .order('viewed_at', { ascending: false })

    if (filename) {
      query = query.eq('training_filename', filename)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching training views:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ views: data || [] })
  } catch (error) {
    console.error('[v0] Error in training views GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
