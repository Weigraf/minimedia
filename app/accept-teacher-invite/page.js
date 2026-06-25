'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SproutIcon } from '@/components/Icons'

export default function AcceptTeacherInvite() {
  const [status, setStatus] = useState('waiting') // waiting | processing | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function process(session) {
      setStatus('processing')
      try {
        const res = await fetch('/api/process-teacher-invite', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong.'); return }
        setStatus('done')
        setTimeout(() => router.push('/dashboard'), 2500)
      } catch {
        setStatus('error')
        setErrorMsg('Network error. Please try again.')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) process(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) process(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
      <SproutIcon size={56} />
      <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '360px' }}>
        {status === 'waiting' && (
          <>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginBottom: '0.5rem' }}>Welcome to TumbleTree</h1>
            <p style={{ color: 'var(--text-muted)' }}>Setting up your account…</p>
          </>
        )}
        {status === 'processing' && (
          <>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginBottom: '0.5rem' }}>Joining your school…</h1>
            <p style={{ color: 'var(--text-muted)' }}>Just a moment while we get everything ready.</p>
          </>
        )}
        {status === 'done' && (
          <>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginBottom: '0.5rem' }}>You're all set!</h1>
            <p style={{ color: 'var(--text-muted)' }}>Redirecting you to your dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{errorMsg}</p>
            <a href="/dashboard" className="btn btn-primary">Go to dashboard</a>
          </>
        )}
      </div>
    </div>
  )
}
