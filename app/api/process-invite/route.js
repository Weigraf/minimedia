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
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find all pending invites for this email
  const { data: invites } = await admin
    .from('pending_invites')
    .select('child_id, classroom_id')
    .eq('email', user.email.toLowerCase())

  if (!invites?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  for (const invite of invites) {
    // Link parent to child
    await admin.from('family_members').upsert({
      child_id: invite.child_id,
      profile_id: user.id,
    })

    // Create pending classroom membership (teacher must approve)
    await admin.from('memberships').upsert({
      classroom_id: invite.classroom_id,
      profile_id: user.id,
      role: 'parent',
      approved: false,
    })
  }

  // Clean up processed invites
  await admin.from('pending_invites').delete().eq('email', user.email.toLowerCase())

  return NextResponse.json({ ok: true, processed: invites.length })
}
