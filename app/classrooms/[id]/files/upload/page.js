'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { AcornIcon, CaterpillarIcon } from '@/components/Icons'

export default function UploadFile() {
  const [profile, setProfile] = useState(null)
  const [isClassroomAdmin, setIsClassroomAdmin] = useState(false)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!profile || !profile.approved) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('classroom_id', id)
        .eq('profile_id', session.user.id)
        .single()

      const isClassAdmin = membership?.role === 'classroom_admin'
      setIsClassroomAdmin(isClassAdmin)

      if (profile.role !== 'admin' && !isClassAdmin) {
        router.push('/dashboard'); return
      }

      setProfile(profile)
    }

    load()
  }, [id])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setMessage('Please select a file'); return }
    setUploading(true)
    setMessage('')

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const filePath = `${id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('classroom-files')
      .upload(filePath, file)

    if (uploadError) { setMessage('Upload error: ' + uploadError.message); setUploading(false); return }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('classroom-files')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365)

    if (signedError) { setMessage('URL error: ' + signedError.message); setUploading(false); return }

    const { error: dbError } = await supabase.from('files').insert({
      classroom_id: id,
      uploaded_by: profile.id,
      name: fileName || file.name,
      file_url: signedData.signedUrl,
      file_type: fileExt
    })

    if (dbError) { setMessage('Database error: ' + dbError.message); setUploading(false); return }

    setMessage('File uploaded!')
    setTimeout(() => router.push(`/classrooms/${id}`), 800)
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '12px' }}>
      <CaterpillarIcon size={48} />
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  )

  return (
    <>
      <Navbar profile={profile} />
      <div className="page-sm">
        <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to classroom</a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1.25rem 0' }}>
          <AcornIcon size={36} />
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Upload a File</h1>
        </div>

        <div className="card">
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Display name (optional)</label>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. March Calendar" />
            </div>
            <div className="form-group">
              <label>Select file</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={e => setFile(e.target.files[0])}
                required
                style={{ borderRadius: '12px', padding: '10px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Accepted: PDF, images, Word docs, Excel sheets
              </p>
            </div>
            {message && (
              <div className={message.startsWith('Upload') || message.startsWith('Database') || message.startsWith('URL') ? 'flash-error' : 'flash-info'}>
                {message}
              </div>
            )}
            <button type="submit" disabled={uploading || !file} className="btn btn-primary btn-full">
              {uploading ? 'Uploading...' : 'Upload file'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}