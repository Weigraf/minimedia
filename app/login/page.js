'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    .from('profiles')
    .select('approved, role')
    .eq('id', data.user.id)
    .single()

  // If we can't read the profile at all, let them through
  // and protect individual pages instead
  if (profileError || !profile) {
    router.push('/dashboard')
    return
  }

  if (!profile.approved) {
    await supabase.auth.signOut()
    setMessage('Your account is pending admin approval.')
    return
  }

  router.push('/dashboard')
}
  return (
    <main style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Log In</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label><br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Log In
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem', color: '#e11d48' }}>{message}</p>}
      <p style={{ marginTop: '1rem' }}><a href="/signup">Need an account? Request access</a></p>
    </main>
  )
}