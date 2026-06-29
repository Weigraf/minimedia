'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function HeroOwl() {
  return (
    <svg
      viewBox="0 0 170 232"
      fill="none"
      width="170"
      height="232"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Ear tufts */}
      <polygon points="51,30 43,5 63,28" fill="#c98a4a"/>
      <polygon points="119,30 127,5 107,28" fill="#c98a4a"/>
      {/* Body halo ring */}
      <ellipse cx="85" cy="100" rx="83" ry="88" fill="rgba(255,255,255,0.12)"/>
      {/* Body */}
      <ellipse cx="85" cy="100" rx="70" ry="75" fill="#d99a55"/>
      {/* Body inset bottom shade */}
      <ellipse cx="85" cy="148" rx="60" ry="22" fill="rgba(0,0,0,0.05)"/>
      {/* Belly */}
      <ellipse cx="85" cy="119" rx="43" ry="48" fill="#f3d9b0"/>
      {/* Left wing */}
      <ellipse cx="20" cy="104" rx="15" ry="32" fill="#c98a4a" transform="rotate(8 20 80)" className="login-sway" style={{ transformOrigin: 'top center', animation: 'sway 4s ease-in-out infinite' }}/>
      {/* Right wing */}
      <ellipse cx="150" cy="104" rx="15" ry="32" fill="#c98a4a" transform="rotate(-8 150 80)" className="login-sway" style={{ transformOrigin: 'top center', animation: 'sway 4s ease-in-out infinite reverse' }}/>
      {/* Left eye outer ring */}
      <circle cx="62" cy="75" r="24" fill="#f3d9b0"/>
      <circle cx="62" cy="75" r="21" fill="#ffffff"/>
      <circle cx="62" cy="75" r="11" fill="#3a2a1a"/>
      <circle cx="57" cy="70" r="4" fill="#ffffff"/>
      {/* Right eye outer ring */}
      <circle cx="108" cy="75" r="24" fill="#f3d9b0"/>
      <circle cx="108" cy="75" r="21" fill="#ffffff"/>
      <circle cx="108" cy="75" r="11" fill="#3a2a1a"/>
      <circle cx="103" cy="70" r="4" fill="#ffffff"/>
      {/* Beak */}
      <path d="M76,96 L94,96 L85,112Z" fill="#ff8d4a"/>
      {/* Feet */}
      <rect x="61" y="172" width="14" height="10" rx="5" fill="#ff8d4a"/>
      <rect x="95" y="172" width="14" height="10" rx="5" fill="#ff8d4a"/>
      {/* Branch */}
      <rect x="0" y="184" width="170" height="11" rx="6" fill="#8a5a3b"/>
      {/* Branch stem */}
      <rect x="82" y="193" width="6" height="34" rx="3" fill="#8a5a3b"/>
    </svg>
  )
}

