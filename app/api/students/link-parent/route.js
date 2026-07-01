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

  const { child_id, profile_id } = await request.json()
  if (!child_id || !profile_id) {
    return NextResponse.json({ error: 'child_id and profile_id required' }, { status: 400 })
  }

  // Load child + classroom info
  const { data: child } = await admin
    .from('children')
    .select('id, name, classroom_id, classrooms(name)')
    .eq('id', child_id)
    .single()
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const isGlobalAdmin = callerProfile.role === 'admin'
  if (!isGlobalAdmin) {
    const { data: callerMem } = await admin
      .from('memberships').select('role')
      .eq('profile_id', user.id).eq('classroom_id', child.classroom_id)
      .eq('role', 'classroom_admin').eq('approved', true).single()
    if (!callerMem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create the link
  const { error: linkErr } = await admin
    .from('family_members')
    .upsert({ child_id, profile_id }, { onConflict: 'child_id,profile_id' })
  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

  // Look up parent email and name
  const { data: { user: parentAuth } } = await admin.auth.admin.getUserById(profile_id)
  const { data: parentProfile } = await admin
    .from('profiles').select('full_name').eq('id', profile_id).single()

  const parentEmail = parentAuth?.email
  const parentName = parentProfile?.full_name || 'there'
  const childName = child.name
  const classroomName = child.classrooms?.name || 'their classroom'

  if (parentEmail && process.env.NOTIFY_FROM_EMAIL) {
    await resend.emails.send({
      from: process.env.NOTIFY_FROM_EMAIL,
      to: [parentEmail],
      subject: `${childName} has been added to your TumbleTree account`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#2f4a2c;margin-bottom:4px">${esc(childName)} is on TumbleTree 🌿</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin-top:8px">
            Hi ${esc(parentName)}, <strong>${esc(childName)}</strong> in
            <strong>${esc(classroomName)}</strong> has been linked to your TumbleTree account.
            You can now view their daily reports, progress updates, and classroom activity.
          </p>
          <a href="${APP_URL}/my-children"
             style="display:inline-block;margin-top:8px;background:#4a9d4f;color:#fff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px">
            View ${esc(childName)}'s profile →
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:24px">
            You're receiving this because a TumbleTree administrator linked your account to this student.
          </p>
        </div>
      `,
    }).catch(err => console.error('[students/link-parent] email error:', err.message))
  }

  return NextResponse.json({ ok: true })
}
