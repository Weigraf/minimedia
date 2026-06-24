'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewClassroom() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
    }
    loadUser()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!user) { setMessage('Not logged in'); return }
    setMessage('Creating...')

    const supabase = createClient()
    const { error } = await supabase.from('classrooms').insert({
      name,
      description,
      created_by: user.id
    })

    if (error) { setMessage('Error: ' + error.message); return }

    setMessage('Classroom created!')
    setTimeout(() => router.push('/dashboard'), 800)
  }

  return (
    <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <a href="/dashboard" style={{ color: '#4F46E5', textDecoration: 'none' }}>← Back to dashboard</a>
      <h1 style={{ margin: '1rem 0' }}>Create a Classroom</h1>
      <form onSubmit={handleCreate}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Classroom name</label><br />
          <input value={name} onChange={e => setName(e.target.value)} required
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Description (optional)</label><br />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" disabled={!user}
          style={{ width: '100%', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Create Classroom
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '1rem', color: message.startsWith('Error') ? 'red' : '#4F46E5' }}>
          {message}
        </p>
      )}
    </main>
  )
}

