import { OwlIcon, LeafIcon, RaindropIcon, AcornIcon } from '@/components/Icons'

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
        <a href="/about" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>About</a>
        <a href="/contact" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
        <a href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>Sign in</a>
      </div>
    </nav>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1.125rem', fontWeight: 800, color: 'var(--green-forest)',
        marginBottom: '0.75rem', paddingBottom: '0.5rem',
        borderBottom: '1.5px solid var(--border)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children, style }) {
  return (
    <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.875rem', ...style }}>
      {children}
    </p>
  )
}

function Ul({ items }) {
  return (
    <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.875rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.25rem' }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #D8CFF0 0%, #EDE8E0 50%, #CDEAB8 100%)',
        padding: '3.5rem 1.5rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: '-20px', left: '-20px', opacity: 0.10, transform: 'rotate(-20deg)', pointerEvents: 'none' }}>
          <LeafIcon size={160} />
        </span>
        <span aria-hidden="true" style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.10, transform: 'rotate(10deg)', pointerEvents: 'none' }}>
          <AcornIcon size={140} />
        </span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <RaindropIcon size={64} />
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 900, color: 'var(--green-forest)',
            marginTop: '0.75rem', marginBottom: '0.5rem',
            letterSpacing: '-0.4px', lineHeight: 1.2,
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Effective date: June 26, 2026
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>

        {/* Intro callout */}
        <div style={{
          background: 'linear-gradient(135deg, #EEE8F7 0%, #ECFAD4 100%)',
          border: '1.5px solid #C8B8E0',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '1rem',
        }}>
          <span style={{ flexShrink: 0, marginTop: '2px' }}><RaindropIcon size={28} /></span>
          <P style={{ marginBottom: 0 }}>
            TumbleTree is a private platform for preschool families and educators. We are committed to
            protecting your privacy and the privacy of the children in your care. We do not sell data,
            display ads, or share personal information with third parties except as described in this policy.
          </P>
        </div>

        <Section title="1. Who We Are">
          <P>
            TumbleTree is operated as a private preschool communication platform, accessible at{' '}
            <a href="https://www.tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>www.tumble-tree.com</a>.
            For questions about this policy, contact us at{' '}
            <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>admin@tumble-tree.com</a>.
          </P>
        </Section>

        <Section title="2. Information We Collect">
          <P>We collect the following types of information when you use TumbleTree:</P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Account information</p>
          <Ul items={[
            'Full name and email address (provided during sign-up)',
            'Password (stored as a secure hash — we never see it in plain text)',
            'Profile photo (optional, uploaded by you)',
            'Account role (parent, teacher, or administrator)',
          ]} />

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Classroom and school data</p>
          <Ul items={[
            'Classroom membership and approval status',
            "Posts, comments, and files you share within your classroom",
            "Direct messages exchanged between parents and teachers",
            "Calendar events created by teachers",
          ]} />

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Information about children</p>
          <Ul items={[
            "Child name and classroom enrollment (entered by a teacher or administrator)",
            "Daily activity reports (mood, meals, nap, activities, notes — entered by teachers)",
            "Incident reports (filed by teachers, visible to parents of the child)",
            "Authorized pickup contacts (entered by administrators)",
            "Health notes (entered by administrators)",
          ]} />
          <P>
            Information about children is entered by school staff or authorized parents — not by children
            themselves. We do not knowingly collect data directly from children under 13.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Contact form submissions</p>
          <Ul items={[
            "Name, email address, and message sent through the public contact form",
          ]} />

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Technical data</p>
          <Ul items={[
            "IP address (used for rate limiting on public forms — not stored beyond the request)",
            "Push notification tokens (if you opt in to browser or mobile notifications)",
            "Basic server logs maintained by our hosting provider (Vercel)",
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect solely to operate and improve TumbleTree:</P>
          <Ul items={[
            "Authenticate your account and verify classroom membership",
            "Deliver posts, messages, and files within your classrooms",
            "Send email notifications (e.g., new messages, contact form confirmations)",
            "Send push notifications if you have opted in",
            "Display daily reports and incident history to authorized teachers and parents",
            "Maintain platform security and prevent abuse",
          ]} />
          <P>
            We do not use your information for advertising, behavioral profiling, or any purpose
            unrelated to providing the platform to you.
          </P>
        </Section>

        <Section title="4. How We Share Your Information">
          <P>
            We do not sell, rent, or trade your personal information. We share information only in
            these limited circumstances:
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Within your classroom</p>
          <P>
            Posts, files, and messages you create are visible to other approved members of the same
            classroom. Broadcast messages from teachers are visible to all approved parents in that
            classroom. Direct messages are visible only to the sender and the specific recipient.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Third-party service providers</p>
          <P>We use the following services to operate TumbleTree. Each processes data only as needed to deliver their service:</P>
          <Ul items={[
            "Supabase (database, authentication, and file storage) — data stored in the United States",
            "Vercel (web hosting and serverless functions) — data processed in the United States",
            "Resend (transactional email) — used to send notification emails",
            "Google Firebase (push notification delivery for mobile apps) — device tokens only",
          ]} />

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Legal requirements</p>
          <P>
            We may disclose information if required by law, court order, or to protect the safety
            of any person.
          </P>
        </Section>

        <Section title="5. Children's Privacy (COPPA)">
          <P>
            TumbleTree serves preschool classrooms and therefore holds information about young children.
            We take this responsibility seriously.
          </P>
          <Ul items={[
            "Children do not create accounts or directly interact with TumbleTree.",
            "Information about a child (name, classroom, daily reports, incident records) is entered and managed by school staff or the child's parent or guardian.",
            "Parents can view, and may request deletion of, all information associated with their child by contacting admin@tumble-tree.com.",
            "We do not use children's information for any purpose other than operating the classroom features of this platform.",
          ]} />
        </Section>

        <Section title="6. Data Retention">
          <P>
            We retain your account information and associated data for as long as your account is
            active. If you would like your account and data deleted, contact us at{' '}
            <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>admin@tumble-tree.com</a>{' '}
            and we will remove your account and personal data within 30 days.
          </P>
          <P>
            Contact form submissions are retained for up to 12 months and then deleted.
          </P>
        </Section>

        <Section title="7. Security">
          <P>
            We take reasonable technical and organizational measures to protect your information,
            including:
          </P>
          <Ul items={[
            "All data is transmitted over HTTPS (TLS encryption in transit)",
            "Passwords are never stored in plain text (managed by Supabase Auth)",
            "Files are stored in private buckets and served only via signed, time-limited URLs",
            "Classroom access is enforced at the database level via row-level security policies",
            "All accounts require administrator approval before accessing any classroom content",
            "Rate limiting is applied to public-facing forms to prevent abuse",
          ]} />
          <P>
            No system can guarantee absolute security. If you believe your account has been
            compromised, contact us immediately at{' '}
            <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>admin@tumble-tree.com</a>.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>You have the right to:</P>
          <Ul items={[
            "Access the personal information we hold about you",
            "Request correction of inaccurate information",
            "Request deletion of your account and associated personal data",
            "Withdraw consent to push notifications at any time through your browser or device settings",
          ]} />
          <P>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>admin@tumble-tree.com</a>.
            We will respond within 30 days.
          </P>
        </Section>

        <Section title="9. Cookies and Local Storage">
          <P>
            TumbleTree uses browser local storage (not third-party cookies) to remember your
            preferences — such as your sidebar state, theme (light/dark), and push notification
            enrollment. No tracking cookies or advertising pixels are used.
          </P>
          <P>
            Supabase Auth stores a session token in local storage to keep you signed in. This token
            is scoped to TumbleTree and is not shared with any third party.
          </P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. When we do, we will update the
            effective date at the top of this page. Continued use of TumbleTree after a change
            constitutes acceptance of the revised policy. For material changes, we will notify
            users via email or an in-app notice.
          </P>
        </Section>

        <Section title="11. Contact Us">
          <P>
            If you have any questions, concerns, or requests related to this Privacy Policy,
            please contact us:
          </P>
          <div style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
          }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>TumbleTree</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
              Email:{' '}
              <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>
                admin@tumble-tree.com
              </a>
            </p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Website:{' '}
              <a href="https://www.tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>
                www.tumble-tree.com
              </a>
            </p>
          </div>
        </Section>

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
          <a href="/privacy" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          <a href="/login" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</a>
        </div>
      </div>
    </div>
  )
}
