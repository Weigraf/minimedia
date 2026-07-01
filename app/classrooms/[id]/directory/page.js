'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon, RaindropIcon, AcornIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

// SVG connector that draws a stem + horizontal branch + drop lines to each parent slot
function Connector({ count }) {
  if (count === 0) return null
  const h = 44
  const mid = 22
  const centers = Array.from({ length: count }, (_, i) => 100 * (i + 0.5) / count)

  if (count === 1) {
    return (
      <svg width="24" height={h} viewBox={`0 0 24 ${h}`} style={{ display: 'block', margin: '0 auto' }} aria-hidden="true">
        <line x1="12" y1="0" x2="12" y2={h} stroke="var(--green-mist)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="50" y1="0" x2="50" y2={mid} stroke="var(--green-mist)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={centers[0]} y1={mid} x2={centers[count - 1]} y2={mid} stroke="var(--green-mist)" strokeWidth="2.5" />
      {centers.map((cx, i) => (
        <line key={i} x1={cx} y1={mid} x2={cx} y2={h} stroke="var(--green-mist)" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  )
}

function ParentAvatar({ name, avatarUrl, size = 40 }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: '2.5px solid var(--green-mist)', flexShrink: 0,
      }} />
    )
  }
  return (
    <span style={{
      display: 'inline-flex', width: size, height: size, borderRadius: '50%',
      background: 'var(--lavender-light)', border: '2.5px solid var(--green-mist)',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38 + 'px', fontWeight: 800, color: 'var(--green-forest)',
      flexShrink: 0,
    }}>
      {name?.charAt(0)}
    </span>
  )
}

