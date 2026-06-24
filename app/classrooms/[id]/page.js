'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ClassroomPage() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [posts, setPosts] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
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

      if (profile.role !== 'admin') {
        const { data: membership } = await supabase
          .from('memberships')
          .select('approved')
          .eq('classroom_id', id)
          .eq('profile_id', session.user.id)
          .single()

        if (!membership || !membership.approved) {
          router.push('/dashboard'); return
        }
      }

      const { data: classroom } = await supabase
        .from('classrooms').select('*').eq('id', id).single()

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(full_name)')
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
      .select('*, profiles(full_name)')
      .single()

    if (!error) { setPosts(prev => [data, ...prev]); setNewPost('') }
    setPosting(false)
  }

  if (loading) return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading...</p>

  return (
    <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <a href="/dashboard" style={{ color: '#4F46E5', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
          <h1 style={{ margin: '4px 0 0' }}>{classroom.name}</h1>
          {classroom.description && <p style={{ margin: '4px 0 0', color: '#666' }}>{classroom.description}</p>}
        </div>
        {profile.role === 'admin' && (
          <a href={`/classrooms/${id}/files/upload`}
            style={{ padding: '8px 16px', background: '#4F46E5', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
            + Upload File
          </a>
        )}
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '16px' }}>Post an update</h2>
        <form onSubmit={handlePost}>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share something with the class..."
            rows={3}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '8px', fontFamily: 'sans-serif' }}
          />
          <button type="submit" disabled={posting || !newPost.trim()}
            style={{ padding: '8px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: posting || !newPost.trim() ? 0.5 : 1 }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>

      {files.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '16px' }}>Files & Documents</h2>
          {files.map(f => (
            <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px', textDecoration: 'none', color: 'inherit' }}>
              <span>📄 {f.name}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>{f.profiles?.full_name}</span>
            </a>
          ))}
        </div>
      )}

      <div>
        <h2 style={{ margin: '0 0 1rem', fontSize: '16px' }}>Updates</h2>
        {posts.length === 0 ? (
          <p style={{ color: '#666' }}>No posts yet — be the first to share something!</p>
        ) : (
          posts.map(p => (
            <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>{p.profiles?.full_name}</strong>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.6' }}>{p.content}</p>
            </div>
          ))
        )}
      </div>

    </main>
  )
}