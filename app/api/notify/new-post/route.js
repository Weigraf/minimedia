import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPush } from '@/lib/webpush'
import { sendFCMPush } from '@/lib/firebase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = 'https://minimedia-blue.vercel.app'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await request.json()
  if (!postId) return Response.json({ error: 'Missing postId' }, { status: 400 })

  const { data: post } = await supabase
    .from('posts')
    .select('content, classroom_id, author_id, profiles(full_name)')
    .eq('id', postId)
    .single()

  if (!post) return Response.json({ error: 'Post not found' }, { status: 404 })

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('name')
    .eq('id', post.classroom_id)
    .single()

  const { data: memberships } = await supabase
    .from('memberships')
    .select('profile_id')
    .eq('classroom_id', post.classroom_id)
    .eq('approved', true)
    .neq('profile_id', post.author_id)

  if (!memberships?.length) return Response.json({ ok: true, sent: 0 })

  const memberIds = memberships.map(m => m.profile_id)
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const recipients = users.filter(u => memberIds.includes(u.id) && u.email)

  if (!recipients.length) return Response.json({ ok: true, sent: 0 })

  const excerpt = post.content
    ? post.content.length > 200 ? post.content.slice(0, 200) + '…' : post.content
    : '(image post)'

  const classroomUrl = `${APP_URL}/classrooms/${post.classroom_id}`

  // Email all recipients
  await resend.emails.send({
    from: process.env.NOTIFY_FROM_EMAIL,
    to: recipients.map(u => u.email),
    subject: `New post in ${classroom.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#27500A;margin-bottom:4px">${classroom.name}</h2>
        <p style="color:#555;margin-top:0;font-size:14px">New update from ${post.profiles?.full_name}</p>
        <div style="background:#EAF3DE;border-radius:10px;padding:16px;margin:16px 0;font-size:15px;line-height:1.6;color:#222">
          ${excerpt}
        </div>
        <a href="${classroomUrl}"
           style="display:inline-block;background:#3B6D11;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:600;font-size:14px">
          View in classroom →
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:24px">
          You're receiving this because you're a member of ${classroom.name} on TumbleTree.
        </p>
      </div>
    `,
  })

  // Push notify all recipients who have subscriptions
  const { data: pushSubs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .in('profile_id', memberIds)

  if (pushSubs?.length) {
    const payload = {
      title: `New post in ${classroom.name}`,
      body: `${post.profiles?.full_name}: ${excerpt}`,
      url: classroomUrl,
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
    .in('profile_id', memberIds)

  let fcmSent = 0
  if (deviceTokenRows?.length) {
    const tokens = deviceTokenRows.map(r => r.token)
    const fcmPayload = { title: `New post in ${classroom.name}`, body: `${post.profiles?.full_name}: ${excerpt}`, url: classroomUrl }
    const { sent, expired } = await sendFCMPush(tokens, fcmPayload)
    fcmSent = sent
    if (expired.length) {
      await supabase.from('device_tokens').delete().in('token', expired)
    }
  }

  return Response.json({ ok: true, sent: recipients.length, pushSent: (pushSubs?.length ?? 0) + fcmSent })
}
