'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(session) {
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || !profile.approved) {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      let classroomData = []
      if (profile.role === 'admin') {
        const { data } = await supabase
          .from('classrooms')
          .select('*')
          .order('created_at')
        classroomData = data || []
      } else {
        const { data } = await supabase
          .from('memberships')
          .select('classroom_id, approved, classrooms(*)')
          .eq('profile_id', session.user.id)
        classroomData = (data || []).filter(m => m.approved).map(m => m.classrooms)
      }

      setProfile(profile)
      setClassrooms(classroomData)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { loadProfile(session) }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading...</p>

  return (
    <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Welcome, {profile.full_name}</h1>
          <p style={{ margin: '4px 0 0', color: '#666', textTransform: 'capitalize' }}>{profile.role}</p>
        </div>
        <button onClick={handleSignOut}
          style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', background: 'white' }}>
          Sign out
        </button>
      </div>

      {profile.role === 'admin' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
          <a href="/admin/classrooms/new"
            style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>
            + New Classroom
          </a>
          <a href="/admin/approvals"
            style={{ padding: '10px 20px', background: 'white', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>
            Pending Approvals
          </a>
        </div>
      )}

      {profile.role === 'parent' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="/classrooms"
            style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>
            Browse Classrooms
          </a>
        </div>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem' }}>Your Classrooms</h2>
        {classrooms.length === 0 ? (
          <p style={{ color: '#666' }}>No classrooms yet.</p>
        ) : (
          classrooms.map(c => (
            <a key={c.id} href={`/classrooms/${c.id}`}
              style={{ display: 'block', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px', textDecoration: 'none', color: 'inherit' }}>
              <strong>{c.name}</strong>
              {c.description && <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{c.description}</p>}
            </a>
          ))
        )}
      </div>
    </main>
  )
}