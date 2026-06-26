'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon, SunIcon, SquirrelIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MOOD_OPTIONS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good',  emoji: '🙂', label: 'Good'  },
  { value: 'okay',  emoji: '😐', label: 'Okay'  },
  { value: 'fussy', emoji: '😢', label: 'Fussy' },
  { value: 'sick',  emoji: '🤒', label: 'Sick'  },
]

function moodEmoji(v) { return MOOD_OPTIONS.find(m => m.value === v)?.emoji ?? '' }
function moodLabel(v) { return MOOD_OPTIONS.find(m => m.value === v)?.label ?? '' }
function mealLabel(v) {
  const map = { all: 'Ate all', some: 'Ate some', little: 'Ate little', none: 'None', not_offered: 'N/A' }
  return map[v] ?? '—'
}
function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function MyChildren() {
  const [profile, setProfile]       = useState(null)
  const [children, setChildren]     = useState([])
  const [photoUrls, setPhotoUrls]   = useState({})
  const [healthForms, setHealthForms] = useState({})
  const [uploading, setUploading]   = useState(null)
  const [saving, setSaving]         = useState(null)
  const [msg, setMsg]               = useState('')

  // Section expand state: null or child.id
  const [expandedHealth, setExpandedHealth]   = useState(null)
  const [expandedReport, setExpandedReport]   = useState(null)
  const [expandedPickups, setExpandedPickups] = useState(null)

  // Data
  const [dailyReports, setDailyReports]   = useState({})  // child_id -> report
  const [pickups, setPickups]             = useState({})   // child_id -> [pickup]
  const [pickupForms, setPickupForms]     = useState({})   // child_id -> form
  const [savingPickup, setSavingPickup]   = useState(null)
  const [addingPickup, setAddingPickup]   = useState(null) // child_id or null

  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }
      if (p.role !== 'parent') { router.push('/dashboard'); return }

      setProfile(p)

      const { data: familyLinks } = await supabase
        .from('family_members')
        .select('children(*, classrooms(id, name, avatar_url))')
        .eq('profile_id', session.user.id)

      const kids = (familyLinks || []).map(f => f.children).filter(Boolean)
      setChildren(kids)
      setHealthForms(Object.fromEntries(kids.map(c => [c.id, { medications: c.medications || '', allergies: c.allergies || '' }])))
      setPickupForms(Object.fromEntries(kids.map(c => [c.id, { name: '', relationship: '', phone: '', notes: '' }])))

      // Signed photos
      const urls = {}
      for (const child of kids) {
        if (child.photo_url) {
          const { data: signed } = await supabase.storage.from('child-photos').createSignedUrl(child.photo_url, 3600)
          if (signed?.signedUrl) urls[child.id] = signed.signedUrl
        }
      }
      setPhotoUrls(urls)

      // Today's daily reports
      if (kids.length) {
        const { data: reports } = await supabase
          .from('daily_reports')
          .select('*')
          .in('child_id', kids.map(c => c.id))
          .eq('report_date', todayStr())
        const reportMap = {}
        for (const r of (reports || [])) reportMap[r.child_id] = r
        setDailyReports(reportMap)
      }

      // Authorized pickups
      if (kids.length) {
        const { data: pus } = await supabase
          .from('authorized_pickups')
          .select('*')
          .in('child_id', kids.map(c => c.id))
          .order('created_at')
        const puMap = {}
        for (const pu of (pus || [])) {
          if (!puMap[pu.child_id]) puMap[pu.child_id] = []
          puMap[pu.child_id].push(pu)
        }
        setPickups(puMap)
      }
    }
    load()
  }, [])

  async function uploadPhoto(childId, e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_IMG_TYPES.includes(file.type)) { setMsg('Only JPG, PNG, or WebP images allowed.'); return }
    const nameParts = file.name.split('.')
    if (nameParts.length > 2) { setMsg('File name must not contain multiple extensions.'); return }
    const ext = nameParts.pop().toLowerCase()
    if (file.size > 3 * 1024 * 1024) { setMsg('Image must be under 3 MB.'); return }

    setUploading(childId)
    setMsg('')
    const supabase = createClient()
    const path = `${childId}/photo.${ext}`
    const { error: upErr } = await supabase.storage.from('child-photos').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setMsg('Upload failed: ' + upErr.message); setUploading(null); return }

    await supabase.from('children').update({ photo_url: path }).eq('id', childId)
    const { data: signed } = await supabase.storage.from('child-photos').createSignedUrl(path, 3600)
    if (signed?.signedUrl) setPhotoUrls(prev => ({ ...prev, [childId]: signed.signedUrl }))
    setChildren(prev => prev.map(c => c.id === childId ? { ...c, photo_url: path } : c))
    setMsg('Photo updated!')
    setUploading(null)
    e.target.value = ''
  }

  async function saveHealth(childId) {
    setSaving(childId)
    setMsg('')
    const supabase = createClient()
    const form = healthForms[childId]
    const { error } = await supabase.from('children').update({
      medications: form.medications.trim() || null,
      allergies: form.allergies.trim() || null,
    }).eq('id', childId)
    if (error) { setMsg('Save failed: ' + error.message) } else {
      setChildren(prev => prev.map(c => c.id === childId ? { ...c, ...form } : c))
      setMsg('Health info saved.')
      setExpandedHealth(null)
    }
    setSaving(null)
  }

  async function savePickup(childId, e) {
    e.preventDefault()
    const form = pickupForms[childId]
    if (!form.name.trim()) return
    setSavingPickup(childId)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error: err } = await supabase
      .from('authorized_pickups')
      .insert({
        child_id: childId,
        name: form.name.trim(),
        relationship: form.relationship.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
        added_by: session.user.id,
      })
      .select().single()
    if (!err && data) {
      setPickups(prev => ({ ...prev, [childId]: [...(prev[childId] || []), data] }))
      setPickupForms(prev => ({ ...prev, [childId]: { name: '', relationship: '', phone: '', notes: '' } }))
      setAddingPickup(null)
    }
    setSavingPickup(null)
  }

  async function removePickup(childId, pickupId) {
    const supabase = createClient()
    await supabase.from('authorized_pickups').delete().eq('id', pickupId)
    setPickups(prev => ({ ...prev, [childId]: (prev[childId] || []).filter(p => p.id !== pickupId) }))
  }

  if (!profile) return <PageLoader />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <CaterpillarIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>My Children</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Profiles managed by the school for each of your children.
            </p>
          </div>
        </div>

        {msg && <div className="flash-info" role="status" style={{ marginBottom: '1rem' }}>{msg}</div>}

        {children.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <CaterpillarIcon size={56} />
            <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '1rem', color: 'var(--text-primary)' }}>
              No children linked yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Your teacher will set up your child's profile and send you an invite.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {children.map(child => {
              const form          = healthForms[child.id] || { medications: '', allergies: '' }
              const report        = dailyReports[child.id]
              const childPickups  = pickups[child.id] || []
              const puForm        = pickupForms[child.id] || { name: '', relationship: '', phone: '', notes: '' }
              const isHealthOpen  = expandedHealth  === child.id
              const isReportOpen  = expandedReport  === child.id
              const isPickupsOpen = expandedPickups === child.id

              return (
                <div key={child.id} className="card">
                  {/* Child header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {photoUrls[child.id] ? (
                        <img src={photoUrls[child.id]} alt="" style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover', border: '3px solid var(--amber-honey)' }} />
                      ) : (
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '14px',
                          background: 'var(--yellow-glow)', border: '3px solid var(--amber-honey)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber-acorn)',
                        }}>
                          {child.name?.charAt(0)}
                        </div>
                      )}
                      <label style={{
                        position: 'absolute', bottom: -4, right: -4,
                        background: 'var(--green-leaf)', color: '#fff', borderRadius: '50%',
                        width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', fontSize: '13px',
                        border: '2px solid var(--surface)',
                      }}>
                        {uploading === child.id ? '…' : '↑'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => uploadPhoto(child.id, e)} style={{ display: 'none' }} />
                      </label>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)' }}>{child.name}</div>
                      {child.classrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                          <LeafIcon size={13} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{child.classrooms.name}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setExpandedHealth(isHealthOpen ? null : child.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem', padding: '5px 10px' }}
                      >
                        {isHealthOpen ? 'Close' : 'Health'}
                      </button>
                      <button
                        onClick={() => setExpandedReport(isReportOpen ? null : child.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <SunIcon size={14} />
                        {isReportOpen ? 'Close' : 'Today'}
                        {report && !isReportOpen && (
                          <span style={{ fontSize: '0.9375rem' }}>{moodEmoji(report.mood)}</span>
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedPickups(isPickupsOpen ? null : child.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <SquirrelIcon size={14} />
                        {isPickupsOpen ? 'Close' : `Pickups (${childPickups.length})`}
                      </button>
                    </div>
                  </div>

                  {/* Health info */}
                  {isHealthOpen && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        This information is visible to your child's teacher and school administrators.
                      </p>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>Medications</label>
                      <textarea
                        value={form.medications}
                        onChange={e => setHealthForms(prev => ({ ...prev, [child.id]: { ...prev[child.id], medications: e.target.value } }))}
                        placeholder="List any medications, dosage, and schedule…"
                        rows={3}
                        style={{ width: '100%', marginBottom: '1rem', borderRadius: '12px', padding: '10px 14px', fontFamily: 'var(--font)', fontSize: '0.9375rem', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                      />
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>Allergies</label>
                      <textarea
                        value={form.allergies}
                        onChange={e => setHealthForms(prev => ({ ...prev, [child.id]: { ...prev[child.id], allergies: e.target.value } }))}
                        placeholder="List any allergies and reactions…"
                        rows={3}
                        style={{ width: '100%', marginBottom: '1rem', borderRadius: '12px', padding: '10px 14px', fontFamily: 'var(--font)', fontSize: '0.9375rem', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                      />
                      <button onClick={() => saveHealth(child.id)} className="btn btn-primary" disabled={saving === child.id}>
                        {saving === child.id ? 'Saving…' : 'Save health info'}
                      </button>
                    </div>
                  )}

                  {/* Today's daily report */}
                  {isReportOpen && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                        <SunIcon size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--green-forest)' }}>Today's Report</span>
                        {child.classrooms && (
                          <a href={`/classrooms/${child.classrooms.id}/daily-reports`} style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--green-leaf)', fontWeight: 600 }}>
                            All reports →
                          </a>
                        )}
                      </div>
                      {!report ? (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No report filed yet today.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {report.mood && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '1.5rem' }}>{moodEmoji(report.mood)}</span>
                              <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{moodLabel(report.mood)}</span>
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
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>ACTIVITIES</div>
                              <p style={{ fontSize: '0.9375rem', margin: 0 }}>{report.activities}</p>
                            </div>
                          )}
                          {report.notes && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>FROM TEACHER</div>
                              <p style={{ fontSize: '0.9375rem', margin: 0 }}>{report.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Authorized Pickups */}
                  {isPickupsOpen && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                        <SquirrelIcon size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--green-forest)' }}>Authorized Pickups</span>
                        <button
                          onClick={() => setAddingPickup(addingPickup === child.id ? null : child.id)}
                          className="btn btn-ghost"
                          style={{ marginLeft: 'auto', fontSize: '0.8125rem', padding: '4px 10px' }}
                        >
                          {addingPickup === child.id ? 'Cancel' : '+ Add'}
                        </button>
                      </div>

                      {addingPickup === child.id && (
                        <form onSubmit={e => savePickup(child.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem', padding: '12px', background: 'var(--surface-raised)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                          <input
                            value={puForm.name}
                            onChange={e => setPickupForms(prev => ({ ...prev, [child.id]: { ...prev[child.id], name: e.target.value } }))}
                            placeholder="Full name *"
                            required
                            style={{ width: '100%' }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input
                              value={puForm.relationship}
                              onChange={e => setPickupForms(prev => ({ ...prev, [child.id]: { ...prev[child.id], relationship: e.target.value } }))}
                              placeholder="Relationship"
                              style={{ width: '100%' }}
                            />
                            <input
                              value={puForm.phone}
                              onChange={e => setPickupForms(prev => ({ ...prev, [child.id]: { ...prev[child.id], phone: e.target.value } }))}
                              placeholder="Phone"
                              style={{ width: '100%' }}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" disabled={savingPickup === child.id || !puForm.name.trim()} style={{ fontSize: '0.875rem', alignSelf: 'flex-start' }}>
                            {savingPickup === child.id ? 'Saving…' : 'Add pickup person'}
                          </button>
                        </form>
                      )}

                      {childPickups.length === 0 && addingPickup !== child.id ? (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          No authorized pickup persons yet. Add anyone who is approved to pick up {child.name}.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {childPickups.map(pu => (
                            <div key={pu.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--surface-raised)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{pu.name}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {pu.relationship && <span>{pu.relationship}</span>}
                                  {pu.phone && <span>{pu.phone}</span>}
                                </div>
                              </div>
                              <button onClick={() => removePickup(child.id, pu.id)} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '3px 8px', flexShrink: 0 }}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Health badges when collapsed */}
                  {!isHealthOpen && (child.medications || child.allergies) && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {child.medications && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--lavender-light)', borderRadius: '50px', padding: '2px 9px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rx on file</span>
                      )}
                      {child.allergies && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '2px 9px', color: 'var(--amber-acorn)', fontWeight: 600 }}>Allergies on file</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
