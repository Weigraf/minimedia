'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SproutIcon, LeafIcon, RaindropIcon, CaterpillarIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ManageSchool() {
  const [profile, setProfile] = useState(null)
  const [school, setSchool] = useState(null)
  const [members, setMembers] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [allClassrooms, setAllClassrooms] = useState([])
  const [assignClassroomId, setAssignClassroomId] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const { id } = useParams()

  async function load() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
    setProfile(p)

    const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
    if (!s) { router.push('/admin/schools'); return }
    setSchool(s)

    const { data: mems } = await supabase
      .from('school_memberships')
      .select('*, profiles(id, full_name, approved)')
      .eq('school_id', id)
      .order('role')
    setMembers(mems || [])

    const { data: cls } = await supabase.from('classrooms').select('*').eq('school_id', id).order('name')
    setClassrooms(cls || [])

    const { data: all } = await supabase.from('classrooms').select('id, name').is('school_id', null).order('name')
    setAllClassrooms(all || [])
  }

  useEffect(() => { load() }, [id])

  async function inviteAdmin(e) {
    e.preventDefault()
    if (!adminEmail.trim()) return
    setInviting(true)
    setMsg('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/schools/invite-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ schoolId: id, email: adminEmail.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error || 'Failed to send invite'); setInviting(false); return }
    setMsg('Invite sent to ' + adminEmail)
    setAdminEmail('')
    setInviting(false)
    load()
  }

  async function assignClassroom(e) {
    e.preventDefault()
    if (!assignClassroomId) return
    const supabase = createClient()
    const { error } = await supabase.from('classrooms').update({ school_id: id }).eq('id', assignClassroomId)
    if (!error) {
      setMsg('Classroom assigned.')
      setAssignClassroomId('')
      load()
    }
  }

  async function removeClassroom(classroomId) {
    const supabase = createClient()
    await supabase.from('classrooms').update({ school_id: null }).eq('id', classroomId)
    load()
  }

  async function removeMember(memberId) {
    const supabase = createClient()
    await supabase.from('school_memberships').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  if (!profile || !school) return <PageLoader message="Loading school…" />

  const schoolAdmin = members.find(m => m.role === 'school_admin')
  const teachers = members.filter(m => m.role === 'teacher')

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <a href="/admin/schools" style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← Schools</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1rem 0 1.75rem' }}>
          <SproutIcon size={40} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>{school.name}</h1>
            {school.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{school.description}</p>}
          </div>
        </div>

        {msg && <div className="flash-info" role="status" style={{ marginBottom: '1rem' }}>{msg}</div>}

        {/* School Admin */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>School Admin</div>
          {schoolAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-flex', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--lavender-light)', border: '2px solid #A888CC', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', color: 'var(--lavender-deep)' }}>
                  {schoolAdmin.profiles?.full_name?.charAt(0)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{schoolAdmin.profiles?.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>School Admin</div>
                </div>
              </div>
              <button onClick={() => removeMember(schoolAdmin.id)} className="btn btn-danger" style={{ fontSize: '0.8125rem', padding: '5px 10px' }}>Remove</button>
            </div>
          ) : (
            <form onSubmit={inviteAdmin} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="School admin email" style={{ flex: 1, minWidth: '200px' }} required />
              <button type="submit" className="btn btn-primary" disabled={inviting}>{inviting ? 'Sending…' : 'Send invite'}</button>
            </form>
          )}
        </div>

        {/* Classrooms */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Classrooms ({classrooms.length})</div>
          {classrooms.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
              {classrooms.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LeafIcon size={16} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{c.name}</span>
                  </div>
                  <button onClick={() => removeClassroom(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, padding: 0, fontFamily: 'var(--font)' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {allClassrooms.length > 0 && (
            <form onSubmit={assignClassroom} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select value={assignClassroomId} onChange={e => setAssignClassroomId(e.target.value)} style={{ flex: 1, minWidth: '160px', borderRadius: '50px' }}>
                <option value="">Assign a classroom…</option>
                {allClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="btn btn-secondary" disabled={!assignClassroomId}>Assign</button>
            </form>
          )}
          {allClassrooms.length === 0 && classrooms.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No unassigned classrooms available. <a href="/admin/classrooms/new">Create one →</a></p>
          )}
        </div>

        {/* Teachers */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Teachers ({teachers.length})</div>
          {teachers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {schoolAdmin ? 'The school admin can invite teachers from their dashboard.' : 'Assign a school admin first — they will invite teachers.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teachers.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'inline-flex', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--green-whisper)', border: '2px solid var(--green-sage)', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'var(--green-forest)' }}>
                      {t.profiles?.full_name?.charAt(0)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.profiles?.full_name}</span>
                  </div>
                  <button onClick={() => removeMember(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, padding: 0, fontFamily: 'var(--font)' }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
