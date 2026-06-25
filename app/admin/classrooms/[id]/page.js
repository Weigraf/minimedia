'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { AcornIcon, MushroomIcon, LeafIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ClassroomPage() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [posts, setPosts] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [isClassroomAdmin, setIsClassroomAdmin] = useState(false)
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

  async function handlePost(e) {
    e.preventDefault()
    if (!newPost.trim()) return
    setPosting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('posts')
      .insert({ classroom_id: id, author_id: profile.id, content: newPost })
      .select('*, profiles(full_name, avatar_url)')
      .single()
    if (!error) { setPosts(prev => [data, ...prev]); setNewPost('') }
    setPosting(false)
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
          <div style={{ display: 'flex', gap: '8px' }}>
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
            <button type="submit" disabled={posting || !newPost.trim()} className="btn btn-primary">
              {posting ? 'Posting...' : 'Post update'}
            </button>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{p.content}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  )
}