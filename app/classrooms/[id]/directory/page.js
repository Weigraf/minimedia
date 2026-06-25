'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon, RaindropIcon, AcornIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

function Avatar({ name, avatarUrl, size = 40 }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: '2px solid var(--card-border)', flexShrink: 0,
      }} />
    )
  }
  return (
    <span style={{
      display: 'inline-flex', width: size, height: size, borderRadius: '50%',
      background: 'var(--lavender-light)', border: '2px solid #A888CC',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4 + 'px', fontWeight: 800, color: 'var(--lavender-deep)',
      flexShrink: 0,
    }}>
      {name?.charAt(0)}
    </span>
  )
}

export default function ClassroomDirectory() {
  const [profile, setProfile]             = useState(null)
  const [classroom, setClassroom]         = useState(null)
  const [isTeacher, setIsTeacher]         = useState(false)
  const [premium, setPremium]             = useState(false)
  const [parents, setParents]             = useState([])
  const [students, setStudents]           = useState([])
  const [myChildIds, setMyChildIds]       = useState(new Set())
  const [selectedId, setSelectedId]       = useState(null)
  const [reportCache, setReportCache]     = useState({})
  const [loadingRep, setLoadingRep]       = useState(false)
  const [repTitle, setRepTitle]           = useState('')
  const [repContent, setRepContent]       = useState('')
  const [saving, setSaving]               = useState(false)
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('memberships').select('role, approved')
        .eq('classroom_id', id).eq('profile_id', session.user.id).single()

      if (p.role !== 'admin' && (!membership || !membership.approved)) {
        router.push('/dashboard'); return
      }

      const teacher = p.role === 'admin' || membership?.role === 'classroom_admin'
      setProfile(p)
      setIsTeacher(teacher)

      const { data: settings } = await supabase.from('school_settings').select('subscription_status').single()
      setPremium(settings?.subscription_status === 'premium')

      const { data: cls } = await supabase.from('classrooms').select('id, name').eq('id', id).single()
      setClassroom(cls)

      const { data: mems } = await supabase
        .from('memberships')
        .select('profile_id, role, profiles(id, full_name, avatar_url)')
        .eq('classroom_id', id).eq('approved', true)

      const parentMembers = (mems || [])
        .filter(m => m.role === 'parent')
        .map(m => m.profiles).filter(Boolean)
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
      setParents(parentMembers)

      const studentQuery = teacher
        ? supabase.from('children').select('id, name, medications, allergies, family_members(profile_id)').eq('classroom_id', id).order('name')
        : supabase.from('children').select('id, name').eq('classroom_id', id).order('name')

      const { data: kids } = await studentQuery
      setStudents(kids || [])

      if (!teacher) {
        const { data: fm } = await supabase.from('family_members').select('child_id').eq('profile_id', session.user.id)
        setMyChildIds(new Set((fm || []).map(f => f.child_id)))
      }
    }
    load()
  }, [id])

  async function selectStudent(childId) {
    if (selectedId === childId) { setSelectedId(null); return }
    setSelectedId(childId)
    if (reportCache[childId]) return
    setLoadingRep(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('progress_reports')
      .select('*, profiles(full_name)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
    setReportCache(prev => ({ ...prev, [childId]: data || [] }))
    setLoadingRep(false)
  }

  async function saveReport(e) {
    e.preventDefault()
    if (!selectedId || !repTitle.trim() || !repContent.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('progress_reports')
      .insert({ child_id: selectedId, classroom_id: id, author_id: user.id, title: repTitle.trim(), content: repContent.trim() })
      .select('*, profiles(full_name)').single()
    if (!error) {
      setReportCache(prev => ({ ...prev, [selectedId]: [data, ...(prev[selectedId] || [])] }))
      setRepTitle('')
      setRepContent('')
    }
    setSaving(false)
  }

  async function deleteReport(reportId) {
    if (!confirm('Delete this report?')) return
    const supabase = createClient()
    await supabase.from('progress_reports').delete().eq('id', reportId)
    setReportCache(prev => ({
      ...prev,
      [selectedId]: (prev[selectedId] || []).filter(r => r.id !== reportId),
    }))
  }

  if (!profile || !classroom) return <PageLoader message="Loading directory…" />

  const otherParents = parents.filter(p => p.id !== profile.id)
  const selectedStudent = students.find(s => s.id === selectedId)
  const canViewReports = selectedId && (isTeacher || myChildIds.has(selectedId))

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>
            ← {classroom.name}
          </a>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginTop: '6px' }}>
            Classroom Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {isTeacher
              ? 'All students and families. Click a student to view or add progress reports.'
              : 'Students and other families. Click your child to view their progress reports.'}
          </p>
        </div>

        {/* ── Students ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <CaterpillarIcon size={20} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green-forest)' }}>
              Students <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>({students.length})</span>
            </span>
          </div>

          {students.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No students in this classroom yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
              {students.map(child => {
                const isSelected = selectedId === child.id
                const clickable = isTeacher || myChildIds.has(child.id)
                return (
                  <button
                    key={child.id}
                    onClick={() => clickable && selectStudent(child.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', textAlign: 'left', width: '100%',
                      background: isSelected ? 'var(--yellow-glow)' : 'var(--surface)',
                      border: isSelected ? '2px solid var(--amber-honey)' : '1.5px solid var(--card-border)',
                      borderRadius: 'var(--radius)', cursor: clickable ? 'pointer' : 'default',
                      transition: 'border-color 0.15s, background 0.15s',
                      fontFamily: 'var(--font)',
                    }}
                    aria-pressed={isSelected}
                  >
                    <span style={{
                      display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                      background: isSelected ? 'var(--amber-honey)' : 'var(--yellow-glow)',
                      border: '2px solid var(--amber-honey)',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 800, color: 'var(--amber-acorn)',
                    }}>
                      {child.name?.charAt(0)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                        {child.name}
                      </div>
                      {isTeacher && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {child.medications && (
                            <span style={{ fontSize: '0.6875rem', background: 'var(--lavender-light)', borderRadius: '50px', padding: '1px 6px', color: 'var(--lavender-deep)', fontWeight: 700 }}>Rx</span>
                          )}
                          {child.allergies && (
                            <span style={{ fontSize: '0.6875rem', background: '#FFF3CD', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '1px 6px', color: 'var(--amber-acorn)', fontWeight: 700 }}>Allergies</span>
                          )}
                          {!child.medications && !child.allergies && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {child.family_members?.length ?? 0} parent{child.family_members?.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                      {!isTeacher && myChildIds.has(child.id) && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--green-leaf)', fontWeight: 700, marginTop: '2px' }}>View reports →</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Report panel ───────────────────────────────────────────────── */}
          {selectedId && (
            <div className="card" style={{ marginTop: '1rem', borderTop: '3px solid var(--amber-honey)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--green-forest)' }}>
                    {selectedStudent?.name} — Progress Reports
                  </div>
                  {isTeacher && (
                    <a href={`/admin/students/${selectedId}`} style={{ fontSize: '0.8125rem', color: 'var(--green-leaf)', fontWeight: 600, textDecoration: 'none' }}>
                      View full student record →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 4px' }}
                  aria-label="Close"
                >×</button>
              </div>

              {!canViewReports ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  You can only view reports for your own children.
                </div>
              ) : !premium ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <AcornIcon size={40} />
                  <p style={{ fontWeight: 700, marginTop: '0.75rem', color: 'var(--green-forest)' }}>Premium Feature</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 1rem' }}>Progress reports require a Premium subscription.</p>
                  <a href="/subscribe" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>View plans →</a>
                </div>
              ) : (
                <>
                  {/* Add report form — teachers only */}
                  {isTeacher && (
                    <form onSubmit={saveReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--yellow-glow)', borderRadius: 'var(--radius)', border: '1.5px solid var(--amber-honey)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--amber-acorn)' }}>Add Report</div>
                      <input
                        value={repTitle}
                        onChange={e => setRepTitle(e.target.value)}
                        placeholder="Report title (e.g. Spring 2025 Update)"
                        required
                      />
                      <textarea
                        value={repContent}
                        onChange={e => setRepContent(e.target.value)}
                        placeholder="Write the progress report here…"
                        rows={5}
                        required
                        style={{ resize: 'vertical' }}
                      />
                      <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                        {saving ? 'Saving…' : 'Save report'}
                      </button>
                    </form>
                  )}

                  {/* Reports list */}
                  {loadingRep ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading reports…</div>
                  ) : (reportCache[selectedId] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No reports yet for {selectedStudent?.name}.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {(reportCache[selectedId] || []).map(r => (
                        <div key={r.id} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                By {r.profiles?.full_name} · {new Date(r.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {isTeacher && (
                              <button onClick={() => deleteReport(r.id)} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '4px 10px', flexShrink: 0 }}>
                                Delete
                              </button>
                            )}
                          </div>
                          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-primary)', margin: 0 }}>
                            {r.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Parents ──────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <RaindropIcon size={20} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green-forest)' }}>
              {isTeacher ? 'Parents' : 'Other Families'}
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '6px' }}>
                ({isTeacher ? parents.length : otherParents.length})
              </span>
            </span>
          </div>

          {(isTeacher ? parents : otherParents).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isTeacher ? 'No approved parents yet.' : 'No other families in this classroom yet.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
              {(isTeacher ? parents : otherParents).map(parent => (
                <div key={parent.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
                  <Avatar name={parent.full_name} avatarUrl={parent.avatar_url} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {parent.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Parent</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
