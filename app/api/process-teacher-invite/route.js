import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find pending invite by email
  const { data: invites } = await admin
    .from('teacher_invites').select('*').eq('email', user.email)

  if (!invites?.length) return NextResponse.json({ ok: true, processed: 0 })

  let processed = 0
  for (const invite of invites) {
    const role = user.user_metadata?.school_role || 'teacher'

    await admin.from('school_memberships').upsert({
      school_id: invite.school_id,
      profile_id: user.id,
      role,
    })
    await admin.from('profiles').update({ approved: true }).eq('id', user.id)
    await admin.from('teacher_invites').delete().eq('id', invite.id)
    processed++
  }

  return NextResponse.json({ ok: true, processed })
}
