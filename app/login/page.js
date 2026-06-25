'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OwlIcon, SunIcon, LeafIcon, AcornIcon, MushroomIcon, SnailIcon, SproutIcon, CaterpillarIcon, RaindropIcon, SquirrelIcon, ChipmunkIcon, CapybaraIcon } from '@/components/Icons'

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
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #D8CFF0 0%, #EDE8E0 50%, #CDEAB8 100%)',
      overflow: 'hidden',
    }}>

      {/* ── Decorative background icons ─────────────────────────── */}
      <span aria-hidden="true" style={{ position: 'absolute', top: '-24px', left: '-24px', opacity: 0.28, transform: 'rotate(-25deg)', pointerEvents: 'none' }}>
        <LeafIcon size={180} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', top: '8px', right: '24px', opacity: 0.24, transform: 'rotate(18deg)', pointerEvents: 'none' }}>
        <AcornIcon size={120} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '24px', left: '16px', opacity: 0.26, transform: 'rotate(8deg)', pointerEvents: 'none' }}>
        <MushroomIcon size={110} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '16px', right: '-8px', opacity: 0.22, transform: 'rotate(-12deg)', pointerEvents: 'none' }}>
        <SnailIcon size={150} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', top: '42%', left: '32px', opacity: 0.20, transform: 'translateY(-50%) rotate(6deg)', pointerEvents: 'none' }}>
        <SproutIcon size={88} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', top: '58%', right: '24px', opacity: 0.20, transform: 'translateY(-50%) scaleX(-1)', pointerEvents: 'none' }}>
        <CaterpillarIcon size={96} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', top: '22%', left: '13%', opacity: 0.18, transform: 'rotate(40deg)', pointerEvents: 'none' }}>
        <SunIcon size={64} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '28%', right: '11%', opacity: 0.18, transform: 'rotate(-18deg)', pointerEvents: 'none' }}>
        <RaindropIcon size={58} />
      </span>
      {/* Animals */}
      <span aria-hidden="true" style={{ position: 'absolute', top: '30%', right: '6%', opacity: 0.26, transform: 'scaleX(-1)', pointerEvents: 'none' }}>
        <SquirrelIcon size={100} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '18%', left: '8%', opacity: 0.24, transform: 'rotate(5deg)', pointerEvents: 'none' }}>
        <SquirrelIcon size={80} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', top: '12%', left: '30%', opacity: 0.22, transform: 'rotate(-8deg)', pointerEvents: 'none' }}>
        <ChipmunkIcon size={72} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '40%', right: '3%', opacity: 0.20, transform: 'rotate(10deg)', pointerEvents: 'none' }}>
        <ChipmunkIcon size={64} />
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: '6%', left: '30%', opacity: 0.24, pointerEvents: 'none' }}>
        <CapybaraIcon size={110} />
      </span>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <OwlIcon size={72} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green-forest)', marginTop: '8px', letterSpacing: '-0.3px' }}>TumbleTree</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>Sign in to your classroom</p>
        </div>

        <div className="card" style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 40px rgba(100,60,160,0.13), 0 2px 8px rgba(0,0,0,0.05)',
          border: '1.5px solid rgba(216,200,232,0.9)',
        }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" aria-describedby={message ? 'login-error' : undefined} />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" aria-describedby={message ? 'login-error' : undefined} />
            </div>
            {message && <div id="login-error" className="flash-error" role="alert">{message}</div>}
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }}>
              Sign in
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '14px', color: 'var(--text-muted)' }}>
            Need access? <a href="/signup">Request an account</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '13px', color: 'rgba(90,64,48,0.65)' }}>
          <a href="/about" style={{ color: 'rgba(90,64,48,0.65)', textDecoration: 'none', fontWeight: 600 }}>About</a>
          {' · '}
          <a href="/contact" style={{ color: 'rgba(90,64,48,0.65)', textDecoration: 'none', fontWeight: 600 }}>Contact</a>
        </p>
      </div>
    </div>
  )
}