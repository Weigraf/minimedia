'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MessageIcon, LeafIcon, MushroomIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MessagesInbox() {
  const [profile, setProfile]         = useState(null)
  const [classrooms, setClassrooms]   = useState([])
  const [unread, setUnread]           = useState({})   // classroom_id -> count
  const [previews, setPreviews]       = useState({})   // classroom_id -> latest message
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }
      setProfile(p)

      // Load classrooms the user belongs to
      let classroomList = []
      if (p.role === 'admin') {
        const { data } = await supabase.from('classrooms').select('id, name, avatar_url').order('name')
        classroomList = data || []
      } else {
        const { data: mems } = await supabase
          .from('memberships')
          .select('classrooms(id, name, avatar_url)')
          .eq('profile_id', session.user.id)
          .eq('approved', true)
        classroomList = (mems || []).map(m => m.classrooms).filter(Boolean)
      }
      setClassrooms(classroomList)

      if (!classroomList.length) return
      const ids = classroomList.map(c => c.id)

      // Unread counts
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('classroom_id')
        .in('classroom_id', ids)
        .eq('recipient_id', session.user.id)
        .is('read_at', null)

      const unreadMap = {}
      for (const row of (unreadRows || [])) {
        unreadMap[row.classroom_id] = (unreadMap[row.classroom_id] || 0) + 1
      }
      setUnread(unreadMap)

      // Latest message per classroom (for preview)
      const { data: msgs } = await supabase
        .from('messages')
        .select('classroom_id, body, created_at, sender_id, sender:sender_id(full_name)')
        .in('classroom_id', ids)
        .order('created_at', { ascending: false })

      const previewMap = {}
      for (const msg of (msgs || [])) {
        if (!previewMap[msg.classroom_id]) previewMap[msg.classroom_id] = msg
      }
      setPreviews(previewMap)
    }
    load()
  }, [])

  if (!profile) return <PageLoader message="Loading messages…" />

  const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0)

  // Sort classrooms: unread first, then by most recent message
  const sorted = [...classrooms].sort((a, b) => {
    const ua = unread[a.id] || 0
    const ub = unread[b.id] || 0
    if (ub !== ua) return ub - ua
    const pa = previews[a.id]?.created_at || ''
    const pb = previews[b.id]?.created_at || ''
    return pb.localeCompare(pa)
  })

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <MessageIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>Messages</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>

        {classrooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <MushroomIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>No classrooms yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              You'll see your message threads here once you're added to a classroom.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sorted.map(cls => {
              const unreadCount = unread[cls.id] || 0
              const preview     = previews[cls.id]
              const isMine      = preview?.sender_id === profile.id

              return (
                <a
                  key={cls.id}
                  href={`/classrooms/${cls.id}/messages`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      borderLeft: unreadCount > 0 ? '4px solid var(--green-leaf)' : '4px solid transparent',
                      transition: 'box-shadow 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Classroom avatar */}
                    {cls.avatar_url ? (
                      <img src={cls.avatar_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--green-whisper)', border: '2px solid var(--green-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LeafIcon size={26} />
                      </div>
                    )}

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: unreadCount > 0 ? 800 : 700, fontSize: '0.9375rem', color: 'var(--green-forest)', marginBottom: '3px' }}>
                        {cls.name}
                      </div>
                      {preview ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unreadCount > 0 ? 600 : 400 }}>
                          {isMine ? 'You: ' : `${preview.sender?.full_name?.split(' ')[0]}: `}
                          {preview.body || '📎 Attachment'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages yet</div>
                      )}
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      {preview && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(preview.created_at)}</span>
                      )}
                      {unreadCount > 0 && (
                        <span style={{
                          background: 'var(--green-leaf)', color: '#fff',
                          borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 800,
                          padding: '2px 8px', minWidth: '20px', textAlign: 'center',
                          lineHeight: '16px',
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
