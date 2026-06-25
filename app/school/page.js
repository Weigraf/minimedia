'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SproutIcon, LeafIcon, RaindropIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function MyTeachers() {
  const [profile, setProfile] = useState(null)
  const [school, setSchool] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function load() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!p || !p.approved) { router.push('/login'); return }

    // Must be a school admin
    const { data: sm } = await supabase
      .from('school_memberships').select('school_id, role')
      .eq('profile_id', session.user.id).eq('role', 'school_admin').single()
    if (!sm) { router.push('/dashboard'); return }

    setProfile(p)

    const { data: s } = await supabase.from('schools').select('*').eq('id', sm.school_id).single()
    setSchool(s)

    const { data: mems } = await supabase
      .from('school_memberships')
      .select('*, profiles(id, full_name, approved)')
      .eq('school_id', sm.school_id).eq('role', 'teacher')
    setTeachers(mems || [])

    const { data: invites } = await supabase
      .from('teacher_invites')
      .select('*').eq('school_id', sm.school_id).order('created_at', { ascending: false })
    setPendingInvites(invites || [])

    const { data: cls } = await supabase.from('classrooms').select('id, name').eq('school_id', sm.school_id).order('name')
    setClassrooms(cls || [])
  }

  useEffect(() => { load() }, [])

  async function inviteTeacher(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setMsg('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/invite-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error || 'Failed to send invite'); setInviting(false); return }
    setMsg('Invite sent to ' + inviteEmail)
    setInviteEmail('')
    setInviting(false)
    load()
  }

  async function revokeInvite(inviteId) {
    const supabase = createClient()
    await supabase.from('teacher_invites').delete().eq('id', inviteId)
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  if (!profile || !school) return <PageLoader message="Loading…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <SproutIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>{school.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>My Teachers</p>
          </div>
        </div>

        {msg && <div className="flash-info" role="status" style={{ marginBottom: '1rem' }}>{msg}</div>}

        {/* Invite teacher */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Invite a Teacher</div>
          <form onSubmit={inviteTeacher} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="teacher@email.com"
              style={{ flex: 1, minWidth: '220px' }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={inviting}>
              {inviting ? 'Sending…' : 'Send invite'}
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            The teacher will receive a magic-link invite to join {school.name}.
          </p>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Pending invites</div>
              {pendingInvites.map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{inv.email}</span>
                  <button onClick={() => revokeInvite(inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, padding: 0, fontFamily: 'var(--font)' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teacher roster */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Teachers ({teachers.length})</div>
          {teachers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No teachers yet. Invite one above.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teachers.map(t => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-alt)', border: '1px solid var(--card-border)' }}>
                  <span style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '50%', background: 'var(--green-whisper)', border: '2px solid var(--green-sage)', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--green-forest)', flexShrink: 0 }}>
                    {t.profiles?.full_name?.charAt(0)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t.profiles?.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Teacher</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* School classrooms */}
        {classrooms.length > 0 && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Classrooms ({classrooms.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {classrooms.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LeafIcon size={16} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                  </div>
                  <a href={`/classrooms/${c.id}`} style={{ fontSize: '0.8125rem', color: 'var(--green-leaf)', fontWeight: 600, textDecoration: 'none' }}>Enter →</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
