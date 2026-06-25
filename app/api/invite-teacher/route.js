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

  // Caller must be a school_admin
  const { data: sm } = await supabase
    .from('school_memberships').select('school_id')
    .eq('profile_id', user.id).eq('role', 'school_admin').single()
  if (!sm) return NextResponse.json({ error: 'Forbidden — school admins only' }, { status: 403 })

  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdminClient()

  // Prevent duplicate invite
  const { data: dup } = await admin
    .from('teacher_invites').select('id').eq('school_id', sm.school_id).eq('email', email.trim()).maybeSingle()
  if (dup) return NextResponse.json({ error: 'An invite for this email is already pending.' }, { status: 409 })

  // Check not already a teacher in this school
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existingUser = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
  if (existingUser) {
    const { data: already } = await admin
      .from('school_memberships').select('id').eq('school_id', sm.school_id).eq('profile_id', existingUser.id).maybeSingle()
    if (already) return NextResponse.json({ error: 'This person is already in your school.' }, { status: 409 })

    // Existing user — add directly
    await admin.from('school_memberships').insert({ school_id: sm.school_id, profile_id: existingUser.id, role: 'teacher' })
    await admin.from('profiles').update({ approved: true }).eq('id', existingUser.id)
    return NextResponse.json({ ok: true, direct: true })
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { school_id: sm.school_id, school_role: 'teacher' },
    redirectTo: `${origin}/accept-teacher-invite`,
  })
  if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 })

  await admin.from('teacher_invites').insert({ school_id: sm.school_id, email: email.trim(), invited_by: user.id })

  return NextResponse.json({ ok: true })
}
