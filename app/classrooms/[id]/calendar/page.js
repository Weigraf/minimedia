'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SnailIcon, LeafIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(t) {
  if (!t) return ''
  const [h, min] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(min).padStart(2, '0')} ${period}`
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function CalendarPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [profile, setProfile]       = useState(null)
  const [classroom, setClassroom]   = useState(null)
  const [isTeacher, setIsTeacher]   = useState(false)
  const [events, setEvents]         = useState([])
  const [viewDate, setViewDate]     = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ title: '', description: '', event_date: '', start_time: '', end_time: '', all_day: true })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

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

      if (p.role !== 'admin' && (!mem || !mem.approved)) { router.push('/dashboard'); return }

      setProfile(p)
      setClassroom(cls)
      setIsTeacher(p.role === 'admin' || mem?.role === 'classroom_admin')
    }
    load()
  }, [id])

  useEffect(() => {
    if (!id || !profile) return
    async function loadEvents() {
      const supabase = createClient()
      const start = monthKey(viewDate) + '-01'
      const endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
      const end = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('classroom_id', id)
        .gte('event_date', start)
        .lte('event_date', end)
        .order('event_date')
      setEvents(data || [])
    }
    loadEvents()
  }, [viewDate, profile, id])

  function prevMonth() {
    setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  }
  function nextMonth() {
    setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })
  }

  async function createEvent(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.event_date) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error: err } = await supabase
      .from('events')
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        start_time: form.all_day ? null : (form.start_time || null),
        end_time: form.all_day ? null : (form.end_time || null),
        all_day: form.all_day,
        classroom_id: id,
        created_by: session.user.id,
      })
      .select().single()
    if (err) { setError(err.message); setSaving(false); return }
    setEvents(prev => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)))
    setForm({ title: '', description: '', event_date: '', start_time: '', end_time: '', all_day: true })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteEvent(eventId) {
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(prev => prev.filter(e => e.id !== eventId))
    setConfirmDelete(null)
  }

  if (!profile) return <PageLoader message="Loading calendar…" />

  // Group by date
  const grouped = events.reduce((acc, ev) => {
    if (!acc[ev.event_date]) acc[ev.event_date] = []
    acc[ev.event_date].push(ev)
    return acc
  }, {})

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <SnailIcon size={44} />
          <div>
            <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← {classroom?.name}</a>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', lineHeight: 1.2 }}>Calendar</h1>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={prevMonth} className="btn btn-ghost" aria-label="Previous month" style={{ fontSize: '1rem', padding: '6px 14px' }}>←</button>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--green-forest)', minWidth: '160px', textAlign: 'center' }}>
            {monthLabel(viewDate)}
          </span>
          <button onClick={nextMonth} className="btn btn-ghost" aria-label="Next month" style={{ fontSize: '1rem', padding: '6px 14px' }}>→</button>
          {isTeacher && (
            <button onClick={() => setShowForm(v => !v)} className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
              {showForm ? 'Cancel' : '+ Add event'}
            </button>
          )}
        </div>

        {/* Create event form */}
        {showForm && isTeacher && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-title" style={{ marginBottom: '1rem' }}>New event</div>
            <form onSubmit={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label htmlFor="event-title" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Title *</label>
                <input
                  id="event-title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Field trip, picture day, parent night…"
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label htmlFor="event-date" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Date *</label>
                <input
                  id="event-date"
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  required
                  style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="all-day"
                  checked={form.all_day}
                  onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
                />
                <label htmlFor="all-day" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>All day</label>
              </div>
              {!form.all_day && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <label htmlFor="event-start-time" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Start time</label>
                    <input
                      id="event-start-time"
                      type="time"
                      value={form.start_time}
                      onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="event-end-time" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>End time</label>
                    <input
                      id="event-end-time"
                      type="time"
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="event-description" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Description (optional)</label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details, location, what to bring…"
                  rows={2}
                  style={{ width: '100%', borderRadius: '12px', padding: '8px 12px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
              {error && <div className="flash-error">{error}</div>}
              <div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding…' : 'Add event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Event list */}
        {Object.keys(grouped).length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <SnailIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>No events this month</p>
            {isTeacher && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Use "Add event" to schedule something.</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.entries(grouped).map(([date, evs]) => (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <LeafIcon size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--green-forest)' }}>{formatDate(date)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {evs.map(ev => (
                    <div key={ev.id} className="card" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{ev.title}</div>
                          {!ev.all_day && (ev.start_time || ev.end_time) && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}
                            </div>
                          )}
                          {ev.description && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', margin: '6px 0 0' }}>{ev.description}</p>
                          )}
                        </div>
                        {isTeacher && (
                          confirmDelete === ev.id ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remove?</span>
                              <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', padding: '10px 8px', fontFamily: 'var(--font)', minHeight: '44px' }}>Yes</button>
                              <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 8px', fontFamily: 'var(--font)', minHeight: '44px' }}>No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(ev.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 8px', fontFamily: 'var(--font)', flexShrink: 0, minHeight: '44px' }}
                            >
                              Remove
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
