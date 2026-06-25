'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function MyChildren() {
  const [profile, setProfile] = useState(null)
  const [children, setChildren] = useState([])
  const [photoUrls, setPhotoUrls] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [healthForms, setHealthForms] = useState({})
  const [uploading, setUploading] = useState(null)
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState('')
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

      // Fetch signed URLs for child photos
      const urls = {}
      for (const child of kids) {
        if (child.photo_url) {
          const { data: signed } = await supabase.storage.from('child-photos').createSignedUrl(child.photo_url, 3600)
          if (signed?.signedUrl) urls[child.id] = signed.signedUrl
        }
      }
      setPhotoUrls(urls)
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
      setExpandedId(null)
    }
    setSaving(null)
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
              const isExpanded = expandedId === child.id
              const form = healthForms[child.id] || { medications: '', allergies: '' }
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

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : child.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                      >
                        {isExpanded ? 'Close' : 'Health info'}
                      </button>
                      {child.classrooms && (
                        <a href={`/classrooms/${child.classrooms.id}/reports?child=${child.id}`} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
                          Reports
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Expandable health info */}
                  {isExpanded && (
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

                  {/* Read-only summary when collapsed */}
                  {!isExpanded && (child.medications || child.allergies) && (
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
