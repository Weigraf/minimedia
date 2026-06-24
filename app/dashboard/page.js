'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SunIcon, LeafIcon, MushroomIcon, CaterpillarIcon } from '@/components/Icons'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!profile || !profile.approved) {
        await supabase.auth.signOut(); router.push('/login'); return
      }

      let classroomData = []
      if (profile.role === 'admin') {
        const { data } = await supabase.from('classrooms').select('*').order('created_at')
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

    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '12px' }}>
      <CaterpillarIcon size={48} />
      <p style={{ color: 'var(--text-muted)' }}>Loading your classrooms...</p>
    </div>
  )

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SunIcon size={36} />
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Welcome back, {profile.full_name.split(' ')[0]}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>Here are your classrooms</p>
            </div>
          </div>
          {profile.role === 'admin' && (
            <a href="/admin/classrooms/new" className="btn btn-primary">+ New classroom</a>
          )}
        </div>

        {profile.role === 'parent' && (
          <div className="flash-info" style={{ marginBottom: '1.5rem' }}>
            Not seeing your classroom? <a href="/classrooms" style={{ fontWeight: 600 }}>Browse and request to join →</a>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <MushroomIcon size={52} />
              <p style={{ fontWeight: 600, marginTop: '12px', marginBottom: '6px' }}>No classrooms yet</p>
              <p style={{ fontSize: '14px' }}>
                {profile.role === 'admin' ? 'Create your first classroom to get started.' : 'Ask your admin to add you to a classroom.'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {classrooms.map(c => (
              <a key={c.id} href={`/classrooms/${c.id}`} className="card" style={{ display: 'block', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--green-sprout)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LeafIcon size={32} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--green-forest)' }}>{c.name}</p>
                      {c.description && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.description}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', color: 'var(--green-sprout)' }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  )
}