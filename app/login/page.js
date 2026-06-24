'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { RaindropIcon } from '@/components/Icons'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); return }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('approved, role').eq('id', data.user.id).single()

    if (profileError || !profile) { router.push('/dashboard'); return }

    if (!profile.approved) {
      await supabase.auth.signOut()
      setMessage('Your account is pending admin approval.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <RaindropIcon size={56} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green-forest)', marginTop: '12px' }}>MiniMedia</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Sign in to your classroom</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {message && <div className="flash-error">{message}</div>}
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }}>
            Sign in
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '14px', color: 'var(--text-muted)' }}>
          Need access? <a href="/signup">Request an account</a>
        </p>
      </div>
    </div>
  )
}