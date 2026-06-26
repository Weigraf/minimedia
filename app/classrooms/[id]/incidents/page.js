'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { RaindropIcon, CaterpillarIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function IncidentsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [profile, setProfile]       = useState(null)
  const [classroom, setClassroom]   = useState(null)
  const [children, setChildren]     = useState([])
  const [incidents, setIncidents]   = useState([])
  const [form, setForm]             = useState({
    child_id: '', occurred_at: '', location: '',
    description: '', action_taken: '', parent_notified: false,
  })
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

      const teacher = p.role === 'admin' || mem?.role === 'classroom_admin'
      if (!teacher) { router.push('/dashboard'); return }

      const { data: ch } = await supabase
        .from('children').select('id, name').eq('classroom_id', id).order('name')

      const { data: inc } = await supabase
        .from('incident_reports')
        .select('*, children(name), profiles(full_name)')
        .eq('classroom_id', id)
        .order('occurred_at', { ascending: false })

      const defaultChild = ch?.length ? ch[0].id : ''
      const defaultTime = new Date().toISOString().slice(0, 16)

      setProfile(p)
      setClassroom(cls)
      setChildren(ch || [])
      setIncidents(inc || [])
      setForm(f => ({ ...f, child_id: defaultChild, occurred_at: defaultTime }))
    }
    load()
  }, [id])

  async function submit(e) {
    e.preventDefault()
    if (!form.child_id || !form.description.trim() || !form.action_taken.trim()) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error: err } = await supabase
      .from('incident_reports')
      .insert({
        child_id: form.child_id,
        classroom_id: id,
        occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
        location: form.location.trim() || null,
        description: form.description.trim(),
        action_taken: form.action_taken.trim(),
        parent_notified: form.parent_notified,
        reported_by: session.user.id,
      })
      .select('*, children(name), profiles(full_name)')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    setIncidents(prev => [data, ...prev])
    setForm(f => ({
      child_id: children[0]?.id || '',
      occurred_at: new Date().toISOString().slice(0, 16),
      location: '', description: '', action_taken: '', parent_notified: false,
    }))
    setSaving(false)
  }

  async function deleteIncident(incId) {
    const supabase = createClient()
    await supabase.from('incident_reports').delete().eq('id', incId)
    setIncidents(prev => prev.filter(i => i.id !== incId))
    setConfirmDelete(null)
  }

  if (!profile) return <PageLoader message="Loading incidents…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <RaindropIcon size={44} />
          <div>
            <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← {classroom?.name}</a>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', lineHeight: 1.2 }}>Incident Reports</h1>
          </div>
        </div>

        {/* Log new incident */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>Log an incident</div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <div>
                <label htmlFor="incident-child" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Student *</label>
                <select
                  id="incident-child"
                  value={form.child_id}
                  onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))}
                  required
                  style={{ width: '100%', borderRadius: '50px', fontSize: '0.875rem', padding: '7px 14px', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
                >
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="incident-when" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>When *</label>
                <input
                  id="incident-when"
                  type="datetime-local"
                  value={form.occurred_at}
                  onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))}
                  required
                  style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.875rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="incident-location" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Location</label>
              <input
                id="incident-location"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. playground, classroom, hallway"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="incident-description" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>What happened *</label>
              <textarea
                id="incident-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the incident clearly and factually…"
                rows={3}
                required
                style={{ width: '100%', borderRadius: '12px', padding: '8px 12px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            </div>

            <div>
              <label htmlFor="incident-action" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Action taken *</label>
              <textarea
                id="incident-action"
                value={form.action_taken}
                onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))}
                placeholder="How was the incident addressed? First aid given? Who was informed?"
                rows={3}
                required
                style={{ width: '100%', borderRadius: '12px', padding: '8px 12px', fontSize: '0.9375rem', fontFamily: 'var(--font)', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="parent-notified"
                checked={form.parent_notified}
                onChange={e => setForm(f => ({ ...f, parent_notified: e.target.checked }))}
              />
              <label htmlFor="parent-notified" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                Parent / guardian has been notified
              </label>
            </div>

            {error && <div className="flash-error">{error}</div>}

            <div>
              <button type="submit" className="btn btn-primary" disabled={saving || !form.description.trim() || !form.action_taken.trim()}>
                {saving ? 'Saving…' : 'Save incident report'}
              </button>
            </div>
          </form>
        </div>

        {/* Incident history */}
        <div className="section-title" style={{ marginBottom: '0.75rem' }}>
          Incident history ({incidents.length})
        </div>

        {incidents.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <RaindropIcon size={44} />
            <p style={{ fontWeight: 700, marginTop: '0.75rem', color: 'var(--text-primary)' }}>No incidents on record</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Use the form above to log one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map(inc => (
              <div key={inc.id} className="card" style={{ borderLeft: '4px solid var(--amber-honey)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{inc.children?.name}</span>
                      {inc.parent_notified && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--green-whisper)', border: '1px solid var(--green-sage)', borderRadius: '50px', padding: '1px 8px', color: 'var(--green-forest)', fontWeight: 700 }}>
                          Parent notified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(inc.occurred_at)}
                      {inc.location && ` · ${inc.location}`}
                      {inc.profiles?.full_name && ` · Reported by ${inc.profiles.full_name}`}
                    </div>
                  </div>
                  {confirmDelete === inc.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delete?</span>
                      <button onClick={() => deleteIncident(inc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', padding: '10px 8px', fontFamily: 'var(--font)', minHeight: '44px' }}>Yes</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 8px', fontFamily: 'var(--font)', minHeight: '44px' }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(inc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 8px', fontFamily: 'var(--font)', flexShrink: 0, minHeight: '44px' }}>
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>WHAT HAPPENED</div>
                  <p style={{ fontSize: '0.9375rem', margin: 0, lineHeight: 1.5 }}>{inc.description}</p>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>ACTION TAKEN</div>
                  <p style={{ fontSize: '0.9375rem', margin: 0, lineHeight: 1.5 }}>{inc.action_taken}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
