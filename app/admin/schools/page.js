'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SproutIcon, LeafIcon, RaindropIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

export default function SchoolsAdmin() {
  const [profile, setProfile] = useState(null)
  const [schools, setSchools] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(p)

      const { data: s } = await supabase
        .from('schools')
        .select('*, school_memberships(id, role, profiles(full_name)), classrooms(id)')
        .order('name')
      setSchools(s || [])
    }
    load()
  }, [])

  if (!profile) return <PageLoader message="Loading schools…" />

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SproutIcon size={44} />
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)' }}>Schools</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage schools, school admins, and teacher rosters.</p>
            </div>
          </div>
          <a href="/admin/schools/new" className="btn btn-primary" style={{ flexShrink: 0 }}>+ New School</a>
        </div>

        {schools.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <SproutIcon size={52} />
            <p style={{ fontWeight: 700, marginTop: '1rem', color: 'var(--text-primary)' }}>No schools yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>Create your first school to get started.</p>
            <a href="/admin/schools/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Create school</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schools.map(school => {
              const admin = school.school_memberships?.find(m => m.role === 'school_admin')
              const teacherCount = school.school_memberships?.filter(m => m.role === 'teacher').length ?? 0
              const classroomCount = school.classrooms?.length ?? 0
              return (
                <div key={school.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--green-whisper)', border: '2px solid var(--green-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SproutIcon size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{school.name}</div>
                    {school.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1px' }}>{school.description}</div>}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RaindropIcon size={13} /> {admin ? admin.profiles?.full_name : <em>No admin set</em>}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{teacherCount} teacher{teacherCount !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{classroomCount} classroom{classroomCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <a href={`/admin/schools/${school.id}`} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '7px 14px', flexShrink: 0 }}>
                    Manage →
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
