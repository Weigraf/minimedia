'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SproutIcon } from '@/components/Icons'

export default function Navbar({ profile }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{
      background: 'var(--green-forest)',
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <SproutIcon size={28} />
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#EAF3DE', letterSpacing: '-0.3px' }}>MiniMedia</span>
      </a>

      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #639922' }}
              />
            ) : (
              <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#EAF3DE' }}>
                {profile.full_name?.charAt(0)}
              </span>
            )}
            <span style={{ fontSize: '13px', color: '#97C459', fontWeight: 500 }}>
              {profile.full_name}
            </span>
          </a>

          <span className={`badge badge-${profile.role}`}>{profile.role}</span>

          {profile.role === 'admin' && (
            <a href="/admin/approvals" style={{ fontSize: '13px', color: '#C0DD97', fontWeight: 600, textDecoration: 'none' }}>
              Approvals
            </a>
          )}

          <button onClick={handleSignOut} style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#EAF3BE',
            border: 'none',
            borderRadius: '50px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}