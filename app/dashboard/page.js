'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SunriseScene, AfternoonScene, EveningScene, SproutIcon, MushroomIcon, LeafIcon, AcornIcon, SnailIcon, MessageIcon } from '@/components/Icons'
import PageLoader from '@/components/PageLoader'

const PALETTES = [
  { bg: '#FFF3C4', border: '#F0C040', text: '#7A4000' },
  { bg: '#FCE8F0', border: '#E07098', text: '#8B1A40' },
  { bg: '#EEE8F7', border: '#9B7DD4', text: '#4A2F80' },
  { bg: '#ECFAD4', border: '#6AAD20', text: '#27500A' },
]

const FALLBACK_ICONS = [AcornIcon, LeafIcon, SnailIcon, SproutIcon]

function greetingInfo() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning',   Scene: SunriseScene   }
  if (h < 17) return { text: 'Good afternoon', Scene: AfternoonScene }
  return         { text: 'Good evening',   Scene: EveningScene   }
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()

      if (!profile || !profile.approved) {
        await supabase.auth.signOut(); router.push('/login'); return
      }

      const viewAs = (() => { try { return JSON.parse(localStorage.getItem('tt-view-as') || 'null') } catch { return null } })()
      const simulatingParent = profile.role === 'admin' && viewAs

      let classroomData = []
      if (profile.role === 'admin' && !simulatingParent) {
        const { data } = await supabase.from('classrooms').select('*').order('created_at')
        classroomData = data || []
      } else {
        // Check if school admin first — they see their school's classrooms
        const { data: schoolMem } = await supabase
          .from('school_memberships').select('school_id')
          .eq('profile_id', session.user.id).eq('role', 'school_admin').maybeSingle()

        if (schoolMem) {
          const { data } = await supabase.from('classrooms').select('*').eq('school_id', schoolMem.school_id).order('name')
          classroomData = data || []
        } else {
          const { data } = await supabase
            .from('memberships')
            .select('classroom_id, approved, classrooms(*)')
            .eq('profile_id', session.user.id)
          classroomData = (data || []).filter(m => m.approved).map(m => m.classrooms)
        }
      }

      const { data: unread } = await supabase
        .from('messages')
        .select('classroom_id')
        .eq('recipient_id', session.user.id)
        .is('read_at', null)

      const counts = {}
      if (unread) {
        unread.forEach(m => {
          counts[m.classroom_id] = (counts[m.classroom_id] || 0) + 1
        })
      }

      setProfile(profile)
      setClassrooms(classroomData)
      setUnreadCounts(counts)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <PageLoader message="Loading your classrooms…" />

  const firstName = profile.full_name.split(' ')[0]
  const { text: greetingText, Scene: GreetingScene } = greetingInfo()

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">

        {/* Greeting header */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF5CC 0%, #EEE8F7 100%)',
          border: '1.5px solid #D8C8E8',
          borderRadius: '20px',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <GreetingScene width={88} height={60} />
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--green-forest)', lineHeight: 1.2 }}>
                {greetingText}, {firstName}! 🌿
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                {classrooms.length === 0
                  ? 'No classrooms yet — get started below.'
                  : `You have ${classrooms.length} classroom${classrooms.length > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>
          {profile.role === 'admin' && (
            <a href="/admin/classrooms/new" className="btn btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New classroom
            </a>
          )}
        </div>

        {profile.role === 'parent' && (
          <div className="flash-info" style={{ marginBottom: '1.5rem' }}>
            Not seeing your classroom? <a href="/classrooms" style={{ fontWeight: 700 }}>Browse and request to join →</a>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <MushroomIcon size={72} />
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>
              No classrooms yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              {profile.role === 'admin'
                ? 'Create your first classroom to get started.'
                : 'Ask your admin to add you to a classroom.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {classrooms.map((c, i) => {
              const palette = PALETTES[i % PALETTES.length]
              const FallbackIcon = FALLBACK_ICONS[i % FALLBACK_ICONS.length]
              return (
                <ClassroomCard
                  key={c.id}
                  classroom={c}
                  palette={palette}
                  FallbackIcon={FallbackIcon}
                  unreadCount={unreadCounts[c.id] || 0}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function ClassroomCard({ classroom, palette, FallbackIcon, unreadCount }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `2px solid ${hovered ? palette.border : 'var(--border)'}`,
        borderRadius: '18px',
        padding: '1.125rem 1.25rem',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Avatar */}
        {classroom.avatar_url ? (
          <img
            src={classroom.avatar_url}
            alt=""
            style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: `2px solid ${palette.border}` }}
          />
        ) : (
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
            background: palette.bg, border: `2px solid ${palette.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FallbackIcon size={30} />
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--green-forest)', marginBottom: classroom.description ? '3px' : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {classroom.name}
          </p>
          {classroom.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {classroom.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
          <a
            href={`/classrooms/${classroom.id}/messages`}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: hovered ? palette.bg : 'transparent',
              border: `1.5px solid ${hovered ? palette.border : 'var(--border)'}`,
              borderRadius: '50px',
              padding: '4px 10px',
              fontSize: '0.8125rem', fontWeight: 700,
              color: hovered ? palette.text : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <MessageIcon size={14} /> Messages
            {unreadCount > 0 && (
              <span style={{
                background: '#C93B6A',
                color: '#fff',
                borderRadius: '50px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '1px 6px',
                lineHeight: '16px',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </a>
          <a
            href={`/classrooms/${classroom.id}`}
            style={{
              background: hovered ? palette.bg : 'transparent',
              border: `1.5px solid ${hovered ? palette.border : 'var(--border)'}`,
              borderRadius: '50px',
              padding: '4px 12px',
              fontSize: '0.8125rem', fontWeight: 700,
              color: hovered ? palette.text : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            Open →
          </a>
        </div>

      </div>
    </div>
  )
}
