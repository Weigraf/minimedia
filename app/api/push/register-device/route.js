import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { token: fcmToken, platform } = await request.json()
  if (!fcmToken || !platform) return Response.json({ error: 'Missing token or platform' }, { status: 400 })

  const { error } = await supabase.from('device_tokens').upsert(
    { profile_id: user.id, token: fcmToken, platform },
    { onConflict: 'token' }
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

  const { token: fcmToken } = await request.json()
  await supabase.from('device_tokens').delete().eq('profile_id', user.id).eq('token', fcmToken)
  return Response.json({ ok: true })
}
