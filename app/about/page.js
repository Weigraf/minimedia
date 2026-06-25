'use client'
import { OwlIcon, LeafIcon, MessageIcon, AcornIcon, CaterpillarIcon, SproutIcon, RaindropIcon } from '@/components/Icons'

function PublicNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(216,200,232,0.6)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px',
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <OwlIcon size={32} />
        <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--green-forest)', letterSpacing: '-0.2px' }}>TumbleTree</span>
      </a>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <a href="/about" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--green-leaf)', textDecoration: 'none' }}>About</a>
        <a href="/contact" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
        <a href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>Sign in</a>
      </div>
    </nav>
  )
}

const features = [
  {
    Icon: LeafIcon,
    title: 'Secure Classrooms',
    body: 'Every classroom is a private group. Parents and staff are approved individually before they can see or post anything.',
    color: '#3B6D11',
    bg: '#ECFAD4',
    border: '#6AAD20',
  },
  {
    Icon: MessageIcon,
    title: 'Teacher Messaging',
    body: 'Teachers can send direct messages to individual parents or the whole class — with secure file attachments.',
    color: '#4A2F80',
    bg: '#EEE8F7',
    border: '#9B7DD4',
  },
  {
    Icon: AcornIcon,
    title: 'File Sharing',
    body: 'Share permission slips, photos, and resources in one place. All files are stored securely and never publicly accessible.',
    color: '#7A4000',
    bg: '#FFF3C4',
    border: '#F0C040',
  },
  {
    Icon: CaterpillarIcon,
    title: "Children's Profiles",
    body: 'Teachers build a profile for each child that parents can view — including progress notes and classroom milestones.',
    color: '#8B1A40',
    bg: '#FCE8F0',
    border: '#E07098',
  },
]

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #D8CFF0 0%, #EDE8E0 50%, #CDEAB8 100%)',
        padding: '5rem 1.5rem 4.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: '-20px', left: '-20px', opacity: 0.14, transform: 'rotate(-20deg)', pointerEvents: 'none' }}>
          <LeafIcon size={180} />
        </span>
        <span aria-hidden="true" style={{ position: 'absolute', bottom: '-10px', right: '-16px', opacity: 0.12, transform: 'rotate(10deg)', pointerEvents: 'none' }}>
          <AcornIcon size={160} />
        </span>
        <span aria-hidden="true" style={{ position: 'absolute', top: '30%', right: '5%', opacity: 0.10, pointerEvents: 'none' }}>
          <SproutIcon size={80} />
        </span>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <OwlIcon size={88} />
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            color: 'var(--green-forest)',
            marginTop: '1rem',
            marginBottom: '0.75rem',
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
          }}>
            A private classroom<br />for your child's world.
          </h1>
          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 auto 2rem',
            lineHeight: 1.65,
          }}>
            TumbleTree connects preschool families and educators in a secure, approved-only space — so communication stays personal, and children's information stays private.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn btn-primary" style={{ fontSize: '0.9375rem', padding: '10px 24px' }}>
              Request access
            </a>
            <a href="/contact" className="btn btn-secondary" style={{ fontSize: '0.9375rem', padding: '10px 24px', background: 'rgba(255,255,255,0.7)' }}>
              Get in touch
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          What's included
        </p>
        <h2 style={{ textAlign: 'center', fontSize: '1.625rem', fontWeight: 800, color: 'var(--green-forest)', marginBottom: '2.5rem', letterSpacing: '-0.3px' }}>
          Everything your school needs to stay connected
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {features.map(({ Icon, title, body, color, bg, border }) => (
            <div key={title} style={{
              background: 'var(--surface)',
              border: `1.5px solid var(--border)`,
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                background: bg, border: `1.5px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={26} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy callout */}
        <div style={{
          marginTop: '2.5rem',
          background: 'linear-gradient(135deg, #EEE8F7 0%, #ECFAD4 100%)',
          border: '1.5px solid #C8B8E0',
          borderRadius: '20px',
          padding: '2rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
        }}>
          <div style={{ flexShrink: 0 }}>
            <RaindropIcon size={48} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--green-forest)', marginBottom: '4px' }}>
              Built with privacy in mind
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No public profiles, no data selling, no ads. Every account requires admin approval before joining a classroom. Files are never publicly accessible and are served through signed, time-limited links.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: 'var(--green-forest)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#EAF3DE', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
          Ready to bring your school community together?
        </h2>
        <p style={{ color: 'rgba(234,243,222,0.75)', fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
          Reach out and we'll get your school set up.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/contact" className="btn" style={{
            fontSize: '0.9375rem', padding: '10px 24px',
            background: '#FFB733', color: '#27500A', fontWeight: 800,
            border: 'none',
          }}>
            Contact us
          </a>
          <a href="/signup" className="btn btn-secondary" style={{
            fontSize: '0.9375rem', padding: '10px 24px',
            background: 'transparent', color: '#EAF3DE',
            border: '1.5px solid rgba(234,243,222,0.4)',
          }}>
            Request access
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OwlIcon size={24} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>TumbleTree</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/about" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>About</a>
          <a href="/contact" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
          <a href="/login" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</a>
        </div>
      </div>
    </div>
  )
}
