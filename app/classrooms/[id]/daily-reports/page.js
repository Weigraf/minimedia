'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SunIcon, LeafIcon, CaterpillarIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

const MOOD_OPTIONS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good',  emoji: '🙂', label: 'Good'  },
  { value: 'okay',  emoji: '😐', label: 'Okay'  },
  { value: 'fussy', emoji: '😢', label: 'Fussy' },
  { value: 'sick',  emoji: '🤒', label: 'Sick'  },
]

const MEAL_OPTIONS = [
  { value: 'all',          label: 'Ate all'     },
  { value: 'some',         label: 'Ate some'    },
  { value: 'little',       label: 'Ate little'  },
  { value: 'none',         label: 'None'        },
  { value: 'not_offered',  label: 'N/A'         },
]

function moodEmoji(v) { return MOOD_OPTIONS.find(m => m.value === v)?.emoji ?? '—' }
function mealLabel(v)  { return MEAL_OPTIONS.find(m => m.value === v)?.label  ?? '—' }

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm() {
  return { mood: '', breakfast: '', lunch: '', snack: '', nap_minutes: '', activities: '', notes: '' }
}

export default function DailyReportsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [profile, setProfile]         = useState(null)
  const [classroom, setClassroom]     = useState(null)
  const [isTeacher, setIsTeacher]     = useState(false)
  const [children, setChildren]       = useState([])
  const [myChildIds, setMyChildIds]   = useState(new Set())
  const [selectedDate, setSelectedDate] = useState(today())
  const [reports, setReports]         = useState({})   // child_id -> report row
  const [forms, setForms]             = useState({})   // child_id -> form values
  const [saving, setSaving]           = useState({})   // child_id -> bool
  const [saved, setSaved]             = useState({})   // child_id -> bool

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }

      const { data: cls } = await supabase.from('classrooms').select('id, name').eq('id', id).single()
      if (!cls) { router.push('/dashboard'); return }

      const { data: mem } = await supabase
        .from('memberships').select('role, approved')
        .eq('classroom_id', id).eq('profile_id', session.user.id).maybeSingle()

      const teacher = p.role === 'admin' || mem?.role === 'classroom_admin'

      if (!teacher) {
        if (!mem || !mem.approved) { router.push('/dashboard'); return }
      }

      setProfile(p)
      setClassroom(cls)
      setIsTeacher(teacher)

      const { data: ch } = await supabase
        .from('children').select('id, name').eq('classroom_id', id).order('name')
      setChildren(ch || [])

      if (!teacher) {
        const { data: fam } = await supabase
          .from('family_members').select('child_id')
          .eq('profile_id', session.user.id)
          .in('child_id', (ch || []).map(c => c.id))
        setMyChildIds(new Set((fam || []).map(f => f.child_id)))
      }

      setForms(Object.fromEntries((ch || []).map(c => [c.id, emptyForm()])))
    }
    load()
  }, [id])

  useEffect(() => {
    if (!id || !children.length) return
    async function loadReports() {
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('classroom_id', id)
        .eq('report_date', selectedDate)
      const map = {}
      const newForms = {}
      for (const child of children) {
        const r = (data || []).find(d => d.child_id === child.id)
        map[child.id] = r || null
        newForms[child.id] = r ? {
          mood: r.mood || '',
          breakfast: r.breakfast || '',
          lunch: r.lunch || '',
          snack: r.snack || '',
          nap_minutes: r.nap_minutes != null ? String(r.nap_minutes) : '',
          activities: r.activities || '',
          notes: r.notes || '',
        } : emptyForm()
      }
      setReports(map)
      setForms(newForms)
      setSaved({})
    }
    loadReports()
  }, [selectedDate, children, id])

  function setField(childId, field, value) {
    setForms(prev => ({ ...prev, [childId]: { ...prev[childId], [field]: value } }))
    setSaved(prev => ({ ...prev, [childId]: false }))
  }

  async function saveReport(childId) {
    setSaving(prev => ({ ...prev, [childId]: true }))
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const form = forms[childId]
    const payload = {
      child_id: childId,
      classroom_id: id,
      report_date: selectedDate,
      mood: form.mood || null,
      breakfast: form.breakfast || null,
      lunch: form.lunch || null,
      snack: form.snack || null,
      nap_minutes: form.nap_minutes !== '' ? parseInt(form.nap_minutes, 10) : null,
      activities: form.activities.trim() || null,
      notes: form.notes.trim() || null,
      created_by: session.user.id,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('daily_reports')
      .upsert(payload, { onConflict: 'child_id,report_date' })
      .select().single()
    if (!error && data) setReports(prev => ({ ...prev, [childId]: data }))
    setSaving(prev => ({ ...prev, [childId]: false }))
    setSaved(prev => ({ ...prev, [childId]: !error }))
  }

  if (!profile) return <PageLoader message="Loading daily reports…" />

  const visibleChildren = isTeacher
    ? children
    : children.filter(c => myChildIds.has(c.id))

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <SunIcon size={44} />
          <div>
            <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← {classroom?.name}</a>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', lineHeight: 1.2 }}>Daily Reports</h1>
          </div>
        </div>

        {/* Date selector */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor="report-date" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Date</label>
          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={today()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
          <button className="btn btn-ghost" style={{ fontSize: '0.8125rem' }} onClick={() => setSelectedDate(today())}>Today</button>
        </div>

        {visibleChildren.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <CaterpillarIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem' }}>No students to display</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              {isTeacher ? 'No students in this classroom yet.' : 'You have no children linked to this classroom.'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleChildren.map(child => {
            const form  = forms[child.id]  || emptyForm()
            const isSaving = saving[child.id]
            const isSaved  = saved[child.id]
            const report   = reports[child.id]

            if (!isTeacher) {
              // Parent view — read-only
              return (
                <div key={child.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--amber-acorn)', flexShrink: 0 }}>
                      {child.name?.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{child.name}</span>
                  </div>
                  {!report ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No report filed for this day yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {report.mood && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}>{moodEmoji(report.mood)}</span>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{MOOD_OPTIONS.find(m => m.value === report.mood)?.label}</span>
                        </div>
                      )}
                      {(report.breakfast || report.lunch || report.snack) && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {report.breakfast && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}><strong>Breakfast:</strong> {mealLabel(report.breakfast)}</span>}
                          {report.lunch     && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}><strong>Lunch:</strong> {mealLabel(report.lunch)}</span>}
                          {report.snack     && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}><strong>Snack:</strong> {mealLabel(report.snack)}</span>}
                        </div>
                      )}
                      {report.nap_minutes != null && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                          <strong>Nap:</strong> {report.nap_minutes} min
                        </p>
                      )}
                      {report.activities && (
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>Activities</div>
                          <p style={{ fontSize: '0.9375rem', margin: 0 }}>{report.activities}</p>
                        </div>
                      )}
                      {report.notes && (
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>Notes from teacher</div>
                          <p style={{ fontSize: '0.9375rem', margin: 0 }}>{report.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            // Teacher view — editable form
            return (
              <div key={child.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--amber-acorn)', flexShrink: 0 }}>
                    {child.name?.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>{child.name}</span>
                  {isSaved && <span style={{ fontSize: '0.8125rem', color: 'var(--green-leaf)', fontWeight: 700 }}>Saved ✓</span>}
                </div>

                {/* Mood */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Mood</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {MOOD_OPTIONS.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setField(child.id, 'mood', form.mood === m.value ? '' : m.value)}
                        style={{
                          border: `2px solid ${form.mood === m.value ? 'var(--green-leaf)' : 'var(--card-border)'}`,
                          background: form.mood === m.value ? 'var(--green-whisper)' : 'var(--surface)',
                          borderRadius: '50px', padding: '5px 12px', cursor: 'pointer',
                          fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font)',
                          display: 'flex', alignItems: 'center', gap: '5px',
                          color: form.mood === m.value ? 'var(--green-forest)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{m.emoji}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Meals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['breakfast', 'lunch', 'snack'].map(meal => (
                      <div key={meal}>
                        <label htmlFor={`${meal}-${child.id}`} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'capitalize' }}>{meal}</label>
                        <select
                          id={`${meal}-${child.id}`}
                          value={form[meal]}
                          onChange={e => setField(child.id, meal, e.target.value)}
                          style={{ width: '100%', borderRadius: '10px', fontSize: '0.8125rem', padding: '6px 10px', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
                        >
                          <option value="">—</option>
                          {MEAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nap */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor={`nap-${child.id}`} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nap (minutes)</label>
                  <input
                    id={`nap-${child.id}`}
                    type="number"
                    min="0"
                    max="360"
                    placeholder="e.g. 60"
                    value={form.nap_minutes}
                    onChange={e => setField(child.id, 'nap_minutes', e.target.value)}
                    style={{ width: '120px', borderRadius: '10px', fontSize: '0.9375rem', padding: '6px 12px', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
                  />
                </div>

                {/* Activities */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor={`activities-${child.id}`} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Activities</label>
                  <textarea
                    id={`activities-${child.id}`}
                    value={form.activities}
                    onChange={e => setField(child.id, 'activities', e.target.value)}
                    placeholder="What did we do today?"
                    rows={2}
                    style={{ width: '100%', borderRadius: '12px', padding: '8px 12px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor={`notes-${child.id}`} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes for parents</label>
                  <textarea
                    id={`notes-${child.id}`}
                    value={form.notes}
                    onChange={e => setField(child.id, 'notes', e.target.value)}
                    placeholder="Anything else to share?"
                    rows={2}
                    style={{ width: '100%', borderRadius: '12px', padding: '8px 12px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={() => saveReport(child.id)}
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ fontSize: '0.875rem' }}
                >
                  {isSaving ? 'Saving…' : report ? 'Update report' : 'Save report'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
