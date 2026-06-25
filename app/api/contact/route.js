import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

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

export async function POST(request) {
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
    console.error('contact_inquiries insert error:', error.message)
    return NextResponse.json({ error: 'Failed to submit — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
