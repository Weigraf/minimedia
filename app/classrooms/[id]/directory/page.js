'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CaterpillarIcon, LeafIcon, RaindropIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

function Avatar({ name, avatarUrl, size = 40 }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: '2px solid var(--card-border)', flexShrink: 0,
      }} />
    )
  }
  return (
    <span style={{
      display: 'inline-flex', width: size, height: size, borderRadius: '50%',
      background: 'var(--lavender-light)', border: '2px solid #A888CC',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4 + 'px', fontWeight: 800, color: 'var(--lavender-deep)',
      flexShrink: 0,
    }}>
      {name?.charAt(0)}
    </span>
  )
}

export default function ClassroomDirectory() {
  const [profile, setProfile] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !p.approved) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('memberships').select('role, approved')
        .eq('classroom_id', id).eq('profile_id', session.user.id).single()

      if (p.role !== 'admin' && (!membership || !membership.approved)) {
        router.push('/dashboard'); return
      }

      const teacher = p.role === 'admin' || membership?.role === 'classroom_admin'
      setProfile(p)
      setIsTeacher(teacher)

      const { data: cls } = await supabase.from('classrooms').select('id, name').eq('id', id).single()
      setClassroom(cls)

      // Approved parents in this classroom
      const { data: mems } = await supabase
        .from('memberships')
        .select('profile_id, role, profiles(id, full_name, avatar_url)')
        .eq('classroom_id', id)
        .eq('approved', true)

      const parentMembers = (mems || [])
        .filter(m => m.role === 'parent')
        .map(m => m.profiles)
        .filter(Boolean)
        .sort((a, b) => a.full_name.localeCompare(b.full_name))

      setParents(parentMembers)

      // Students — teachers see health badges, parents see names only
      const studentQuery = teacher
        ? supabase.from('children').select('id, name, medications, allergies, family_members(profile_id)').eq('classroom_id', id).order('name')
        : supabase.from('children').select('id, name').eq('classroom_id', id).order('name')

      const { data: kids } = await studentQuery
      setStudents(kids || [])
    }
    load()
  }, [id])

  if (!profile || !classroom) return <PageLoader message="Loading directory…" />

  const otherParents = parents.filter(p => p.id !== profile.id)

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <a href={`/classrooms/${id}`} style={{ color: 'var(--green-leaf)', fontSize: '13px', fontWeight: 600 }}>
            ← {classroom.name}
          </a>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', marginTop: '6px' }}>
            Classroom Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {isTeacher ? 'All students and families in this classroom.' : 'Students and other families in this classroom.'}
          </p>
        </div>

        {/* Students */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <CaterpillarIcon size={20} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green-forest)' }}>
              Students <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>({students.length})</span>
            </span>
          </div>

          {students.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No students in this classroom yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {students.map(child => (
                <div key={child.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
                  <span style={{
                    display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--yellow-glow)', border: '2px solid var(--amber-honey)',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 800, color: 'var(--amber-acorn)',
                  }}>
                    {child.name?.charAt(0)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {child.name}
                    </div>
                    {isTeacher && (
                      <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {child.medications && (
                          <span style={{ fontSize: '0.6875rem', background: 'var(--lavender-light)', borderRadius: '50px', padding: '1px 6px', color: 'var(--lavender-deep)', fontWeight: 700 }}>
                            Rx
                          </span>
                        )}
                        {child.allergies && (
                          <span style={{ fontSize: '0.6875rem', background: 'var(--yellow-glow)', border: '1px solid var(--amber-honey)', borderRadius: '50px', padding: '1px 6px', color: 'var(--amber-acorn)', fontWeight: 700 }}>
                            Allergies
                          </span>
                        )}
                        {child.family_members?.length > 0 && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {child.family_members.length} parent{child.family_members.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isTeacher && (
                          <a href={`/admin/students/${child.id}`} style={{ fontSize: '0.6875rem', color: 'var(--green-leaf)', fontWeight: 700, textDecoration: 'none' }}>
                            View →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parents */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <RaindropIcon size={20} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green-forest)' }}>
              {isTeacher ? 'Parents' : 'Other Families'}
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '6px' }}>
                ({isTeacher ? parents.length : otherParents.length})
              </span>
            </span>
          </div>

          {(isTeacher ? parents : otherParents).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isTeacher ? 'No approved parents yet.' : 'No other families in this classroom yet.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {(isTeacher ? parents : otherParents).map(parent => (
                <div key={parent.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
                  <Avatar name={parent.full_name} avatarUrl={parent.avatar_url} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {parent.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Parent</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
