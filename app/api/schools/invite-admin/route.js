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

  const { data: sender } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (sender?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { schoolId, email } = await req.json()
  if (!schoolId || !email?.trim()) return NextResponse.json({ error: 'schoolId and email required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: school } = await admin.from('schools').select('id, name').eq('id', schoolId).single()
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  // Check no school_admin already assigned
  const { data: existing } = await admin.from('school_memberships').select('id').eq('school_id', schoolId).eq('role', 'school_admin').maybeSingle()
  if (existing) return NextResponse.json({ error: 'This school already has an admin.' }, { status: 409 })

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { school_id: schoolId, school_role: 'school_admin' },
    redirectTo: `${origin}/accept-teacher-invite`,
  })

  if (inviteErr && !inviteErr.message.includes('already registered')) {
    return NextResponse.json({ error: inviteErr.message }, { status: 500 })
  }

  await admin.from('teacher_invites').upsert({ school_id: schoolId, email: email.trim(), invited_by: user.id })

  // If user already exists, assign immediately
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existingUser = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
  if (existingUser) {
    await admin.from('school_memberships').upsert({ school_id: schoolId, profile_id: existingUser.id, role: 'school_admin' })
    await admin.from('teacher_invites').delete().eq('school_id', schoolId).eq('email', email.trim())
  }

  return NextResponse.json({ ok: true })
}