function LogoMark() {
  return (
    <div style={{
      width: '42px', height: '42px', borderRadius: '13px',
      background: '#4a9d4f', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', flexShrink: 0,
    }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#bfe6a0' }}/>
      <div style={{ position: 'absolute', bottom: '7px', width: '5px', height: '12px', background: '#8a5a3b', borderRadius: '2px' }}/>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Invalid email or password.')
      setSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('approved, role').eq('id', data.user.id).single()

    if (profileError || !profile) { router.push('/dashboard'); return }

    if (!profile.approved) {
      await supabase.auth.signOut()
      setMessage('Your account is pending admin approval.')
      setSubmitting(false)
      return
    }
    router.push('/dashboard')
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #dce6d6',
    borderRadius: '14px',
    fontSize: '15px',
    fontFamily: 'inherit',
    background: '#f7faf5',
    color: '#2f4a2c',
    outline: 'none',
    transition: 'border-color 0.15s',
    display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#eef3ea',
      padding: '1.5rem',
    }}>
      <div
        className="login-card"
        style={{
          width: '940px',
          maxWidth: '100%',
          display: 'flex',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 30px 70px -30px rgba(47,74,44,.45)',
          background: '#fff',
          minHeight: '600px',
        }}
      >
        {/* ── Left hero panel ── */}
        <div
          className="login-hero"
          style={{
            position: 'relative',
            width: '48%',
            background: 'radial-gradient(circle at 30% 20%, #6fc06d 0%, #3f9446 55%, #2f7a3c 100%)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '44px',
          }}
        >
          {/* Decorative circles */}
          <div aria-hidden="true" className="login-float" style={{ position: 'absolute', top: '-40px', right: '-30px', width: '170px', height: '170px', borderRadius: '50%', background: 'rgba(255,255,255,.13)', animation: 'floaty 6s ease-in-out infinite' }}/>
          <div aria-hidden="true" style={{ position: 'absolute', top: '90px', left: '-50px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,.1)' }}/>
          <div aria-hidden="true" className="login-float2" style={{ position: 'absolute', top: '60px', right: '60px', width: '46px', height: '46px', borderRadius: '50%', background: '#ffd45e', boxShadow: '0 8px 20px rgba(0,0,0,.12)', animation: 'floaty2 5s ease-in-out infinite' }}/>
          <div aria-hidden="true" className="login-float" style={{ position: 'absolute', top: '150px', left: '54px', width: '30px', height: '30px', borderRadius: '50%', background: '#ff8d6b', animation: 'floaty 7s ease-in-out infinite' }}/>
          <div aria-hidden="true" className="login-float2" style={{ position: 'absolute', top: '220px', right: '90px', width: '22px', height: '22px', borderRadius: '50%', background: '#ffd45e', animation: 'floaty2 6.4s ease-in-out infinite' }}/>

          {/* Owl + branch */}
          <div
            className="login-float"
            style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'floaty 5.5s ease-in-out infinite',
            }}
          >
            <HeroOwl />
          </div>

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '30px',
              color: '#fff',
              lineHeight: 1.15,
              textShadow: '0 2px 8px rgba(0,0,0,.12)',
              margin: 0,
            }}>
              Where the classroom comes home.
            </p>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.92)', marginTop: '12px', lineHeight: 1.5 }}>
              Photos, notes and little wins from your child's day — shared safely with the grown-ups who care.
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div
          className="login-form-panel"
          style={{
            width: '52%',
            padding: '54px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Brand lockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '30px' }}>
            <LogoMark />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '23px', color: '#2f4a2c' }}>
              TumbleTree
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '27px', color: '#2f4a2c', margin: '0 0 6px' }}>
            Hi there! 🌱
          </h1>
          <p style={{ fontSize: '15px', color: '#7a8c72', margin: '0 0 28px' }}>
            Sign in to your classroom.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#3f5a3a', marginBottom: '7px' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                aria-describedby={message ? 'login-error' : undefined}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#4a9d4f' }}
                onBlur={e => { e.target.style.borderColor = '#dce6d6' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#3f5a3a', marginBottom: '7px' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                aria-describedby={message ? 'login-error' : undefined}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#4a9d4f' }}
                onBlur={e => { e.target.style.borderColor = '#dce6d6' }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <a href="/forgot" style={{ fontSize: '13px', fontWeight: 700, color: '#4a9d4f', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            {message && (
              <div id="login-error" className="flash-error" role="alert" style={{ marginBottom: '16px' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '15px',
                border: 'none',
                borderRadius: '14px',
                background: '#4a9d4f',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '17px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 22px -8px rgba(74,157,79,.7)',
                opacity: submitting ? 0.7 : 1,
                transition: 'background 0.15s, opacity 0.15s',
              }}
              onMouseOver={e => { if (!submitting) e.currentTarget.style.background = '#3f8c44' }}
              onMouseOut={e => { e.currentTarget.style.background = '#4a9d4f' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: '#7a8c72' }}>
            Need access?{' '}
            <a href="/signup" style={{ fontWeight: 800, color: '#e8893f', textDecoration: 'none' }}>
              Request an account
            </a>
          </p>

          <p style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '30px', fontSize: '13px', color: '#a3b09b' }}>
            <a href="/about" style={{ color: '#a3b09b', textDecoration: 'none' }}>About</a>
            {' · '}
            <a href="/contact" style={{ color: '#a3b09b', textDecoration: 'none' }}>Contact</a>
            {' · '}
            <a href="/terms" style={{ color: '#a3b09b', textDecoration: 'none' }}>Terms</a>
            {' · '}
            <a href="/privacy" style={{ color: '#a3b09b', textDecoration: 'none' }}>Privacy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
