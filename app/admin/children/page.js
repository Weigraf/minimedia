'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function ChildrenAdmin() {
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [classrooms, setClassrooms] = useState([])
  const [children, setChildren] = useState([])
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
        ? supabase.from('children').select('id, name, classroom_id, medications, allergies, classrooms(name), family_members(profile_id)').order('name')
        : supabase.from('children').select('id, name, classroom_id, medications, allergies, classrooms(name), family_members(profile_id)').in('classroom_id', myClassroomIds).order('name')

      const [{ data: cls }, { data: ch }] = await Promise.all([classroomQuery, childrenQuery])
      setClassrooms(cls ?? [])
      setChildren(ch ?? [])
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
      .select('id, name, classroom_id, medications, allergies, classrooms(name), family_members(profile_id)')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    setChildren(prev => [...prev, data])
    setName('')
    setSaving(false)
  }

  if (!profile) return <PageLoader message="Loading children…" />

  const grouped = classrooms.map(c => ({
    ...c,
    kids: children.filter(ch => ch.classroom_id === c.id),
  }))

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <CaterpillarIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>Children</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isAdmin ? 'All children across the school.' : 'Children in your classroom.'}
            </p>
          </div>
        </div>

        {/* Add child */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="section-title">Add a child</div>
          <form onSubmit={addChild} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
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
              {saving ? 'Adding…' : 'Add child'}
            </button>
          </form>
          {error && <div className="flash-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>

        {/* Children grouped by classroom */}
        {grouped.map(group => (
          <div key={group.id} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <LeafIcon size={18} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--green-forest)' }}>{group.name}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>({group.kids.length})</span>
            </div>

            {group.kids.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No children in this classroom yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.kids.map(child => (
                  <div key={child.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.125rem', fontWeight: 800, color: 'var(--amber-acorn)',
                    }}>
                      {child.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{child.name}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {child.family_members?.length ?? 0} parent{child.family_members?.length !== 1 ? 's' : ''}
                        </span>
                        {child.medications && (
                          <span style={{ fontSize: '0.75rem', background: 'var(--lavender-light)', borderRadius: '50px', padding: '1px 7px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Rx
                          </span>
                        )}
                        {child.allergies && (
                          <span style={{ fontSize: '0.75rem', background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '1px 7px', color: 'var(--amber-acorn)', fontWeight: 600 }}>
                            Allergies
                          </span>
                        )}
                      </div>
                    </div>
                    <a href={`/admin/children/${child.id}`} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '7px 14px', flexShrink: 0 }}>
                      Manage →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {children.length === 0 && classrooms.length > 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <CaterpillarIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>No children yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Use the form above to add a child.</p>
          </div>
        )}
      </div>
    </>
  )
}
