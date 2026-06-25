'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SnailIcon } from '@/components/Icons'

export default function BrowseClassrooms() {
  const [profile, setProfile] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [memberships, setMemberships] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!p || !p.approved) { router.push('/login'); return }

      // Parents have no access to this page
      if (p.role === 'parent') { router.push('/dashboard'); return }

      setProfile(p)

      let classroomData = []
      if (p.role === 'admin') {
        const { data } = await supabase.from('classrooms').select('*').order('name')
        classroomData = data || []
      } else {
        // classroom_admin: only classrooms they administer
        const { data } = await supabase
          .from('memberships')
          .select('classroom_id, approved, role, classrooms(*)')
          .eq('profile_id', session.user.id)
          .eq('role', 'classroom_admin')
        classroomData = (data || []).filter(m => m.approved).map(m => m.classrooms)
      }

      const { data: mems } = await supabase
        .from('memberships').select('classroom_id, approved').eq('profile_id', session.user.id)

      setClassrooms(classroomData)
      setMemberships(mems || [])
      setLoading(false)
    }
    load()
  }, [])

  async function requestJoin(classroomId) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('memberships').insert({
      classroom_id: classroomId,
      profile_id: session.user.id,
      approved: false,
    })
    if (error) { setMessage('Error: ' + error.message); return }
    setMemberships(prev => [...prev, { classroom_id: classroomId, approved: false }])
    setMessage('Request sent!')
  }

  function membershipStatus(classroomId) {
    const m = memberships.find(m => m.classroom_id === classroomId)
    if (!m) return 'none'
    return m.approved ? 'approved' : 'pending'
  }

  if (loading || !profile) return null

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <SnailIcon size={40} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>
              {profile.role === 'admin' ? 'All Classrooms' : 'My Administered Classrooms'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {profile.role === 'admin'
                ? 'Manage and view all classrooms in the school.'
                : 'Classrooms where you are a teacher administrator.'}
            </p>
          </div>
        </div>

        {message && <div className="flash-info" role="status">{message}</div>}

        {classrooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No classrooms found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {classrooms.map(c => {
              const status = membershipStatus(c.id)
              return (
                <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {c.avatar_url
                      ? <img src={c.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--card-border)' }} />
                      : <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--lavender-light)', border: '2px solid var(--card-border)', flexShrink: 0 }} />
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      {c.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a href={`/classrooms/${c.id}`} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '7px 14px' }}>
                      Enter →
                    </a>
                    {profile.role === 'admin' && (
                      <a href={`/admin/classrooms/${c.id}/settings`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '7px 14px' }}>
                        Settings
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
