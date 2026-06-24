'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingMemberships, setPendingMemberships] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const supabase = createClient()

    const { data: users } = await supabase
      .from('profiles').select('*').eq('approved', false)

    const { data: memberships } = await supabase
      .from('memberships')
      .select('*, profiles(full_name), classrooms(name)')
      .eq('approved', false)

    setPendingUsers(users || [])
    setPendingMemberships(memberships || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approveUser(id) {
    const supabase = createClient()
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    load()
  }

  async function approveMembership(id) {
    const supabase = createClient()
    await supabase.from('memberships').update({ approved: true }).eq('id', id)
    load()
  }

  if (loading) return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading...</p>

  return (
    <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <a href="/dashboard" style={{ color: '#4F46E5', textDecoration: 'none' }}>← Back to dashboard</a>
      <h1 style={{ margin: '1rem 0' }}>Pending Approvals</h1>

      <h2>New Users ({pendingUsers.length})</h2>
      {pendingUsers.length === 0 ? <p style={{ color: '#666' }}>No pending users.</p> : pendingUsers.map(u => (
        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px' }}>
          <div>
            <strong>{u.full_name}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>{u.role}</p>
          </div>
          <button onClick={() => approveUser(u.id)}
            style={{ padding: '6px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Approve
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: '2rem' }}>Classroom Join Requests ({pendingMemberships.length})</h2>
      {pendingMemberships.length === 0 ? <p style={{ color: '#666' }}>No pending requests.</p> : pendingMemberships.map(m => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px' }}>
          <div>
            <strong>{m.profiles?.full_name}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>wants to join {m.classrooms?.name}</p>
          </div>
          <button onClick={() => approveMembership(m.id)}
            style={{ padding: '6px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Approve
          </button>
        </div>
      ))}
    </main>
  )
}