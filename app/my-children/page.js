'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon } from '@/components/Icons'

export default function MyChildren() {
  const [profile, setProfile] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!p || !p.approved) { router.push('/login'); return }
      if (p.role !== 'parent') { router.push('/dashboard'); return }

      setProfile(p)

      const { data: familyLinks } = await supabase
        .from('family_members')
        .select('children(*, classrooms(id, name, avatar_url))')
        .eq('profile_id', session.user.id)

      setChildren((familyLinks || []).map(f => f.children).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !profile) return null

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <CaterpillarIcon size={44} />
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>My Children</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Profiles created by your school for each of your children.
            </p>
          </div>
        </div>

        {children.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <CaterpillarIcon size={56} />
            <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '1rem', color: 'var(--text-primary)' }}>
              No children linked yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Your teacher will set up your child's profile and link it to your account.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {children.map(child => (
              <div key={child.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Avatar placeholder */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                    background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.375rem', fontWeight: 800, color: 'var(--amber-acorn)',
                  }}>
                    {child.name?.charAt(0)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{child.name}</div>
                    {child.classrooms && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <LeafIcon size={14} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{child.classrooms.name}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {child.classrooms && (
                      <a
                        href={`/classrooms/${child.classrooms.id}/reports?child=${child.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '7px 14px' }}
                      >
                        Progress reports
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
