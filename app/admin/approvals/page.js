'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SnailIcon, CaterpillarIcon } from '@/components/Icons'

export default function Approvals() {
  const [profile, setProfile] = useState(null)
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingMemberships, setPendingMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadData() {
    const supabase = createClient()
    const { data: users } = await supabase
      .from('profiles').select('*').eq('approved', false)
    const { data: memberships } = await supabase
      .from('memberships')
      .select('*, profiles(full_name, avatar_url), classrooms(name)')
      .eq('approved', false)
    setPendingUsers(users || [])
    setPendingMemberships(memberships || [])
    setLoading(false)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(profile)
      loadData()
    }
    load()
  }, [])

  async function approveUser(id) {
    const supabase = createClient()
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    loadData()
  }

  async function approveMembership(id) {
    const supabase = createClient()
    await supabase.from('memberships').update({ approved: true }).eq('id', id)
    loadData()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '12px' }}>
      <CaterpillarIcon size={48} />
      <p style={{ color: 'var(--text-muted)' }}>Loading approvals...</p>
    </div>
  )

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <a href="/dashboard" style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to dashboard</a>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '1rem 0 1.5rem' }}>Pending Approvals</h1>

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