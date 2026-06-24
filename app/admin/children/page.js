'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { AcornIcon } from '@/components/Icons'

export default function ChildrenAdmin() {
  const [profile, setProfile] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [children, setChildren] = useState([])
  const [parents, setParents] = useState([])
  const [premium, setPremium] = useState(false)
  const [name, setName] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const [{ data: cls }, { data: ch }, { data: profs }, { data: settings }] = await Promise.all([
        supabase.from('classrooms').select('id, name').order('name'),
        supabase.from('children').select('*, classrooms(name), family_members(profile_id, profiles(full_name))').order('name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'parent').eq('approved', true).order('full_name'),
        supabase.from('school_settings').select('subscription_status').single(),
      ])
      setClassrooms(cls ?? [])
      setChildren(ch ?? [])
      setParents(profs ?? [])
      setPremium(settings?.subscription_status === 'premium')
      if (cls?.length) setClassroomId(cls[0].id)
    }
    load()
  }, [])

  async function addChild(e) {
    e.preventDefault()
    if (!name.trim() || !classroomId) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('children')
      .insert({ name: name.trim(), classroom_id: classroomId })
      .select('*, classrooms(name), family_members(profile_id, profiles(full_name))')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    setChildren(prev => [...prev, data])
    setName('')
    setSaving(false)
  }

  async function assignParent(childId, parentId) {
    const supabase = createClient()
    await supabase.from('family_members').upsert({ child_id: childId, profile_id: parentId })
    const { data } = await supabase
      .from('children')
      .select('*, classrooms(name), family_members(profile_id, profiles(full_name))')
      .eq('id', childId)
      .single()
    setChildren(prev => prev.map(c => c.id === childId ? data : c))
  }

  async function removeFamily(childId, parentId) {
    const supabase = createClient()
    await supabase.from('family_members').delete().eq('child_id', childId).eq('profile_id', parentId)
    setChildren(prev => prev.map(c =>
      c.id === childId
        ? { ...c, family_members: c.family_members.filter(f => f.profile_id !== parentId) }
        : c
    ))
  }

  async function deleteChild(childId) {
    if (!confirm('Delete this child and all their records?')) return
    const supabase = createClient()
    await supabase.from('children').delete().eq('id', childId)
    setChildren(prev => prev.filter(c => c.id !== childId))
  }

  if (!premium) {
    return (
      <>
        <Navbar profile={profile} />
        <div className="page-sm" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <AcornIcon size={52} />
          <h2 style={{ marginTop: '1rem', color: 'var(--green-forest)' }}>Premium Feature</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem' }}>
            Children profiles and progress reports require a Premium subscription.
          </p>
          <a href="/subscribe" className="btn btn-primary">View plans →</a>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '0.25rem' }}>Children</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
          Manage children and assign family members for private progress reports.
        </p>

        {/* Add child */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Add a child</div>
          <form onSubmit={addChild} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Child's name"
              style={{ flex: 1, minWidth: '160px' }}
              required
            />
            <select
              value={classroomId}
              onChange={e => setClassroomId(e.target.value)}
              style={{ flex: 1, minWidth: '140px', borderRadius: '50px' }}
            >
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add'}
            </button>
          </form>
          {error && <div className="flash-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>

        {/* Children list */}
        {children.length === 0 ? (
          <div className="empty-state">No children added yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {children.map(child => (
              <div key={child.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{child.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{child.classrooms?.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a href={`/classrooms/${child.classroom_id}/reports?child=${child.id}`}
                       className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
                      Reports
                    </a>
                    <button onClick={() => deleteChild(child.id)} className="btn btn-danger" style={{ fontSize: '13px', padding: '6px 14px' }}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Assigned family */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Family members
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {child.family_members?.length === 0 && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None assigned</span>
                  )}
                  {child.family_members?.map(f => (
                    <span key={f.profile_id} style={{
                      background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)',
                      borderRadius: '50px', padding: '3px 10px', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {f.profiles?.full_name}
                      <button onClick={() => removeFamily(child.id, f.profile_id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: 0, fontSize: '14px', lineHeight: 1,
                      }}>×</button>
                    </span>
                  ))}
                </div>

                {/* Assign dropdown */}
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) assignParent(child.id, e.target.value); e.target.value = '' }}
                  style={{ borderRadius: '50px', fontSize: '13px', width: 'auto', padding: '6px 14px' }}
                >
                  <option value="">+ Assign a parent…</option>
                  {parents
                    .filter(p => !child.family_members?.some(f => f.profile_id === p.id))
                    .map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)
                  }
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
