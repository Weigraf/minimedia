'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SnailIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function Approvals() {
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminClassroomIds, setAdminClassroomIds] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingMemberships, setPendingMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadData(adminFlag, classroomIds) {
    const supabase = createClient()

    if (adminFlag) {
      // Global admin: see all pending users + all pending membership requests
      const { data: users } = await supabase
        .from('profiles').select('*').eq('approved', false)
      const { data: memberships } = await supabase
        .from('memberships')
        .select('*, profiles(full_name, avatar_url), classrooms(name)')
        .eq('approved', false)
      setPendingUsers(users || [])
      setPendingMemberships(memberships || [])
    } else {
      // Classroom admin: only pending joins for their classrooms
      const { data: memberships } = await supabase
        .from('memberships')
        .select('*, profiles(full_name, avatar_url), classrooms(name)')
        .eq('approved', false)
        .in('classroom_id', classroomIds)
      setPendingMemberships(memberships || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }

      const adminFlag = p.role === 'admin'
      let classroomIds = []

      if (!adminFlag) {
        // Check if they admin any classrooms
        const { data: adminMems } = await supabase
          .from('memberships')
          .select('classroom_id')
          .eq('profile_id', session.user.id)
          .eq('role', 'classroom_admin')
          .eq('approved', true)
        classroomIds = (adminMems || []).map(m => m.classroom_id)
        if (classroomIds.length === 0) { router.push('/dashboard'); return }
      }

      setProfile(p)
      setIsAdmin(adminFlag)
      setAdminClassroomIds(classroomIds)
      loadData(adminFlag, classroomIds)
    }
    load()
  }, [])

  async function approveUser(id) {
    const supabase = createClient()
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    loadData(isAdmin, adminClassroomIds)
  }

  async function approveMembership(id) {
    const supabase = createClient()
    await supabase.from('memberships').update({ approved: true }).eq('id', id)
    loadData(isAdmin, adminClassroomIds)
  }

  if (loading) return <PageLoader message="Loading approvals…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <a href="/dashboard" style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to dashboard</a>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '1rem 0 1.5rem' }}>Pending Approvals</h1>

        {/* New users — admin only */}
        {isAdmin && (
          <>
            <h2 className="section-title">New users ({pendingUsers.length})</h2>
            {pendingUsers.length === 0 ? (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="empty-state">
                  <SnailIcon size={40} />
                  <p style={{ marginTop: '10px' }}>No pending users</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px', marginBottom: '2rem' }}>
                {pendingUsers.map(u => (
                  <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-whisper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--green-forest)' }}>
                          {u.full_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '15px' }}>{u.full_name}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role}</p>
                      </div>
                    </div>
                    <button onClick={() => approveUser(u.id)} className="btn btn-primary">
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <h2 className="section-title">Classroom join requests ({pendingMemberships.length})</h2>
        {pendingMemberships.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <SnailIcon size={40} />
              <p style={{ marginTop: '10px' }}>No pending requests</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {pendingMemberships.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.profiles?.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-whisper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--green-forest)' }}>
                      {m.profiles?.full_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px' }}>{m.profiles?.full_name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      wants to join <strong>{m.classrooms?.name}</strong>
                    </p>
                  </div>
                </div>
                <button onClick={() => approveMembership(m.id)} className="btn btn-primary">
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
