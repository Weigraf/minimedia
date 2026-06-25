'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ChildrenAdmin() {
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [classrooms, setClassrooms] = useState([])
  const [children, setChildren] = useState([])
  const [parents, setParents] = useState([])
  const [name, setName] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!p || !p.approved) { router.push('/dashboard'); return }

      const adminFlag = p.role === 'admin'
      let myClassroomIds = []

      if (!adminFlag) {
        const { data: adminMems } = await supabase
          .from('memberships')
          .select('classroom_id')
          .eq('profile_id', user.id)
          .eq('role', 'classroom_admin')
          .eq('approved', true)
        myClassroomIds = (adminMems || []).map(m => m.classroom_id)
        if (myClassroomIds.length === 0) { router.push('/dashboard'); return }
      }

      setProfile(p)
      setIsAdmin(adminFlag)

      const classroomQuery = adminFlag
        ? supabase.from('classrooms').select('id, name').order('name')
        : supabase.from('classrooms').select('id, name').in('id', myClassroomIds).order('name')

      const childrenQuery = adminFlag
        ? supabase.from('children').select('*, classrooms(name), family_members(profile_id, profiles(full_name))').order('name')
        : supabase.from('children').select('*, classrooms(name), family_members(profile_id, profiles(full_name))').in('classroom_id', myClassroomIds).order('name')

      const [{ data: cls }, { data: ch }, { data: profs }] = await Promise.all([
        classroomQuery,
        childrenQuery,
        supabase.from('profiles').select('id, full_name').eq('role', 'parent').eq('approved', true).order('full_name'),
      ])

      setClassrooms(cls ?? [])
      setChildren(ch ?? [])
      setParents(profs ?? [])
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

  if (!profile) return <PageLoader message="Loading children…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <CaterpillarIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>Children</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isAdmin
                ? 'Manage all children and family assignments across the school.'
                : 'Manage children in your classroom and assign family members.'}
            </p>
          </div>
        </div>

        {/* Add child */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Add a child</div>
          <form onSubmit={addChild} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label htmlFor="child-name" className="visually-hidden">Child's name</label>
            <input
              id="child-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Child's name"
              style={{ flex: 1, minWidth: '160px' }}
              required
            />
            <label htmlFor="child-classroom" className="visually-hidden">Classroom</label>
            <select
              id="child-classroom"
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
          {error && <div className="flash-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>

        {/* Children list */}
        {children.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <CaterpillarIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>No children yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Use the form above to add a child to a classroom.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {children.map(child => (
              <div key={child.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber-acorn)',
                    }}>
                      {child.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{child.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>{child.classrooms?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <a
                      href={`/classrooms/${child.classroom_id}/reports?child=${child.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                    >
                      Reports
                    </a>
                    <button
                      onClick={() => deleteChild(child.id)}
                      className="btn btn-danger"
                      style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Family members
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {(child.family_members?.length ?? 0) === 0 && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>None assigned</span>
                  )}
                  {child.family_members?.map(f => (
                    <span key={f.profile_id} style={{
                      background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)',
                      borderRadius: '50px', padding: '3px 10px', fontSize: '0.8125rem',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {f.profiles?.full_name}
                      <button
                        onClick={() => removeFamily(child.id, f.profile_id)}
                        aria-label={`Remove ${f.profiles?.full_name}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, fontSize: '0.875rem', lineHeight: 1 }}
                      >×</button>
                    </span>
                  ))}
                </div>

                <label htmlFor={`assign-${child.id}`} className="visually-hidden">Assign a parent to {child.name}</label>
                <select
                  id={`assign-${child.id}`}
                  defaultValue=""
                  onChange={e => { if (e.target.value) assignParent(child.id, e.target.value); e.target.value = '' }}
                  style={{ borderRadius: '50px', fontSize: '0.8125rem', width: 'auto', padding: '6px 14px' }}
                >
                  <option value="">+ Assign a parent…</option>
                  {parents
                    .filter(par => !child.family_members?.some(f => f.profile_id === par.id))
                    .map(par => <option key={par.id} value={par.id}>{par.full_name}</option>)
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
