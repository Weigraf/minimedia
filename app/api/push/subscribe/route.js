import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription } = await request.json()
  if (!subscription?.endpoint) return Response.json({ error: 'Invalid subscription' }, { status: 400 })

  const { error } = await supabase.from('push_subscriptions').upsert(
    { profile_id: user.id, endpoint: subscription.endpoint, subscription },
    { onConflict: 'endpoint' }
  )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  await supabase.from('push_subscriptions').delete().eq('profile_id', user.id).eq('endpoint', endpoint)
  return Response.json({ ok: true })
}
