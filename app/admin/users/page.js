'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { RaindropIcon, LeafIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function AdminUsers() {
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(p)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, approved, avatar_url')
        .order('full_name')

      const ids = (profiles || []).map(u => u.id)
      const { data: mems } = await supabase
        .from('memberships')
        .select('profile_id, role, approved, classrooms(name)')
        .in('profile_id', ids)

      setUsers((profiles || []).map(u => ({
        ...u,
        memberships: (mems || []).filter(m => m.profile_id === u.id),
      })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoader message="Loading users…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <RaindropIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>All Users</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{users.length} accounts</p>
          </div>
        </div>

        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '320px' }}
          aria-label="Search users"
        />

        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No users found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(u => (
              <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt=""
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card-border)', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--green-whisper)', border: '2px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9375rem', fontWeight: 800, color: 'var(--green-forest)',
                  }}>
                    {u.full_name?.charAt(0)}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.full_name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                    {!u.approved && (
                      <span style={{
                        fontSize: '0.75rem', color: 'var(--amber-acorn)',
                        background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)',
                        borderRadius: '50px', padding: '1px 8px', fontWeight: 700,
                      }}>
                        pending approval
                      </span>
                    )}
                    {u.memberships.map((m, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', color: 'var(--text-muted)',
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                        borderRadius: '50px', padding: '1px 8px',
                      }}>
                        <LeafIcon size={11} />
                        {m.classrooms?.name}
                        {m.role === 'classroom_admin' && ' · teacher'}
                        {!m.approved && ' · pending'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
