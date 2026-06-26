import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { contactLimiter, getClientIP, checkLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { esc } from '@/lib/html-escape'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tumble-tree.com'

/*
  Run this SQL in Supabase before using the contact form:

  CREATE TABLE contact_inquiries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    subject     TEXT,
    message     TEXT        NOT NULL,
    read        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
*/

async function requireAdmin(request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? admin : null
}

// Public: submit a contact inquiry
export async function POST(request) {
  const limited = await checkLimit(contactLimiter, getClientIP(request))
  if (limited) return limited

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name    = body.name?.trim()
  const email   = body.email?.trim()
  const subject = body.subject?.trim() || null
  const message = body.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message must be under 4,000 characters.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('contact_inquiries')
    .insert({ name, email, subject, message })

  if (error) {
    console.error('[contact] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to submit — please try again.' }, { status: 500 })
  }

  const adminEmail = process.env.NOTIFY_ADMIN_EMAIL
  if (adminEmail) {
    await resend.emails.send({
      from: process.env.NOTIFY_FROM_EMAIL,
      to: [adminEmail],
      subject: subject ? `Contact form: ${subject}` : 'New contact form submission',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#27500A;margin-bottom:4px">New contact message</h2>
          <p style="color:#555;font-size:14px;margin-top:0">
            From <strong>${esc(name)}</strong> &lt;${esc(email)}&gt;
            ${subject ? `· <em>${esc(subject)}</em>` : ''}
          </p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;font-size:15px;color:#222;white-space:pre-wrap">${esc(message)}</div>
          <a href="${APP_URL}/admin/contact"
             style="display:inline-block;margin-top:16px;background:#3B6D11;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:600;font-size:14px">
            View in Contact Inbox →
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:24px">You're receiving this as the TumbleTree admin.</p>
        </div>
      `,
    }).catch(err => console.error('[contact] email error:', err.message))
  }

  return NextResponse.json({ ok: true })
}

// Admin: list all inquiries
export async function GET(request) {
  const supabase = await requireAdmin(request)
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: inquiries, error } = await supabase
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inquiries })
}

// Admin: toggle read status
export async function PATCH(request) {
  const supabase = await requireAdmin(request)
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, read } = await request.json()
  if (!id || typeof read !== 'boolean') {
    return NextResponse.json({ error: 'id and read are required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('contact_inquiries')
    .update({ read })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
