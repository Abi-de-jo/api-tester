import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id') || 'default'
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('feature_flags')
    .select('feature_name, enabled')
    .eq('user_id', userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const flags: Record<string, boolean> = {}
  for (const row of data) {
    flags[row.feature_name] = row.enabled
  }

  return Response.json({ flags })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  const { feature_name, user_id, enabled } = await request.json()

  if (!feature_name) {
    return Response.json({ error: 'feature_name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feature_flags')
    .upsert(
      { feature_name, user_id: user_id || 'default', enabled: !!enabled },
      { onConflict: 'feature_name,user_id' }
    )
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ flag: data })
}
