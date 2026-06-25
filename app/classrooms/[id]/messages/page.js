'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MessageIcon, LeafIcon } from '@/components/Icons'

export default function ClassroomMessages() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [teachers, setTeachers] = useState([])
  const [body, setBody] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isTeacher, setIsTeacher] = useState(false)
  const fileRef = useRef()
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('memberships').select('role, approved')
        .eq('classroom_id', id).eq('profile_id', session.user.id).single()

      if (p.role !== 'admin' && (!membership || !membership.approved)) {
        router.push('/dashboard'); return
      }

      // classroom_admin is a membership-level role, not a profile role
      const teacher = p.role === 'admin' || membership?.role === 'classroom_admin'
      setProfile(p)
      setIsTeacher(teacher)

      const { data: cls } = await supabase.from('classrooms').select('*').eq('id', id).single()
      setClassroom(cls)

      // Load classroom members for compose UI — include membership role to detect teachers
      const { data: mems } = await supabase
        .from('memberships')
        .select('profile_id, role, profiles(id, full_name, role)')
        .eq('classroom_id', id)
        .eq('approved', true)

      if (teacher) {
        const parents = (mems || [])
          .map(m => m.profiles)
          .filter(pr => pr && pr.id !== session.user.id)
        setMembers(parents)
      } else {
        // Teachers are membership role='classroom_admin' OR profile role='admin'
        const teacherList = (mems || [])
          .filter(m => m.role === 'classroom_admin' || m.profiles?.role === 'admin')
          .map(m => m.profiles)
          .filter(Boolean)
        setTeachers(teacherList)
        if (teacherList.length > 0) setRecipientId(teacherList[0].id)
      }

      await fetchMessages(session.access_token)
      await markAsRead(supabase, session.user.id)
    }
    load()
  }, [id])

  async function fetchMessages(token) {
    const res = await fetch(`/api/messages?classroom_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const { messages } = await res.json()
      setMessages(messages || [])
    }
  }

  async function markAsRead(supabase, userId) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('classroom_id', id)
      .eq('recipient_id', userId)
      .is('read_at', null)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!body.trim() && !file) return
    setSending(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const fd = new FormData()
    fd.append('classroom_id', id)
    if (recipientId) fd.append('recipient_id', recipientId)
    fd.append('body', body)
    if (file) fd.append('file', file)

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: fd,
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to send'); setSending(false); return }

    setBody('')
    setFile(null)
    setRecipientId(isTeacher ? '' : (teachers[0]?.id || ''))
    if (fileRef.current) fileRef.current.value = ''
    setSending(false)
    await fetchMessages(session.access_token)
    await markAsRead(supabase, session.user.id)
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (!profile || !classroom) return null

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <a href={`/classrooms/${id}`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← {classroom.name}
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <MessageIcon size={36} />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-forest)' }}>Messages</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{classroom.name}</p>
          </div>
        </div>

        {/* Compose — teachers send to parents; parents reply to teachers */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>
            {isTeacher ? 'Send a message' : 'Reply to teacher'}
          </div>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label htmlFor="msg-recipient" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                To
              </label>
              {isTeacher ? (
                <select
                  id="msg-recipient"
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  style={{ borderRadius: '50px' }}
                >
                  <option value="">All parents in classroom</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              ) : (
                <select
                  id="msg-recipient"
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  style={{ borderRadius: '50px' }}
                  required
                >
                  {teachers.length === 0 && <option value="">No teachers found</option>}
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="msg-body" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Message
              </label>
              <textarea
                id="msg-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--lavender-deep)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                  style={{ display: 'none' }}
                />
                📎 {file ? file.name : 'Attach file'}
              </label>
              {file && (
                <button type="button" onClick={() => { setFile(null); fileRef.current.value = '' }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: 0 }}>
                  Remove
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || (!body.trim() && !file) || (!isTeacher && !recipientId)}
                style={{ marginLeft: 'auto' }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
            {error && <div className="flash-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</div>}
          </form>
        </div>

        {/* Message thread */}
        {messages.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <MessageIcon size={48} />
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              {isTeacher ? 'No messages yet. Send one above.' : 'No messages yet. Send one above or wait for a message from your teacher.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => {
              const isMine = msg.sender_id === profile?.id
              return (
                <div key={msg.id} className="card" style={{
                  borderLeft: isMine ? '3px solid var(--lavender)' : '3px solid var(--amber-honey)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {isMine ? 'You' : msg.sender?.full_name}
                      </span>
                      {msg.recipient_id
                        ? <span className="badge badge-parent" style={{ fontSize: '0.6875rem' }}>→ {msg.recipient?.full_name}</span>
                        : <span className="badge badge-approved" style={{ fontSize: '0.6875rem' }}>Classroom</span>
                      }
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>

                  {msg.body && (
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {msg.body}
                    </p>
                  )}

                  {msg.file_url && (
                    <a
                      href={msg.file_url}
                      download={msg.file_name}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        marginTop: msg.body ? '0.5rem' : 0,
                        fontSize: '0.8125rem', color: 'var(--lavender-deep)', fontWeight: 600,
                        background: 'var(--lavender-light)', borderRadius: '50px',
                        padding: '5px 12px', textDecoration: 'none',
                      }}
                    >
                      📎 {msg.file_name}
                    </a>
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
