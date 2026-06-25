'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OwlIcon, SproutIcon, LeafIcon, SnailIcon, RaindropIcon, AcornIcon, CaterpillarIcon, MessageIcon, MushroomIcon, SunIcon, MoonIcon } from '@/components/Icons'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function TwinkleStar({ size = 26 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size,
      fontSize: size * 0.78 + 'px',
      color: '#FFB733',
      animation: 'twinkle 2.4s ease-in-out infinite',
      lineHeight: 1,
    }}>
      ✦
    </span>
  )
}

function navItems(role, isClassroomAdmin) {
  const items = []

  if (role === 'admin') {
    items.push({ label: 'New Classroom',       href: '/admin/classrooms/new', Icon: SproutIcon })
    items.push({ label: 'Approvals',            href: '/admin/approvals',      Icon: AcornIcon })
    items.push({ label: 'Users',               href: '/admin/users',           Icon: RaindropIcon })
  }

  items.push({ label: 'My Classrooms', href: '/dashboard', Icon: LeafIcon })

  if (role === 'parent' && !isClassroomAdmin) {
    items.push({ label: 'My Children', href: '/my-children', Icon: CaterpillarIcon })
  }

  if (isClassroomAdmin) {
    items.push({ label: 'Approvals',         href: '/admin/approvals', Icon: AcornIcon })
    items.push({ label: 'My Classrooms',     href: '/classrooms',      Icon: SnailIcon })
    items.push({ label: 'Children',          href: '/admin/children',  Icon: CaterpillarIcon })
    items.push({ label: 'Messages',          href: '/messages',        Icon: MessageIcon })
  }

  if (role === 'admin') {
    items.push({ label: 'Browse Classrooms', href: '/classrooms',       Icon: SnailIcon })
    items.push({ label: 'Children',          href: '/admin/children',   Icon: CaterpillarIcon })
    items.push({ label: 'Contact Inbox',     href: '/admin/contact',    Icon: MushroomIcon })
    items.push({ label: 'Premium',           href: '/subscribe',        Icon: TwinkleStar })
  }

  items.push({ divider: true })
  items.push({ label: 'Profile & Settings', href: '/profile', Icon: RaindropIcon })

  return items
}

