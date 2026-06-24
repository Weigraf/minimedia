'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { LeafIcon } from '@/components/Icons'

export default function NewClassroom() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(profile)
    }
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!profile) return
    setMessage('Creating...')
    const supabase = createClient()
    const { error } = await supabase.from('classrooms').insert({
      name,
      description,
      created_by: profile.id
    })
    if (error) { setMessage('Error: ' + error.message); return }
    setMessage('Classroom created!')
    setTimeout(() => router.push('/dashboard'), 800)
  }

  return (
    <>
      <Navbar profile={profile} />
      <div className="page-sm">
        <a href="/dashboard" style={{ color: 'var(--green-leaf)', fontSize: '14px', fontWeight: 600 }}>← Back to dashboard</a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1.25rem 0' }}>
          <LeafIcon size={36} />
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>New Classroom</h1>
        </div>

        <div className="card">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Classroom name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Sunshine Room" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="A short description for parents..." />
            </div>
            {message && (
              <div className={message.startsWith('Error') ? 'flash-error' : 'flash-info'}>
                {message}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={!profile}>
              Create classroom
            </button>
          </form>
        </div>
      </div>
    </>
  )
}