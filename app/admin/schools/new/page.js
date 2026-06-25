'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SproutIcon } from '@/components/Icons'

export default function NewSchool() {
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(p)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/schools/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), adminEmail: adminEmail.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to create school'); setSaving(false); return }
    router.push(`/admin/schools/${data.schoolId}`)
  }

  if (!profile) return null

  return (
    <>
      <Navbar profile={profile} />
      <div className="page" style={{ maxWidth: '560px' }}>
        <a href="/admin/schools" style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>← Schools</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1rem 0 1.75rem' }}>
          <SproutIcon size={40} />
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>New School</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                School Name *
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maplewood Preschool" required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Description
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description of the school" />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                School Admin Email
              </label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@school.com (sends invite)" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Leave blank to assign an admin later. If provided, a magic-link invite is sent.
              </p>
            </div>
            {error && <div className="flash-error" role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create school'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