function FamilyUnit({ child, isSelected, onSelect, clickable, isTeacher, myChildIds }) {
  const familyParents = child.family_members
    ?.map(fm => fm.profiles)
    .filter(Boolean) ?? []

  return (
    // Outer bubble — gives each family its own contained "island"
    <div style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: '22px',
      padding: '1.25rem 1rem 1rem',
      boxShadow: '0 2px 12px -4px rgba(47,74,44,.08)',
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    }}>

      {/* Child node */}
      <button
        onClick={() => clickable && onSelect(child.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', textAlign: 'left', width: '100%',
          background: isSelected ? 'var(--yellow-glow)' : '#fffbf4',
          border: `2.5px solid ${isSelected ? 'var(--amber-acorn)' : 'var(--amber-honey)'}`,
          borderRadius: '16px',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
          boxShadow: isSelected
            ? '0 6px 18px -6px rgba(217,154,85,.5)'
            : '0 2px 10px -4px rgba(217,154,85,.25)',
          fontFamily: 'var(--font)',
        }}
        aria-pressed={isSelected}
      >
        <span style={{
          display: 'inline-flex', width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
          background: isSelected ? 'var(--amber-honey)' : 'var(--yellow-glow)',
          border: '2.5px solid var(--amber-honey)',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '1.125rem', fontWeight: 800, color: 'var(--amber-acorn)',
        }}>
          {child.name?.charAt(0)}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
            {child.name}
          </div>
          {isTeacher && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
              {child.medications && (
                <span style={{ fontSize: '0.6875rem', background: 'var(--lavender-light)', borderRadius: '50px', padding: '2px 8px', color: 'var(--green-forest)', fontWeight: 700, border: '1px solid var(--green-mist)' }}>Rx</span>
              )}
              {child.allergies && (
                <span style={{ fontSize: '0.6875rem', background: '#FFF3CD', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '2px 8px', color: 'var(--amber-acorn)', fontWeight: 700 }}>Allergy</span>
              )}
            </div>
          )}
          {!isTeacher && myChildIds.has(child.id) && (
            <div style={{ fontSize: '0.75rem', color: 'var(--green-leaf)', fontWeight: 700, marginTop: '3px' }}>View reports →</div>
          )}
        </div>
      </button>

      {/* Connector lines */}
      <Connector count={familyParents.length} />

      {/* Parent nodes */}
      {familyParents.length > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {familyParents.map(parent => (
            <div key={parent.id} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '6px', padding: '12px 8px',
              background: 'var(--lavender-light)',
              border: '1.5px solid var(--border)',
              borderRadius: '14px',
              minWidth: 0, textAlign: 'center',
            }}>
              <ParentAvatar name={parent.full_name} avatarUrl={parent.avatar_url} size={40} />
              <div style={{ minWidth: 0, width: '100%' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                  {parent.full_name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '1px' }}>Parent</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {familyParents.length === 0 && (
        <div style={{
          padding: '12px', border: '1.5px dashed var(--border)', borderRadius: '14px',
          fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center',
          lineHeight: 1.4,
        }}>
          No family linked yet
        </div>
      )}
    </div>
  )
}

export default function ClassroomDirectory() {
  const [profile, setProfile]         = useState(null)
  const [classroom, setClassroom]     = useState(null)
  const [isTeacher, setIsTeacher]     = useState(false)
  const [premium, setPremium]         = useState(false)
  const [allParentIds, setAllParentIds] = useState(new Set())
  const [students, setStudents]       = useState([])
  const [unlinkedParents, setUnlinkedParents] = useState([])
  const [myChildIds, setMyChildIds]   = useState(new Set())
  const [selectedId, setSelectedId]   = useState(null)
  const [reportCache, setReportCache] = useState({})
  const [loadingRep, setLoadingRep]   = useState(false)
  const [repTitle, setRepTitle]       = useState('')
  const [repContent, setRepContent]   = useState('')
  const [saving, setSaving]           = useState(false)
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

      // All approved parents in this classroom
      const { data: mems } = await supabase
        .from('memberships')
        .select('profile_id, role, profiles(id, full_name, avatar_url)')
        .eq('classroom_id', id).eq('approved', true)

      const parentMems = (mems || []).filter(m => m.role === 'parent').map(m => m.profiles).filter(Boolean)
      const parentIdSet = new Set(parentMems.map(p => p.id))
      setAllParentIds(parentIdSet)

      // Children with family members (profiles embedded)
      const childSelect = teacher
        ? 'id, name, medications, allergies, family_members(profile_id, profiles(id, full_name, avatar_url))'
        : 'id, name, family_members(profile_id, profiles(id, full_name, avatar_url))'

      const { data: kids } = await supabase
        .from('children').select(childSelect).eq('classroom_id', id).order('name')
      setStudents(kids || [])

      // Parents not linked to any child in this classroom
      const linkedParentIds = new Set(
        (kids || []).flatMap(k => (k.family_members || []).map(fm => fm.profile_id))
      )
      setUnlinkedParents(parentMems.filter(p => !linkedParentIds.has(p.id)))

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
            Family Tree
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {isTeacher
              ? 'Students and their families. Click a student to view or add progress reports.'
              : 'Students and families in your classroom. Click your child to view their progress reports.'}
          </p>
        </div>

        {/* ── Family tree ────────────────────────────────────────────────── */}
        {students.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <CaterpillarIcon size={40} />
            <p style={{ marginTop: '0.75rem' }}>No students in this classroom yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
            {students.map(child => {
              const clickable = isTeacher || myChildIds.has(child.id)
              return (
                <FamilyUnit
                  key={child.id}
                  child={child}
                  isSelected={selectedId === child.id}
                  onSelect={selectStudent}
                  clickable={clickable}
                  isTeacher={isTeacher}
                  myChildIds={myChildIds}
                />
              )
            })}
          </div>
        )}

        {/* ── Progress report panel ─────────────────────────────────────── */}
        {selectedId && (
          <div className="card" style={{ marginTop: '1.5rem', borderTop: '3px solid var(--amber-honey)' }}>
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
                {isTeacher && (
                  <form onSubmit={saveReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--yellow-glow)', borderRadius: 'var(--radius)', border: '1.5px solid var(--amber-honey)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--amber-acorn)' }}>Add Report</div>
                    <input value={repTitle} onChange={e => setRepTitle(e.target.value)} placeholder="Report title (e.g. Spring 2025 Update)" required />
                    <textarea value={repContent} onChange={e => setRepContent(e.target.value)} placeholder="Write the progress report here…" rows={5} required style={{ resize: 'vertical' }} />
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                      {saving ? 'Saving…' : 'Save report'}
                    </button>
                  </form>
                )}

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

        {/* ── Unlinked parents ──────────────────────────────────────────── */}
        {unlinkedParents.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <RaindropIcon size={18} />
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Other Families
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: '6px' }}>({unlinkedParents.length})</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {unlinkedParents.map(parent => (
                <div key={parent.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  <ParentAvatar name={parent.full_name} avatarUrl={parent.avatar_url} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parent.full_name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '1px' }}>Parent</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
