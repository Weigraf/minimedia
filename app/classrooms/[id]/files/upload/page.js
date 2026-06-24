'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function UploadFile() {
  const [profile, setProfile] = useState(null)
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

      if (!profile || !profile.approved || profile.role !== 'admin') {
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

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('classroom-files')
      .upload(filePath, file)

    if (uploadError) {
      setMessage('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get the public URL
    const { data: signedData, error: signedError } = await supabase.storage
  .from('classroom-files')
  .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiry

if (signedError) {
  setMessage('URL error: ' + signedError.message)
  setUploading(false)
  return
}

const fileUrl = signedData.signedUrl

    // Save file record to database
    const { error: dbError } = await supabase.from('files').insert({
  classroom_id: id,
  uploaded_by: profile.id,
  name: fileName || file.name,
  file_url: fileUrl,
  file_type: fileExt
})

    if (dbError) {
      setMessage('Database error: ' + dbError.message)
      setUploading(false)
      return
    }

    setMessage('File uploaded successfully! Redirecting...')
    setTimeout(() => router.push(`/classrooms/${id}`), 1000)
  }

  if (!profile) return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading...</p>

  return (
    <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <a href={`/classrooms/${id}`} style={{ color: '#4F46E5', textDecoration: 'none' }}>← Back to classroom</a>
      <h1 style={{ margin: '1rem 0' }}>Upload a File</h1>

      <form onSubmit={handleUpload}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Display name (optional)</label><br />
          <input
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            placeholder="e.g. March Calendar, Field Trip Permission Slip"
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>Select file</label><br />
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            onChange={e => setFile(e.target.files[0])}
            required
            style={{ marginTop: '8px' }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#666' }}>
            Accepted: PDF, images, Word docs, Excel sheets
          </p>
        </div>

        <button type="submit" disabled={uploading || !file}
          style={{ width: '100%', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: uploading || !file ? 0.5 : 1 }}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '1rem', color: message.startsWith('Upload error') || message.startsWith('Database') ? 'red' : '#4F46E5' }}>
          {message}
        </p>
      )}
    </main>
  )
}