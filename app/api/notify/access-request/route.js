import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPush } from '@/lib/webpush'
import { sendFCMPush } from '@/lib/firebase-admin'
import { esc } from '@/lib/html-escape'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tumble-tree.com'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { classroomId } = await request.json()
  if (!classroomId) return Response.json({ error: 'Missing classroomId' }, { status: 400 })

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('name')
    .eq('id', classroomId)
    .single()

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: globalAdmins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  const { data: classroomAdmins } = await supabase
    .from('memberships')
    .select('profile_id')
    .eq('classroom_id', classroomId)
    .eq('role', 'classroom_admin')
    .eq('approved', true)

  const adminIds = [
    ...(globalAdmins?.map(a => a.id) ?? []),
    ...(classroomAdmins?.map(a => a.profile_id) ?? []),
  ]
  const uniqueAdminIds = [...new Set(adminIds)].filter(id => id !== user.id)

  if (!uniqueAdminIds.length) return Response.json({ ok: true, sent: 0 })

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const recipients = users.filter(u => uniqueAdminIds.includes(u.id) && u.email)

  if (!recipients.length) return Response.json({ ok: true, sent: 0 })

  const approvalsUrl = `${APP_URL}/admin/approvals`
  const requesterName = requesterProfile?.full_name ?? 'A parent'

  await resend.emails.send({
    from: process.env.NOTIFY_FROM_EMAIL,
    to: recipients.map(u => u.email),
    subject: `Access request for ${esc(classroom.name)}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#27500A;margin-bottom:4px">New access request</h2>
        <p style="color:#555;margin-top:0;font-size:14px">
          <strong>${esc(requesterName)}</strong> has requested to join
          <strong>${esc(classroom.name)}</strong>.
        </p>
        <p style="color:#555;font-size:14px">Their email: <strong>${esc(user.email)}</strong></p>
        <a href="${approvalsUrl}"
           style="display:inline-block;background:#3B6D11;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:600;font-size:14px">
          Review in approvals →
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:24px">
          You're receiving this because you're an admin of ${esc(classroom.name)} on TumbleTree.
        </p>
      </div>
    `,
  })

  // Push notify admins who have subscriptions
  const { data: pushSubs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .in('profile_id', uniqueAdminIds)

  if (pushSubs?.length) {
    const payload = {
      title: `Access request: ${classroom.name}`,
      body: `${requesterName} wants to join ${classroom.name}`,
      url: approvalsUrl,
    }
    const expiredIds = []
    await Promise.all(pushSubs.map(async ({ id, subscription }) => {
      const result = await sendPush(subscription, payload)
      if (result === 'expired') expiredIds.push(id)
    }))
    if (expiredIds.length) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds)
    }
  }

  // FCM push to native devices
  const { data: deviceTokenRows } = await supabase
    .from('device_tokens')
    .select('token')
    .in('profile_id', uniqueAdminIds)

  let fcmSent = 0
  if (deviceTokenRows?.length) {
    const tokens = deviceTokenRows.map(r => r.token)
    const fcmPayload = { title: `Access request: ${classroom.name}`, body: `${requesterName} wants to join ${classroom.name}`, url: approvalsUrl }
    const { sent, expired } = await sendFCMPush(tokens, fcmPayload)
    fcmSent = sent
    if (expired.length) {
      await supabase.from('device_tokens').delete().in('token', expired)
    }
  }

  return Response.json({ ok: true, sent: recipients.length, pushSent: (pushSubs?.length ?? 0) + fcmSent })
}
