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

  const { name, description, adminEmail } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'School name required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: school, error: schoolErr } = await admin
    .from('schools').insert({ name: name.trim(), description: description?.trim() || null })
    .select().single()
  if (schoolErr) return NextResponse.json({ error: schoolErr.message }, { status: 500 })

  if (adminEmail?.trim()) {
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(adminEmail.trim(), {
      data: { school_id: school.id, school_role: 'school_admin' },
      redirectTo: `${origin}/accept-teacher-invite`,
    })
    if (inviteErr && !inviteErr.message.includes('already registered')) {
      console.error('[schools/create] invite error:', inviteErr.message)
    }
    // Store pending invite record
    await admin.from('teacher_invites').upsert({
      school_id: school.id, email: adminEmail.trim(), invited_by: user.id,
    })
  }

  return NextResponse.json({ schoolId: school.id })
}
