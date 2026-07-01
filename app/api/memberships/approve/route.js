import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { esc } from '@/lib/html-escape'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tumble-tree.com'

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

  const admin = createAdminClient()

  const { data: callerProfile } = await admin
    .from('profiles').select('role, approved').eq('id', user.id).single()
  if (!callerProfile?.approved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'membership id required' }, { status: 400 })

  // Fetch the membership to verify the caller has rights to approve it
  const { data: membership } = await admin
    .from('memberships')
    .select('id, profile_id, classroom_id, approved, classrooms(name), profiles(full_name)')
    .eq('id', id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (membership.approved) return NextResponse.json({ ok: true, alreadyApproved: true })

  const isGlobalAdmin = callerProfile.role === 'admin'
  if (!isGlobalAdmin) {
    // Must be classroom_admin of this specific classroom
    const { data: callerMem } = await admin
      .from('memberships').select('role')
      .eq('profile_id', user.id).eq('classroom_id', membership.classroom_id)
      .eq('role', 'classroom_admin').eq('approved', true).single()
    if (!callerMem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Approve the membership
  const { error: updateErr } = await admin
    .from('memberships').update({ approved: true }).eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Look up the parent's auth email (only available via service role)
  const { data: { user: parentAuth } } = await admin.auth.admin.getUserById(membership.profile_id)
  const parentEmail = parentAuth?.email
  const parentName = membership.profiles?.full_name || 'there'
  const classroomName = membership.classrooms?.name || 'your classroom'

  if (parentEmail && process.env.NOTIFY_FROM_EMAIL) {
    await resend.emails.send({
      from: process.env.NOTIFY_FROM_EMAIL,
      to: [parentEmail],
      subject: `You've been approved for ${classroomName} on TumbleTree`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#2f4a2c;margin-bottom:4px">You're in! 🌱</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin-top:8px">
            Hi ${esc(parentName)}, your request to join <strong>${esc(classroomName)}</strong> on
            TumbleTree has been approved. You can now view classroom posts, files, and messages.
          </p>
          <a href="${APP_URL}/login"
             style="display:inline-block;margin-top:8px;background:#4a9d4f;color:#fff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px">
            Sign in to TumbleTree →
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:24px">
            You're receiving this because your account was approved by a TumbleTree administrator.
          </p>
        </div>
      `,
    }).catch(err => console.error('[memberships/approve] email error:', err.message))
  }

  return NextResponse.json({ ok: true })
}