export default function Navbar({ profile }) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [isClassroomAdmin, setIsClassroomAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('tt-sidebar') !== 'closed'
  })
  const [theme, setTheme] = useState(null)
  const router = useRouter()

  useEffect(() => {
    document.body.style.transition = 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)'
    document.body.style.marginLeft = menuOpen ? '270px' : '0'
  }, [menuOpen])

  useEffect(() => {
    if (!profile || profile.role !== 'parent') return
    const supabase = createClient()
    supabase.from('memberships')
      .select('id').eq('profile_id', profile.id).eq('role', 'classroom_admin').eq('approved', true).limit(1)
      .then(({ data }) => { if (data?.length) setIsClassroomAdmin(true) })
  }, [profile])

  useEffect(() => {
    const saved = localStorage.getItem('tt-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = saved ?? (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    if (saved) document.documentElement.dataset.theme = saved
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('tt-theme', next)
  }

  useEffect(() => {
    if (!profile || typeof window === 'undefined') return

    async function initPush() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications')
          setPushSupported(true)
          const { data } = await supabase.from('device_tokens').select('id').eq('profile_id', profile.id).limit(1)
          if (data?.length) setPushEnabled(true)
          PushNotifications.addListener('registration', async ({ value: fcmToken }) => {
            const platform = Capacitor.getPlatform()
            await fetch('/api/push/register-device', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
              body: JSON.stringify({ token: fcmToken, platform }),
            })
            setPushEnabled(true)
          })
          PushNotifications.addListener('registrationError', () => setPushEnabled(false))
          return
        }
      } catch {}

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      setPushSupported(true)
      navigator.serviceWorker.register('/sw.js').catch(() => {})
      const { data } = await supabase.from('push_subscriptions').select('id').eq('profile_id', profile.id).limit(1)
      if (data?.length) setPushEnabled(true)
    }

    initPush()
  }, [profile])

  async function handleTogglePush() {
    if (!pushSupported) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        if (pushEnabled) {
          await supabase.from('device_tokens').delete().eq('profile_id', profile.id)
          setPushEnabled(false)
        } else {
          const { receive } = await PushNotifications.requestPermissions()
          if (receive === 'granted') await PushNotifications.register()
        }
        return
      }
    } catch {}

    if (pushEnabled) {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ endpoint }),
        })
      }
      setPushEnabled(false)
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    })
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    if (res.ok) setPushEnabled(true)
  }

  function openSidebar() {
    setMenuOpen(true)
    localStorage.setItem('tt-sidebar', 'open')
  }
  function closeSidebar() {
    setMenuOpen(false)
    localStorage.setItem('tt-sidebar', 'closed')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = profile ? navItems(profile.role, isClassroomAdmin) : []
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <>
      {/* ── Persistent sidebar ───────────────────────────────────── */}
      <div
        id="nav-drawer"
        role="navigation"
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '270px',
          background: 'var(--surface)',
          zIndex: 50,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          borderRight: '2px solid #A888CC',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer header */}
        <div style={{
          background: 'linear-gradient(135deg, #C8B8E0, #D8C8EC)',
          borderBottom: '2px solid #A888CC',
          padding: '0 1.25rem',
          height: '62px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <OwlIcon size={28} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2A1F0E' }}>TumbleTree</span>
          </div>
          <button
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            style={{
              background: 'rgba(255,255,255,0.5)', border: '1.5px solid #A888CC',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '1.125rem', color: '#2A1F0E',
              padding: '2px 8px', lineHeight: 1.4,
              fontFamily: 'var(--font)', fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        {/* Nav items */}
        <nav aria-label="Site navigation" style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {items.map((item, i) => {
            if (item.divider) return (
              <div key={i} style={{ height: '1px', background: 'var(--card-border)', margin: '0.5rem 1.25rem' }} />
            )
            return (
              <a
                key={i}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 1.25rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem', fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--lavender-pale)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>
                  <item.Icon size={26} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Drawer footer */}
        {profile && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '2px solid var(--card-border)',
            background: 'var(--lavender-pale)',
            display: 'flex', alignItems: 'center', gap: '10px',
            flexShrink: 0,
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #A888CC', flexShrink: 0 }} />
            ) : (
              <span style={{ display: 'inline-flex', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '2px solid #A888CC', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#2A1F0E', flexShrink: 0 }}>
                {profile.full_name?.charAt(0)}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.full_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.role}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Top navbar ────────────────────────────────────────────── */}
      <nav aria-label="Main navigation" style={{
        background: 'linear-gradient(to right, #C8B8E0, #D8C8EC, #C8B8E0)',
        borderBottom: '2.5px solid #A888CC',
        boxShadow: '0 3px 14px rgba(100,60,160,0.12)',
        padding: '0 1rem',
        height: '62px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        gap: '8px',
      }}>

        {/* Left — hamburger */}
        <button
          onClick={openSidebar}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="nav-drawer"
          style={{
            background: 'rgba(255,255,255,0.55)',
            border: '1.5px solid #A888CC',
            borderRadius: '10px',
            cursor: 'pointer',
            padding: '8px 9px',
            display: 'flex', flexDirection: 'column', gap: '4px',
            alignItems: 'center', flexShrink: 0,
          }}
        >
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#2A1F0E', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#2A1F0E', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#2A1F0E', borderRadius: '2px' }} />
        </button>

        {/* Center — logo (absolutely centered) */}
        <a
          href="/dashboard"
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none',
            pointerEvents: 'auto',
          }}
        >
          <OwlIcon size={32} />
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2A1F0E', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            TumbleTree
          </span>
        </a>

        {/* Right — bell · avatar/name · role · sign out */}
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
            {pushSupported && (
              <button
                onClick={handleTogglePush}
                aria-label={pushEnabled ? 'Disable notifications' : 'Enable notifications'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1, opacity: pushEnabled ? 1 : 0.4, padding: '2px' }}
              >
                🔔
              </button>
            )}

            <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0 }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #A888CC' }} />
              ) : (
                <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: '2px solid #A888CC', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#2A1F0E' }}>
                  {profile.full_name?.charAt(0)}
                </span>
              )}
              <span style={{ fontSize: '0.8125rem', color: '#8B5500', fontWeight: 600, maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firstName}
              </span>
            </a>

            <span className={`badge badge-${profile.role}`} style={{ flexShrink: 0 }}>
              {profile.role === 'classroom_admin' ? 'C.Admin' : profile.role}
            </span>

            {theme && (
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
                  border: '1.5px solid #A888CC',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  flexShrink: 0,
                }}
              >
                {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: theme === 'dark' ? '#F0ECF8' : '#2A1F0E', lineHeight: 1 }}>
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              style={{
                background: '#FFE566', color: '#2A1F0E',
                border: '1.5px solid #F0C030', borderRadius: '50px',
                padding: '5px 12px', fontSize: '0.8125rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0,
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
