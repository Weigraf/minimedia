'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon, RaindropIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ChildDetail() {
  const params = useParams()
  const childId = params?.id
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [child, setChild] = useState(null)
  const [parents, setParents] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [allParents, setAllParents] = useState([])
  const [photoUrl, setPhotoUrl] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', medications: '', allergies: '' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [pickups, setPickups] = useState([])
  const [pickupForm, setPickupForm] = useState({ name: '', relationship: '', phone: '', notes: '' })
  const [addingPickup, setAddingPickup] = useState(false)
  const [savingPickup, setSavingPickup] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/dashboard'); return }

      const adminFlag = p.role === 'admin'
      if (!adminFlag) {
        // Verify classroom admin access to this child
        const { data: childCheck } = await supabase.from('children').select('classroom_id').eq('id', childId).single()
        if (!childCheck) { router.push('/dashboard'); return }
        const { data: mem } = await supabase.from('memberships').select('id').eq('profile_id', session.user.id).eq('classroom_id', childCheck.classroom_id).eq('role', 'classroom_admin').eq('approved', true).single()
        if (!mem) { router.push('/dashboard'); return }
      }

      setProfile(p)
      setIsAdmin(adminFlag)

      const { data: c } = await supabase
        .from('children')
        .select('*, classrooms(id, name), family_members(profile_id, profiles(full_name, avatar_url))')
        .eq('id', childId)
        .single()
      if (!c) { router.push('/admin/students'); return }

      setChild(c)
      setForm({ name: c.name, medications: c.medications || '', allergies: c.allergies || '' })
      setParents(c.family_members || [])

      // Load child photo if allowed (admins are blocked by storage RLS)
      if (!adminFlag && c.photo_url) {
        const { data: signed } = await supabase.storage.from('child-photos').createSignedUrl(c.photo_url, 3600)
        if (signed?.signedUrl) setPhotoUrl(signed.signedUrl)
      }

      const { data: invites } = await supabase.from('pending_invites').select('email, created_at').eq('child_id', childId)
      setPendingInvites(invites || [])

      const { data: ap } = await supabase.from('profiles').select('id, full_name').eq('role', 'parent').eq('approved', true).order('full_name')
      setAllParents(ap || [])

      const { data: pu } = await supabase.from('authorized_pickups').select('*').eq('child_id', childId).order('created_at')
      setPickups(pu || [])
    }
    load()
  }, [childId])

  async function saveDetails() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('children').update({
      name: form.name.trim(),
      medications: form.medications.trim() || null,
      allergies: form.allergies.trim() || null,
    }).eq('id', childId)
    if (error) { setMsg('Save failed: ' + error.message) } else {
      setChild(prev => ({ ...prev, ...form }))
      setEditing(false)
      setMsg('Saved.')
    }
    setSaving(false)
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_IMG_TYPES.includes(file.type)) { setMsg('Only JPG, PNG, or WebP images allowed.'); return }
    const nameParts = file.name.split('.')
    if (nameParts.length > 2) { setMsg('File name must not contain multiple extensions.'); return }
    const ext = nameParts.pop().toLowerCase()
    if (file.size > 3 * 1024 * 1024) { setMsg('Image must be under 3 MB.'); return }

    setUploading(true)
    setMsg('')
    const supabase = createClient()
    const path = `${childId}/photo.${ext}`
    const { error: upErr } = await supabase.storage.from('child-photos').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setMsg('Upload failed: ' + upErr.message); setUploading(false); return }

    await supabase.from('children').update({ photo_url: path }).eq('id', childId)
    const { data: signed } = await supabase.storage.from('child-photos').createSignedUrl(path, 3600)
    if (signed?.signedUrl) setPhotoUrl(signed.signedUrl)
    setChild(prev => ({ ...prev, photo_url: path }))
    setMsg('Photo updated.')
    setUploading(false)
  }

  async function assignParent(parentId) {
    const supabase = createClient()
    await supabase.from('family_members').upsert({ child_id: childId, profile_id: parentId })
    const par = allParents.find(p => p.id === parentId)
    if (par) setParents(prev => [...prev, { profile_id: par.id, profiles: { full_name: par.full_name, avatar_url: null } }])
  }

  async function removeParent(parentId) {
    const supabase = createClient()
    await supabase.from('family_members').delete().eq('child_id', childId).eq('profile_id', parentId)
    setParents(prev => prev.filter(p => p.profile_id !== parentId))
  }

  async function sendInvite(e) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/invite-parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ email: inviteEmail, child_id: childId, classroom_id: child.classroom_id }),
    })
    const json = await res.json()
    if (res.ok) {
      setInviteMsg(`Invite sent to ${inviteEmail}`)
      setPendingInvites(prev => [...prev, { email: inviteEmail, created_at: new Date().toISOString() }])
      setInviteEmail('')
    } else {
      setInviteMsg(json.error || 'Failed to send invite')
    }
    setInviting(false)
  }

  async function savePickup(e) {
    e.preventDefault()
    if (!pickupForm.name.trim()) return
    setSavingPickup(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error: err } = await supabase
      .from('authorized_pickups')
      .insert({
        child_id: childId,
        name: pickupForm.name.trim(),
        relationship: pickupForm.relationship.trim() || null,
        phone: pickupForm.phone.trim() || null,
        notes: pickupForm.notes.trim() || null,
        added_by: session.user.id,
      })
      .select().single()
    if (!err && data) {
      setPickups(prev => [...prev, data])
      setPickupForm({ name: '', relationship: '', phone: '', notes: '' })
      setAddingPickup(false)
    }
    setSavingPickup(false)
  }

  async function removePickup(pickupId) {
    const supabase = createClient()
    await supabase.from('authorized_pickups').delete().eq('id', pickupId)
    setPickups(prev => prev.filter(p => p.id !== pickupId))
  }

  if (!child || !profile) return <PageLoader message="Loading…" />

  const linkedParentIds = new Set(parents.map(p => p.profile_id))
  const pendingEmails = new Set(pendingInvites.map(i => i.email))

  return (
    <>
      <Navbar profile={profile} />
      <div className="page-sm">
        <a href="/admin/students" style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← All students</a>

        {msg && (
          <div className="flash-info" role="status" style={{ marginTop: '1rem' }}>{msg}</div>
        )}

        {/* Child header */}
        <div className="card" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', border: '3px solid var(--amber-honey)' }} />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '16px', flexShrink: 0,
                background: 'var(--yellow-glow)', border: '3px solid var(--amber-honey)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800, color: 'var(--amber-acorn)',
              }}>
                {child.name?.charAt(0)}
              </div>
            )}
            {/* Photo upload — teachers only, not admins */}
            {!isAdmin && (
              <label style={{
                position: 'absolute', bottom: -4, right: -4,
                background: 'var(--green-leaf)', color: '#fff', borderRadius: '50%',
                width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
                border: '2px solid var(--surface)',
              }}>
                {uploading ? '…' : '+'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{child.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <LeafIcon size={14} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{child.classrooms?.name}</span>
            </div>
          </div>
          <button onClick={() => setEditing(v => !v)} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="card" style={{ marginTop: '10px' }}>
            <div className="section-title" style={{ marginBottom: '1rem' }}>Edit details</div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ marginBottom: '1rem', width: '100%' }} />
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>Medications</label>
            <textarea
              value={form.medications}
              onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
              placeholder="List any medications, dosage, and schedule…"
              rows={3}
              style={{ width: '100%', marginBottom: '1rem', borderRadius: '12px', padding: '10px 14px', fontFamily: 'var(--font)', fontSize: '0.9375rem', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>Allergies</label>
            <textarea
              value={form.allergies}
              onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
              placeholder="List any allergies and reactions…"
              rows={3}
              style={{ width: '100%', marginBottom: '1rem', borderRadius: '12px', padding: '10px 14px', fontFamily: 'var(--font)', fontSize: '0.9375rem', border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
            <button onClick={saveDetails} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}

        {/* Health info (read-only) */}
        {!editing && (child.medications || child.allergies) && (
          <div className="card" style={{ marginTop: '10px' }}>
            {child.medications && (
              <div style={{ marginBottom: child.allergies ? '1rem' : 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Medications</div>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{child.medications}</p>
              </div>
            )}
            {child.allergies && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Allergies</div>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{child.allergies}</p>
              </div>
            )}
          </div>
        )}

        {/* Parents */}
        <div style={{ marginTop: '1.25rem' }}>
          <div className="section-title">Family ({parents.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {parents.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>No parents linked yet.</p>
            )}
            {parents.map(f => (
              <div key={f.profile_id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
                {f.profiles?.avatar_url ? (
                  <img src={f.profiles.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-whisper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--green-forest)', flexShrink: 0 }}>
                    {f.profiles?.full_name?.charAt(0)}
                  </div>
                )}
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9375rem' }}>{f.profiles?.full_name}</span>
                <button onClick={() => removeParent(f.profile_id)} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Remove</button>
              </div>
            ))}
          </div>

          {/* Quick-assign existing parent */}
          {allParents.filter(p => !linkedParentIds.has(p.id)).length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { assignParent(e.target.value); e.target.value = '' } }}
                style={{ borderRadius: '50px', fontSize: '0.8125rem', padding: '7px 14px' }}
              >
                <option value="">+ Link existing user…</option>
                {allParents.filter(p => !linkedParentIds.has(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Invite parent */}
        <div style={{ marginTop: '1.25rem' }}>
          <div className="section-title">Invite a parent</div>
          <div className="card" style={{ marginTop: '8px' }}>
            <form onSubmit={sendInvite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label htmlFor="invite-email" className="visually-hidden">Parent email address</label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                style={{ flex: 1, minWidth: '200px' }}
              />
              <button type="submit" className="btn btn-primary" disabled={inviting}>
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </form>
            {inviteMsg && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: inviteMsg.startsWith('Invite sent') ? 'var(--green-leaf)' : 'var(--red-alert)', fontWeight: 600 }}>
                {inviteMsg}
              </p>
            )}
            {pendingInvites.length > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Pending invites
                </div>
                {pendingInvites.map(inv => (
                  <div key={inv.email} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RaindropIcon size={13} />
                    {inv.email}
                    <span style={{ fontSize: '0.75rem', background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '1px 7px', color: 'var(--amber-acorn)', fontWeight: 700 }}>
                      awaiting signup
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Authorized Pickups */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="section-title">Authorized pickups ({pickups.length})</div>
            <button
              onClick={() => setAddingPickup(v => !v)}
              className="btn btn-ghost"
              style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
            >
              {addingPickup ? 'Cancel' : '+ Add person'}
            </button>
          </div>

          {addingPickup && (
            <div className="card" style={{ marginBottom: '10px' }}>
              <form onSubmit={savePickup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Name *</label>
                  <input
                    value={pickupForm.name}
                    onChange={e => setPickupForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Relationship</label>
                    <input
                      value={pickupForm.relationship}
                      onChange={e => setPickupForm(f => ({ ...f, relationship: e.target.value }))}
                      placeholder="e.g. Grandparent, Aunt"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone</label>
                    <input
                      value={pickupForm.phone}
                      onChange={e => setPickupForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(555) 000-0000"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Notes</label>
                  <input
                    value={pickupForm.notes}
                    onChange={e => setPickupForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional details"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <button type="submit" className="btn btn-primary" disabled={savingPickup || !pickupForm.name.trim()} style={{ fontSize: '0.875rem' }}>
                    {savingPickup ? 'Saving…' : 'Add pickup person'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {pickups.length === 0 && !addingPickup ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.25rem 0' }}>
              No authorized pickup persons on file. Parents or teachers can add them.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pickups.map(pu => (
                <div key={pu.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{pu.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {pu.relationship && <span>{pu.relationship}</span>}
                      {pu.phone && <span>{pu.phone}</span>}
                      {pu.notes && <span>· {pu.notes}</span>}
                    </div>
                  </div>
                  <button onClick={() => removePickup(pu.id)} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '4px 10px', flexShrink: 0 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports link */}
        <div style={{ marginTop: '1.25rem', marginBottom: '2rem' }}>
          <a href={`/classrooms/${child.classroom_id}/reports?child=${childId}`} className="btn btn-secondary">
            View progress reports →
          </a>
        </div>
      </div>
    </>
  )
}
