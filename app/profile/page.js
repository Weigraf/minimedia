'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SproutIcon, CaterpillarIcon } from '@/components/Icons'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!profile) { router.push('/login'); return }
      setProfile(profile)
      setPreview(profile.avatar_url)
    }
    load()
  }, [])

  async function handleAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return

  // Whitelist of allowed MIME types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  // Whitelist of allowed extensions
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
  const fileExt = file.name.split('.').pop().toLowerCase()

  // Block double extensions like .php.jpg or .phar.png
  const nameParts = file.name.split('.')
  if (nameParts.length > 2) {
    setMessage('File name must not contain multiple extensions.')
    e.target.value = ''
    return
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    setMessage('Only JPG, PNG, and WebP images are allowed.')
    e.target.value = ''
    return
  }

  // Check extension matches MIME type
  if (!allowedExtensions.includes(fileExt)) {
    setMessage('Only .jpg, .jpeg, .png, and .webp files are allowed.')
    e.target.value = ''
    return
  }

  // Check file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    setMessage('Image must be under 2MB.')
    e.target.value = ''
    return
  }

  // Read the first bytes to verify it's actually an image (magic number check)
  const header = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(new Uint8Array(reader.result))
    reader.readAsArrayBuffer(file.slice(0, 4))
  })

  const isJpeg = header[0] === 0xFF && header[1] === 0xD8
  const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
  const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46

  if (!isJpeg && !isPng && !isWebp) {
    setMessage('File does not appear to be a valid image.')
    e.target.value = ''
    return
  }

  setUploading(true)
  setMessage('')

  const supabase = createClient()
  const filePath = `${profile.id}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    setMessage('Upload error: ' + uploadError.message)
    setUploading(false)
    e.target.value = ''
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlWithBust })
    .eq('id', profile.id)

  if (dbError) {
    setMessage('Save error: ' + dbError.message)
    setUploading(false)
    return
  }

  setPreview(urlWithBust)
  setProfile(prev => ({ ...prev, avatar_url: urlWithBust }))
  setMessage('Profile picture updated!')
  setUploading(false)
  e.target.value = ''
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
        <a href="/dashboard" style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to dashboard</a>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '1.25rem 0' }}>Your Profile</h1>

        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green-sage)' }}
              />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--green-whisper)', border: '3px solid var(--green-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--green-forest)' }}>
                  {profile.full_name?.charAt(0)}
                </span>
              </div>
            )}
            <button
              onClick={() => fileRef.current.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderRadius: '50%', background: 'var(--green-leaf)', border: '2px solid var(--bg)', color: '#EAF3DE', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              aria-label="Change profile picture"
            >
              +
            </button>
          </div>

          <input
  ref={fileRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleAvatarChange}
  style={{ display: 'none' }}
/>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{profile.full_name}</h2>
          <span className={`badge badge-${profile.role}`}>{profile.role}</span>

          <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '0.5px solid var(--border)', paddingTop: '1.25rem' }}>
            <div className="form-group">
              <label>Full name</label>
              <input value={profile.full_name} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={profile.role} disabled style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }} />
            </div>
          </div>

          {uploading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}>
              <CaterpillarIcon size={24} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Uploading...</p>
            </div>
          )}

          {message && (
            <div className={message.includes('error') || message.includes('must') ? 'flash-error' : 'flash-info'} style={{ marginTop: '1rem', textAlign: 'left' }}>
              {message}
            </div>
          )}

          <button
            onClick={() => fileRef.current.click()}
            className="btn btn-secondary btn-full"
            style={{ marginTop: '1.25rem' }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change profile picture'}
          </button>
        </div>
      </div>
    </>
  )
}