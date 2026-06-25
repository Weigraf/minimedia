import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'])

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

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

  const supabase = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single()
  if (!profile?.approved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const classroomId = formData.get('classroom_id')
  const displayName = formData.get('display_name') || null
  const file = formData.get('file')

  if (!classroomId || !file) {
    return NextResponse.json({ error: 'classroom_id and file are required' }, { status: 400 })
  }

  // Verify admin or classroom_admin membership
  if (profile.role !== 'admin') {
    const { data: membership } = await supabase
      .from('memberships').select('role')
      .eq('classroom_id', classroomId).eq('profile_id', user.id).single()
    if (membership?.role !== 'classroom_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Size check
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 20 MB' }, { status: 400 })
  }

  // MIME type check
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  // Extension check
  const nameParts = file.name.split('.')
  if (nameParts.length > 2) {
    return NextResponse.json({ error: 'File name must not contain multiple extensions' }, { status: 400 })
  }
  const ext = nameParts.pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'File extension not allowed' }, { status: 400 })
  }

  // Magic byte check
  const bytes = await file.arrayBuffer()
  const h = new Uint8Array(bytes.slice(0, 8))

  const isJpeg = h[0] === 0xFF && h[1] === 0xD8
  const isPng  = h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4E && h[3] === 0x47
  const isGif  = h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46
  const isWebp = h[0] === 0x52 && h[1] === 0x49 // RIFF
  const isPdf  = h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46
  const isOle  = h[0] === 0xD0 && h[1] === 0xCF // .doc, .xls
  const isZip  = h[0] === 0x50 && h[1] === 0x4B // .docx, .xlsx

  const magicOk =
    (['jpg', 'jpeg'].includes(ext) && isJpeg) ||
    (ext === 'png'  && isPng)  ||
    (ext === 'gif'  && isGif)  ||
    (ext === 'webp' && isWebp) ||
    (ext === 'pdf'  && isPdf)  ||
    (['doc', 'xls'].includes(ext)  && isOle) ||
    (['docx', 'xlsx'].includes(ext) && isZip)

  if (!magicOk) {
    return NextResponse.json({ error: 'File content does not match its extension' }, { status: 400 })
  }

  // Upload to storage
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${classroomId}/${user.id}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('classroom-files')
    .upload(filePath, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('classroom file upload error:', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: signed } = await supabase.storage
    .from('classroom-files')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365)

  const { error: dbError } = await supabase.from('files').insert({
    classroom_id: classroomId,
    uploaded_by: user.id,
    name: displayName || file.name,
    file_url: signed?.signedUrl,
    file_type: ext,
  })

  if (dbError) {
    console.error('classroom file db error:', dbError.message)
    return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
