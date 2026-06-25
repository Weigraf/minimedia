'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MessageIcon, MushroomIcon } from '@/components/Icons'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ContactInbox() {
  const [profile, setProfile]       = useState(null)
  const [inquiries, setInquiries]   = useState([])
  const [filter, setFilter]         = useState('all') // 'all' | 'unread'
  const [expanded, setExpanded]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [token, setToken]           = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }

      setProfile(p)
      setToken(session.access_token)
      await fetchInquiries(session.access_token)
    }
    load()
  }, [])

  async function fetchInquiries(tok) {
    const res = await fetch('/api/contact', {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const { inquiries } = await res.json()
      setInquiries(inquiries || [])
    }
    setLoading(false)
  }

  async function toggleRead(id, currentRead) {
    const next = !currentRead
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, read: next } : i))
    await fetch('/api/contact', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, read: next }),
    })
  }

  async function markAllRead() {
    const unread = inquiries.filter(i => !i.read)
    setInquiries(prev => prev.map(i => ({ ...i, read: true })))
    await Promise.all(unread.map(i =>
      fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: i.id, read: true }),
      })
    ))
  }

  if (loading || !profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '12px' }}>
      <MessageIcon size={48} />
      <p style={{ color: 'var(--text-muted)' }}>Loading inbox…</p>
    </div>
  )

  const visible    = filter === 'unread' ? inquiries.filter(i => !i.read) : inquiries
  const unreadCount = inquiries.filter(i => !i.read).length

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginBottom: '2px' }}>
              Contact Inbox
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {unreadCount > 0
                ? `${unreadCount} unread inquiry${unreadCount > 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Mark all read
              </button>
            )}
            <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: '50px', overflow: 'hidden' }}>
              {['all', 'unread'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: filter === f ? 'var(--green-forest)' : 'transparent',
                    color: filter === f ? '#EAF3DE' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <MushroomIcon size={64} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>
              {filter === 'unread' ? 'No unread inquiries' : 'No contact inquiries yet'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Submissions from the Contact page will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visible.map(inq => {
              const isOpen = expanded === inq.id
              return (
                <div
                  key={inq.id}
                  className="card"
                  style={{
                    borderLeft: inq.read ? '3px solid var(--border)' : '3px solid var(--lavender)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                  onClick={() => {
                    setExpanded(isOpen ? null : inq.id)
                    if (!inq.read) toggleRead(inq.id, false)
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {inq.name}
                        </span>
                        {!inq.read && (
                          <span style={{
                            background: '#C93B6A', color: '#fff',
                            borderRadius: '50px', fontSize: '0.625rem',
                            fontWeight: 800, padding: '1px 7px',
                          }}>
                            NEW
                          </span>
                        )}
                        <a
                          href={`mailto:${inq.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: '0.8125rem', color: 'var(--lavender-deep)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {inq.email}
                        </a>
                      </div>
                      {inq.subject && (
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {inq.subject}
                        </p>
                      )}
                      {!isOpen && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inq.message}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(inq.created_at)}
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                        onClick={e => { e.stopPropagation(); toggleRead(inq.id, inq.read) }}
                      >
                        {inq.read ? 'Mark unread' : 'Mark read'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded message */}
                  {isOpen && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                      fontSize: '0.9375rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {inq.message}
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
