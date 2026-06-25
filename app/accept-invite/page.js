'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { OwlIcon, SproutIcon } from '@/components/Icons'

export default function AcceptInvite() {
  const [status, setStatus] = useState('waiting') // waiting | processing | done | error

  useEffect(() => {
    const supabase = createClient()
    let processed = false

    async function processInvite(session) {
      if (processed) return
      processed = true
      setStatus('processing')

      try {
        const res = await fetch('/api/process-invite', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          setStatus('done')
          setTimeout(() => { window.location.href = '/dashboard' }, 2500)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    // Handle magic-link token in URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        processInvite(session)
      }
    })

    // Also check if already signed in (page refresh case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) processInvite(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const styles = {
    page: {
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: '20px', padding: '2rem',
    },
    card: {
      background: 'var(--surface)', border: '2px solid var(--card-border)',
      borderRadius: '20px', padding: '2.5rem 2rem', maxWidth: '400px', width: '100%',
      textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    },
    title: { fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-forest)', marginTop: '1rem' },
    sub: { fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 },
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <OwlIcon size={52} />
        {status === 'waiting' && (
          <>
            <p style={styles.title}>Setting up your account…</p>
            <p style={styles.sub}>Please wait while we verify your invitation.</p>
          </>
        )}
        {status === 'processing' && (
          <>
            <p style={styles.title}>Linking your account…</p>
            <p style={styles.sub}>Connecting you to your child's classroom.</p>
          </>
        )}
        {status === 'done' && (
          <>
            <SproutIcon size={40} style={{ marginTop: '0.5rem' }} />
            <p style={styles.title}>Welcome to TumbleTree!</p>
            <p style={styles.sub}>
              Your account is set up. Your teacher will approve your classroom access shortly.
              Redirecting you now…
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={styles.title}>Something went wrong</p>
            <p style={styles.sub}>
              We couldn't complete your invite setup. Please contact your child's teacher or try signing in at the link below.
            </p>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '1.25rem', display: 'inline-block' }}>
              Go to sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}
