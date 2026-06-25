'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { LeafIcon, MessageIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ClassroomSettings() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [members, setMembers] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!profile || !profile.approved) { router.push('/login'); return }

      const { data: membershipData } = await supabase
        .from('memberships')
        .select('role')
        .eq('classroom_id', id)
        .eq('profile_id', session.user.id)
        .single()

      if (profile.role !== 'admin' && membershipData?.role !== 'classroom_admin') {
        router.push('/dashboard'); return
      }

      const { data: classroom } = await supabase
        .from('classrooms').select('*').eq('id', id).single()

      const { data: members } = await supabase
        .from('memberships')
        .select('*, profiles(id, full_name, avatar_url)')
        .eq('classroom_id', id)
        .eq('approved', true)

      setProfile(profile)
      setClassroom(classroom)
      setMembers(members || [])
      setName(classroom.name)
      setDescription(classroom.description || '')
      setPreview(classroom.avatar_url)
    }
    load()
  }, [id])

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const fileExt = file.name.split('.').pop().toLowerCase()
    const nameParts = file.name.split('.')

    if (nameParts.length > 2) {
      setMessage('File name must not contain multiple extensions.')
      e.target.value = ''; return
    }
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPG, PNG, and WebP images are allowed.')
      e.target.value = ''; return
    }
    if (!allowedExtensions.includes(fileExt)) {
      setMessage('Only .jpg, .jpeg, .png, and .webp files are allowed.')
      e.target.value = ''; return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image must be under 2MB.')
      e.target.value = ''; return
    }

    const header = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(new Uint8Array(reader.result))
      reader.readAsArrayBuffer(file.slice(0, 4))
    })

    const isJpeg = header[0] === 0xFF && header[1] === 0xD8
    const isPng  = header[0] === 0x89 && header[1] === 0x50
    const isWebp = header[0] === 0x52 && header[1] === 0x49

    if (!isJpeg && !isPng && !isWebp) {
      setMessage('File does not appear to be a valid image.')
      e.target.value = ''; return
    }

    setUploading(true)
    setMessage('')
    const supabase = createClient()
    const filePath = `${id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('classroom-avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setMessage('Upload error: ' + uploadError.message)
      setUploading(false); return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('classroom-avatars')
      .getPublicUrl(filePath)

    const urlWithBust = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('classrooms')
      .update({ avatar_url: urlWithBust })
      .eq('id', id)

    if (dbError) {
      setMessage('Save error: ' + dbError.message)
      setUploading(false); return
    }

    setPreview(urlWithBust)
    setClassroom(prev => ({ ...prev, avatar_url: urlWithBust }))
    setMessage('Classroom photo updated!')
    setUploading(false)
    e.target.value = ''
  }

  async function handleSaveDetails(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase
      .from('classrooms')
      .update({ name, description })
      .eq('id', id)
    setSaving(false)
    setMessage(error ? 'Error: ' + error.message : 'Classroom details saved!')
  }

  async function handleRoleChange(memberId, newRole) {
    const supabase = createClient()
    const { error } = await supabase
      .from('memberships')
      .update({ role: newRole })
      .eq('id', memberId)
    if (error) { setMessage('Error: ' + error.message); return }
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    setMessage('Role updated!')
  }

  if (!profile || !classroom) return <PageLoader message="Loading settings…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to classroom</a>
          <a href={`/classrooms/${id}/messages`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <MessageIcon size={16} /> Messages
          </a>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 1.5rem' }}>Classroom Settings</h1>

        {message && (
          <div className={message.startsWith('Error') ? 'flash-error' : 'flash-info'} style={{ marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem' }}>
          <p className="section-title" style={{ textAlign: 'left' }}>Classroom photo</p>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
            {preview ? (
              <img src={preview} alt="Classroom"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green-sage)' }} />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--green-whisper)', border: '3px solid var(--green-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <LeafIcon size={48} />
              </div>
            )}
            <button
              onClick={() => fileRef.current.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderRadius: '50%', background: 'var(--green-leaf)', border: '2px solid var(--bg)', color: '#EAF3DE', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              aria-label="Change classroom photo">
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
          <br />
          <button onClick={() => fileRef.current.click()} className="btn btn-secondary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Change classroom photo'}
          </button>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <p className="section-title">Classroom details</p>
          <form onSubmit={handleSaveDetails}>
            <div className="form-group">
              <label>Classroom name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save details'}
            </button>
          </form>
        </div>

        <div className="card">
          <p className="section-title">Member roles</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Classroom admins can post, upload files, and approve join requests for this classroom only.
          </p>
          {members.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No approved members yet.</p>
          ) : (
            members.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.profiles?.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-whisper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--green-forest)' }}>
                      {m.profiles?.full_name?.charAt(0)}
                    </div>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{m.profiles?.full_name}</span>
                </div>
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  style={{ width: 'auto', padding: '6px 12px', borderRadius: '50px', fontSize: '13px', fontWeight: 600 }}>
                  <option value="parent">Parent</option>
                  <option value="classroom_admin">Classroom admin</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}