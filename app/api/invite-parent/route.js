import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, child_id, classroom_id } = await request.json()
  if (!email || !child_id || !classroom_id) {
    return NextResponse.json({ error: 'email, child_id, and classroom_id are required' }, { status: 400 })
  }

  const emailLower = email.toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the requesting user admins this classroom
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (profile.role !== 'admin') {
    const { data: mem } = await admin
      .from('memberships')
      .select('role')
      .eq('profile_id', user.id)
      .eq('classroom_id', classroom_id)
      .eq('role', 'classroom_admin')
      .eq('approved', true)
      .single()
    if (!mem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify the child belongs to this classroom
  const { data: child } = await admin.from('children').select('id').eq('id', child_id).eq('classroom_id', classroom_id).single()
  if (!child) return NextResponse.json({ error: 'Child not found in this classroom' }, { status: 404 })

  // Check for duplicate pending invite
  const { data: existing } = await admin.from('pending_invites').select('id').eq('email', emailLower).eq('child_id', child_id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'An invite for this email is already pending' }, { status: 409 })

  // Store pending invite first
  const { error: insertError } = await admin.from('pending_invites').insert({
    email: emailLower,
    child_id,
    classroom_id,
    invited_by: user.id,
  })
  if (insertError) return NextResponse.json({ error: 'Failed to create invite record' }, { status: 500 })

  // Send Supabase magic-link invite
  const origin = new URL(request.url).origin
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(emailLower, {
    data: { child_id, classroom_id },
    redirectTo: `${origin}/accept-invite`,
  })

  if (inviteError) {
    // Roll back pending invite if email send failed
    await admin.from('pending_invites').delete().eq('email', emailLower).eq('child_id', child_id)

    if (inviteError.message?.toLowerCase().includes('already registered')) {
      return NextResponse.json(
        { error: 'This person already has a TumbleTree account. Ask them to request to join the classroom from their dashboard, then approve them in Approvals.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
