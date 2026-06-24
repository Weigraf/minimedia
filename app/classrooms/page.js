'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([])
  const [memberships, setMemberships] = useState([])
  const [userId, setUserId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)

      const { data: classrooms } = await supabase.from('classrooms').select('*').order('name')
      const { data: memberships } = await supabase
        .from('memberships').select('classroom_id, approved').eq('profile_id', user.id)

      setClassrooms(classrooms || [])
      setMemberships(memberships || [])
    }
    load()
  }, [])

  async function requestJoin(classroomId) {
    const supabase = createClient()
    const { error } = await supabase.from('memberships').insert({
      classroom_id: classroomId,
      profile_id: userId,
      approved: false
    })
    if (error) { setMessage('Error: ' + error.message); return }
    setMemberships(prev => [...prev, { classroom_id: classroomId, approved: false }])
    setMessage('Request sent! Waiting for admin approval.')
  }

  function getMembershipStatus(classroomId) {
    const m = memberships.find(m => m.classroom_id === classroomId)
    if (!m) return 'none'
    return m.approved ? 'approved' : 'pending'
  }

  return (
    <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <a href="/dashboard" style={{ color: '#4F46E5', textDecoration: 'none' }}>← Back to dashboard</a>
      <h1 style={{ margin: '1rem 0' }}>Classrooms</h1>
      {message && <p style={{ color: '#4F46E5', marginBottom: '1rem' }}>{message}</p>}
      {classrooms.map(c => {
        const status = getMembershipStatus(c.id)
        return (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px' }}>
            <div>
              <strong>{c.name}</strong>
              {c.description && <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{c.description}</p>}
            </div>
            {status === 'none' && (
              <button onClick={() => requestJoin(c.id)}
                style={{ padding: '6px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Request to Join
              </button>
            )}
            {status === 'pending' && <span style={{ color: '#666', fontSize: '14px' }}>Pending approval</span>}
            {status === 'approved' && <a href={`/classrooms/${c.id}`} style={{ color: '#4F46E5', fontWeight: 500 }}>Enter →</a>}
          </div>
        )
      })}
    </main>
  )
}