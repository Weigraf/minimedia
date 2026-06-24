'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SproutIcon } from '@/components/Icons'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function Navbar({ profile }) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!profile || typeof window === 'undefined') return

    async function initPush() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Native Capacitor push
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications')
          setPushSupported(true)

          // Check if already registered
          const { data } = await supabase
            .from('device_tokens')
            .select('id')
            .eq('profile_id', profile.id)
            .limit(1)
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

      // Web push fallback
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      setPushSupported(true)
      navigator.serviceWorker.register('/sw.js').catch(() => {})

      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('profile_id', profile.id)
        .limit(1)
      if (data?.length) setPushEnabled(true)
    }

    initPush()
  }, [profile])

  async function handleTogglePush() {
    if (!pushSupported) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Native Capacitor path
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

    // Web push path
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
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#EAF3DE', letterSpacing: '-0.3px' }}>TumbleTree</span>
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

          {pushSupported && (
            <button
              onClick={handleTogglePush}
              title={pushEnabled ? 'Disable notifications' : 'Enable notifications'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                opacity: pushEnabled ? 1 : 0.45,
                padding: '2px 4px',
              }}
            >
              🔔
            </button>
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
