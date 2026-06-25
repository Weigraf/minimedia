'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { AcornIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function UploadFile() {
  const [profile, setProfile] = useState(null)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState(null)
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

      if (profile.role !== 'admin' && membership?.role !== 'classroom_admin') {
        router.push('/dashboard'); return
      }

      setProfile(profile)
      setToken(session.access_token)
    }

    load()
  }, [id])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setMessage('Please select a file'); return }
    setUploading(true)
    setMessage('')

    const fd = new FormData()
    fd.append('classroom_id', id)
    fd.append('file', file)
    if (fileName.trim()) fd.append('display_name', fileName.trim())

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })

    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Upload failed')
      setUploading(false)
      return
    }

    setMessage('File uploaded!')
    setTimeout(() => router.push(`/classrooms/${id}`), 800)
  }

  if (!profile) return <PageLoader />

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
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                onChange={e => setFile(e.target.files[0] ?? null)}
                required
                style={{ borderRadius: '12px', padding: '10px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Accepted: PDF, images (JPG, PNG, GIF, WebP), Word docs, Excel sheets · Max 20 MB
              </p>
            </div>
            {message && (
              <div className={message === 'File uploaded!' ? 'flash-info' : 'flash-error'}>
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
