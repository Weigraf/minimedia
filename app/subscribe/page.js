'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SunIcon, AcornIcon } from '@/components/Icons'
import Navbar from '@/components/Navbar'

export default function Subscribe() {
  const [profile, setProfile] = useState(null)
  const [premium, setPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: settings } = await supabase.from('school_settings').select('subscription_status').single()
      setPremium(settings?.subscription_status === 'premium')
      setLoading(false)
    }
    load()
  }, [])

  async function handleCheckout() {
    setWorking(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setWorking(false); return }
    window.location.href = url
  }

  async function handlePortal() {
    setWorking(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setWorking(false); return }
    window.location.href = url
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <>
      <Navbar profile={profile} />
      <div className="page-sm" style={{ paddingTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SunIcon size={52} />
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--green-forest)', marginTop: '12px' }}>
            TumbleTree Premium
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
            One plan for your whole school
          </p>
        </div>

        {loading ? null : (
          <>
            {/* Tiers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {/* Free */}
              <div className="card" style={{ opacity: premium ? 0.6 : 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Free</div>
                <ul style={{ listStyle: 'none', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 2 }}>
                  <li>✓ Up to 2 classrooms</li>
                  <li>✓ Text &amp; image posts</li>
                  <li>✓ File sharing</li>
                  <li>✓ Push notifications</li>
                  <li style={{ color: 'var(--border)' }}>✗ Video posts</li>
                  <li style={{ color: 'var(--border)' }}>✗ Progress reports</li>
                  <li style={{ color: 'var(--border)' }}>✗ Unlimited classrooms</li>
                </ul>
                <div style={{ marginTop: '1rem', fontWeight: 800, fontSize: '20px', color: 'var(--text-muted)' }}>$0</div>
              </div>

              {/* Premium */}
              <div className="card" style={{
                border: '2px solid var(--amber-honey)',
                background: 'var(--yellow-glow)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--amber-acorn)', color: '#FFF4E0',
                  fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '50px',
                  whiteSpace: 'nowrap',
                }}>
                  {premium ? '✓ ACTIVE' : 'RECOMMENDED'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '0.5rem', color: 'var(--amber-acorn)' }}>Premium</div>
                <ul style={{ listStyle: 'none', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <li>✓ Unlimited classrooms</li>
                  <li>✓ Text &amp; image posts</li>
                  <li>✓ File sharing</li>
                  <li>✓ Push notifications</li>
                  <li>✓ Video posts</li>
                  <li>✓ Progress reports</li>
                  <li>✓ Priority support</li>
                </ul>
                <div style={{ marginTop: '1rem', fontWeight: 800, fontSize: '20px', color: 'var(--amber-acorn)' }}>
                  $29<span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            {isAdmin ? (
              premium ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="flash-info" style={{ marginBottom: '1rem' }}>
                    Your school is on Premium. Thank you for supporting TumbleTree!
                  </div>
                  <button className="btn btn-ghost btn-full" onClick={handlePortal} disabled={working}>
                    {working ? 'Loading…' : 'Manage billing →'}
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary btn-full" onClick={handleCheckout} disabled={working} style={{ fontSize: '16px', padding: '14px' }}>
                  {working ? 'Redirecting…' : 'Upgrade to Premium →'}
                </button>
              )
            ) : (
              <div className="flash-info" style={{ textAlign: 'center' }}>
                Ask your school admin to upgrade to Premium.
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
