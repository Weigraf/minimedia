'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SproutIcon } from '@/components/Icons'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) { setMessage(error.message); return }
    setSuccess(true)
    // Notify admin in background
    fetch('/api/notify/new-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    }).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <SproutIcon size={56} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green-forest)', marginTop: '12px' }}>TumbleTree</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Request access to your classroom</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <SproutIcon size={48} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '12px 0 8px' }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
              Confirm your email address, then wait for an admin to approve your account before logging in.
            </p>
            <a href="/login" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: '1.25rem' }}>
              Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label htmlFor="signup-name">Full name</label>
              <input id="signup-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" aria-describedby={message ? 'signup-error' : undefined} />
            </div>
            {message && <div id="signup-error" className="flash-error" role="alert">{message}</div>}
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }}>
              Request access
            </button>
          </form>
        )}
        {!success && (
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        )}
      </div>
    </div>
  )
}