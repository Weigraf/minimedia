'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { AcornIcon, MushroomIcon, LeafIcon, MessageIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ClassroomPage() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [posts, setPosts] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [postImageFile, setPostImageFile] = useState(null)
  const [postImagePreview, setPostImagePreview] = useState(null)
  const [imageError, setImageError] = useState('')
  const [isClassroomAdmin, setIsClassroomAdmin] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const imageInputRef = useRef()
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

      if (!profile || !profile.approved) {
        await supabase.auth.signOut(); router.push('/login'); return
      }

      const { data: membership } = await supabase
        .from('memberships')
        .select('role, approved')
        .eq('classroom_id', id)
        .eq('profile_id', session.user.id)
        .single()

      if (profile.role !== 'admin') {
        if (!membership || !membership.approved) {
          router.push('/dashboard'); return
        }
      }

      setIsClassroomAdmin(membership?.role === 'classroom_admin')

      const { data: classroom } = await supabase
        .from('classrooms').select('*').eq('id', id).single()

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(full_name, avatar_url)')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false })

      const { data: files } = await supabase
        .from('files')
        .select('*, profiles(full_name)')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false })

      setProfile(profile)
      setClassroom(classroom)
      setPosts(posts || [])
      setFiles(files || [])
      setLoading(false)
    }

    load()
  }, [id])

  async function validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const fileExt = file.name.split('.').pop().toLowerCase()

    if (file.name.split('.').length > 2)
      return 'File name must not contain multiple extensions.'
    if (!allowedTypes.includes(file.type))
      return 'Only JPG, PNG, and WebP images are allowed.'
    if (!allowedExtensions.includes(fileExt))
      return 'Only .jpg, .jpeg, .png, and .webp files are allowed.'
    if (file.size > 5 * 1024 * 1024)
      return 'Image must be under 5MB.'

    const header = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(new Uint8Array(reader.result))
      reader.readAsArrayBuffer(file.slice(0, 4))
    })

    const isJpeg = header[0] === 0xFF && header[1] === 0xD8
    const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
    const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46

    if (!isJpeg && !isPng && !isWebp)
      return 'File does not appear to be a valid image.'

    return null
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageError('')
    const err = await validateImage(file)
    if (err) {
      setImageError(err)
      e.target.value = ''
      return
    }
    setPostImageFile(file)
    setPostImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setPostImageFile(null)
    setPostImagePreview(null)
    setImageError('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!newPost.trim() && !postImageFile) return
    setPosting(true)

    const supabase = createClient()
    let image_url = null

    if (postImageFile) {
      const fileExt = postImageFile.name.split('.').pop().toLowerCase()
      const filePath = `${id}/${Date.now()}-${profile.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, postImageFile, { contentType: postImageFile.type })

      if (uploadError) {
        setImageError('Image upload failed: ' + uploadError.message)
        setPosting(false)
        return
      }

      const { data: signedUrlData, error: signError } = await supabase.storage
        .from('post-images')
        .createSignedUrl(filePath, 365 * 24 * 60 * 60)

      if (signError || !signedUrlData?.signedUrl) {
        setImageError('Could not generate image URL. Please try again.')
        setPosting(false)
        return
      }

      image_url = signedUrlData.signedUrl
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ classroom_id: id, author_id: profile.id, content: newPost.trim(), image_url })
      .select('*, profiles(full_name, avatar_url)')
      .single()

    if (!error) {
      setPosts(prev => [data, ...prev])
      setNewPost('')
      clearImage()
      // Fire notification in background — don't block UI on email delivery
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetch('/api/notify/new-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ postId: data.id }),
          }).catch(() => {})
        }
      })
    }
    setPosting(false)
  }

  function handleEditStart(post) {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setConfirmingDeleteId(null)
  }

  function handleEditCancel() {
    setEditingPostId(null)
    setEditContent('')
  }

  async function handleEditSave(postId) {
    if (!editContent.trim()) return
    setSavingEdit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent.trim() })
      .eq('id', postId)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent.trim() } : p))
      setEditingPostId(null)
      setEditContent('')
    }
    setSavingEdit(false)
  }

  async function handleDelete(postId) {
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
      setConfirmingDeleteId(null)
    }
  }

  function canEdit(post) {
    return profile?.id === post.author_id
  }

  function canDelete(post) {
    return profile?.id === post.author_id || profile?.role === 'admin' || isClassroomAdmin
  }

  if (loading) return <PageLoader message="Loading classroom…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {classroom.avatar_url ? (
              <img src={classroom.avatar_url} alt=""
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green-sage)' }} />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--green-whisper)', border: '3px solid var(--green-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LeafIcon size={32} />
              </div>
            )}
            <div>
              <a href="/dashboard" style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← Dashboard</a>
              <h1 style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px' }}>{classroom.name}</h1>
              {classroom.description && <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>{classroom.description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={`/classrooms/${id}/messages`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              <MessageIcon size={16} /> Messages
            </a>
            <a href={`/classrooms/${id}/reports`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              📋 Reports
            </a>
            {(profile.role === 'admin' || isClassroomAdmin) && (
              <>
                <a href={`/classrooms/${id}/files/upload`} className="btn btn-secondary">
                  <AcornIcon size={18} /> Upload file
                </a>
                <a href={`/admin/classrooms/${id}/settings`} className="btn btn-ghost">
                  Settings
                </a>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p className="section-title">Post an update</p>
          <form onSubmit={handlePost}>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Share something with the class..."
              rows={3}
              style={{ marginBottom: '10px' }}
            />

            {postImagePreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                <img
                  src={postImagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', display: 'block', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                    width: '24px', height: '24px', cursor: 'pointer',
                    color: '#fff', fontSize: '14px', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )}

            {imageError && (
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '8px' }}>{imageError}</p>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="submit" disabled={posting || (!newPost.trim() && !postImageFile)} className="btn btn-primary">
                {posting ? 'Posting...' : 'Post update'}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="btn btn-ghost"
                style={{ fontSize: '13px' }}
              >
                {postImageFile ? '📷 Change photo' : '📷 Add photo'}
              </button>
            </div>
          </form>
        </div>

        {files.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <p className="section-title">Files & documents</p>
            {files.map(f => (
              <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AcornIcon size={22} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-forest)' }}>{f.name}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.profiles?.full_name}</span>
              </a>
            ))}
          </div>
        )}

        <div>
          <p className="section-title">Updates</p>
          {posts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <MushroomIcon size={48} />
                <p style={{ fontWeight: 600, marginTop: '12px' }}>No posts yet</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Be the first to share something!</p>
              </div>
            </div>
          ) : (
            posts.map(p => (
              <div key={p.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {p.profiles?.avatar_url ? (
                      <img src={p.profiles.avatar_url} alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-whisper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--green-forest)' }}>
                        {p.profiles?.full_name?.charAt(0)}
                      </div>
                    )}
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-forest)' }}>{p.profiles?.full_name}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {editingPostId !== p.id && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {canEdit(p) && confirmingDeleteId !== p.id && (
                          <button
                            onClick={() => handleEditStart(p)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--green-leaf)', padding: 0, fontFamily: 'inherit' }}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(p) && confirmingDeleteId !== p.id && (
                          <button
                            onClick={() => { setConfirmingDeleteId(p.id); setEditingPostId(null) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--danger)', padding: 0, fontFamily: 'inherit' }}
                          >
                            Delete
                          </button>
                        )}
                        {confirmingDeleteId === p.id && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remove post?</span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--danger)', padding: 0, fontFamily: 'inherit' }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', padding: 0, fontFamily: 'inherit' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {editingPostId === p.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                      style={{ marginBottom: '8px' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditSave(p.id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '6px 16px' }}
                      >
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="btn btn-ghost"
                        style={{ fontSize: '13px', padding: '6px 16px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.content && (
                      <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: p.image_url ? '10px' : 0 }}>
                        {p.content}
                      </p>
                    )}
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={`Photo shared by ${p.profiles?.full_name || 'a member'}`}
                        style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                      />
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </>
  )
}
