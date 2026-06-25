import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Whitelisted MIME types — nothing executable
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

const ALLOWED_EXT = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
])

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/*
  Required Supabase SQL (run once in SQL editor):

  CREATE TABLE IF NOT EXISTS messages (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    sender_id    uuid NOT NULL REFERENCES profiles(id),
    recipient_id uuid REFERENCES profiles(id),  -- null = broadcast to all classroom parents
    body         text,
    file_url     text,
    file_name    text,
    file_size    bigint,
    created_at   timestamptz DEFAULT now(),
    read_at      timestamptz
  );
  CREATE INDEX ON messages(classroom_id);
  CREATE INDEX ON messages(sender_id);
  CREATE INDEX ON messages(recipient_id);
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Read own messages" ON messages FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid() OR recipient_id IS NULL
  );
  CREATE POLICY "Teachers send messages" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','classroom_admin'))
  );
  CREATE POLICY "Mark read" ON messages FOR UPDATE USING (
    recipient_id = auth.uid()
  ) WITH CHECK (recipient_id = auth.uid());

  -- Storage bucket (in Supabase dashboard > Storage):
  -- Create bucket named "message-files" with private access
*/

export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sender } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!sender || !['admin', 'classroom_admin'].includes(sender.role)) {
    return NextResponse.json({ error: 'Only teachers can send messages' }, { status: 403 })
  }

  const formData = await req.formData()
  const classroomId = formData.get('classroom_id')
  const recipientId = formData.get('recipient_id') || null
  const body = (formData.get('body') || '').trim()
  const file = formData.get('file')

  if (!classroomId) return NextResponse.json({ error: 'classroom_id required' }, { status: 400 })
  if (!body && !file) return NextResponse.json({ error: 'Message body or file required' }, { status: 400 })

  // Verify sender is a member of this classroom
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('profile_id', user.id)
    .eq('approved', true)
    .single()

  if (!membership && sender.role !== 'admin') {
    return NextResponse.json({ error: 'Not a member of this classroom' }, { status: 403 })
  }

  let fileUrl = null
  let fileName = null
  let fileSize = null

  if (file && file.size > 0) {
    // Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    // Validate MIME type against whitelist
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Validate extension — double-check client can't spoof extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: 'File extension not allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const storagePath = `${classroomId}/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { data: upload, error: uploadErr } = await supabase.storage
      .from('message-files')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadErr) return NextResponse.json({ error: 'File upload failed' }, { status: 500 })

    const { data: signed } = await supabase.storage
      .from('message-files')
      .createSignedUrl(upload.path, 60 * 60 * 24 * 7) // 7-day signed URL

    fileUrl = signed?.signedUrl ?? null
    fileName = file.name
    fileSize = file.size
  }

  const { data: message, error: insertErr } = await supabase
    .from('messages')
    .insert({ classroom_id: classroomId, sender_id: user.id, recipient_id: recipientId, body: body || null, file_url: fileUrl, file_name: fileName, file_size: fileSize })
    .select()
    .single()

  if (insertErr) {
    console.error('[messages] insert error:', insertErr.message)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }

  return NextResponse.json({ message })
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classroomId = searchParams.get('classroom_id')
  if (!classroomId) return NextResponse.json({ error: 'classroom_id required' }, { status: 400 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(full_name, avatar_url), recipient:recipient_id(full_name)')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[messages] select error:', error.message)
    return NextResponse.json({ error: 'Failed to load messages.' }, { status: 500 })
  }

  return NextResponse.json({ messages })
}
