'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp(e) {
    e.preventDefault()
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })

    if (error) { setMessage(error.message); return }

    // Create their profile (unapproved by default)
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: name,
      role: 'parent',
      approved: false
    })

    setMessage('Account created! Please wait for admin approval before logging in.')
  }

  return (
    <main style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Create Account</h1>
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Full name</label><br />
          <input value={name} onChange={e => setName(e.target.value)} required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>
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
          Request Access
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem', color: '#666' }}>{message}</p>}
      <p style={{ marginTop: '1rem' }}><a href="/login">Already have an account? Log in</a></p>
    </main>
  )
}