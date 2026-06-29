import { OwlIcon, LeafIcon, AcornIcon, SproutIcon } from '@/components/Icons'

function PublicNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(220,230,214,0.8)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px',
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <OwlIcon size={32} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.125rem', color: 'var(--green-forest)' }}>TumbleTree</span>
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
        fontFamily: 'var(--font-display)',
        fontSize: '1.2rem', fontWeight: 600, color: 'var(--green-forest)',
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

function Callout({ children }) {
  return (
    <div style={{
      background: 'var(--lavender-light)',
      border: '1.5px solid var(--green-mist)',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      marginBottom: '2.5rem',
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
    }}>
      <span style={{ flexShrink: 0, marginTop: '2px' }}><SproutIcon size={28} /></span>
      <P style={{ marginBottom: 0 }}>{children}</P>
    </div>
  )
}

export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />

      {/* Header */}
      <div style={{
        background: 'radial-gradient(circle at 60% 40%, #6fc06d 0%, #3f9446 55%, #2f7a3c 100%)',
        padding: '3.5rem 1.5rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-20px', left: '-20px', opacity: 0.10, transform: 'rotate(-20deg)', pointerEvents: 'none' }}>
          <LeafIcon size={160} />
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.10, transform: 'rotate(10deg)', pointerEvents: 'none' }}>
          <AcornIcon size={140} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SproutIcon size={64} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600, color: '#fff',
            marginTop: '0.75rem', marginBottom: '0.5rem',
            lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,.12)',
          }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.85)' }}>
            Effective date: June 29, 2026
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>

        <Callout>
          Please read these Terms of Service carefully before using TumbleTree. By creating an
          account or accessing the platform, you agree to be bound by these terms. If you do not
          agree, do not use TumbleTree.
        </Callout>

        <Section title="1. Who We Are">
          <P>
            TumbleTree is a private classroom-communication platform for preschool families and
            educators, operated at{' '}
            <a href="https://www.tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>www.tumble-tree.com</a>.
            References to "TumbleTree," "we," "us," or "our" in these Terms refer to the operators
            of this platform.
          </P>
        </Section>

        <Section title="2. Who May Use TumbleTree">
          <P>
            TumbleTree is intended for use by adults (18 years of age or older) who are parents,
            legal guardians, or school staff members of enrolled preschool students. By registering,
            you confirm that:
          </P>
          <Ul items={[
            'You are at least 18 years old.',
            'You are a parent, legal guardian, or staff member at a TumbleTree-enrolled school.',
            'You have the authority to agree to these Terms on behalf of yourself.',
            'All information you provide during registration is accurate and complete.',
          ]} />
          <P>
            Children under 13 do not create accounts on TumbleTree and may not use the platform
            directly. Information about children is entered by authorized adults only.
          </P>
        </Section>

        <Section title="3. Account Registration and Security">
          <P>
            All accounts require administrator approval before you can access any classroom content.
            You are responsible for:
          </P>
          <Ul items={[
            'Keeping your password secure and not sharing your login credentials with anyone.',
            'All activity that occurs under your account.',
            'Notifying us immediately at admin@tumble-tree.com if you suspect unauthorized access.',
          ]} />
          <P>
            You may hold only one account per person. Creating duplicate accounts is not permitted.
            We reserve the right to merge or remove duplicate accounts.
          </P>
        </Section>

        <Section title="4. Acceptable Use">
          <P>You agree to use TumbleTree only for its intended purpose of classroom communication.
          You must not:</P>
          <Ul items={[
            'Post content that is abusive, harassing, defamatory, obscene, or illegal.',
            'Share photos or personal information about children outside of TumbleTree or with unauthorized parties.',
            'Impersonate another person, teacher, or administrator.',
            'Use the platform to solicit, advertise, or promote any product or service.',
            'Attempt to access classrooms or accounts you are not authorized for.',
            'Scrape, crawl, or automate data collection from the platform.',
            'Upload malware, viruses, or any code intended to harm the platform or its users.',
            'Interfere with or disrupt the integrity or performance of the platform.',
          ]} />
          <P>
            Violations may result in immediate account suspension or termination, at our sole
            discretion, without prior notice.
          </P>
        </Section>

        <Section title="5. Content You Post">
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Ownership</p>
          <P>
            You retain ownership of content you post on TumbleTree — including posts, photos,
            files, and messages. By posting content, you grant TumbleTree a limited, non-exclusive
            license to store and display that content solely for the purpose of delivering the
            platform to you and other authorized members of your classroom.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Your responsibility</p>
          <P>
            You are solely responsible for the content you post. You confirm that you have the
            right to share any content you upload — including photos of children — and that doing
            so does not violate any law, regulation, or the rights of any third party.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>School data</p>
          <P>
            Student records, daily reports, incident records, and related data entered by school
            staff remain the property of the school. TumbleTree acts as a service provider
            processing this data on behalf of the school.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Content removal</p>
          <P>
            We reserve the right to remove any content that violates these Terms or that we
            determine, in our sole discretion, is harmful, illegal, or inappropriate.
          </P>
        </Section>

        <Section title="6. Children's Information and School Compliance">
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>COPPA</p>
          <P>
            Information about children on TumbleTree is entered by school staff or authorized
            parents — not by children themselves. Schools are responsible for obtaining any
            required parental consent under the Children's Online Privacy Protection Act (COPPA)
            before enrolling students and entering their information into TumbleTree.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>FERPA</p>
          <P>
            For schools subject to the Family Educational Rights and Privacy Act (FERPA), TumbleTree
            acts as a "school official" with a legitimate educational interest, using student data
            solely to provide services to the school. We do not use or share student education
            records for any other purpose. Schools remain the data controller for all student
            records and are responsible for compliance with FERPA obligations.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>School responsibility</p>
          <P>
            By using TumbleTree, your school represents that it has the authority to enter
            information about its students, that required consents have been obtained, and that
            access has been granted only to authorized staff and parents.
          </P>
        </Section>

        <Section title="7. Privacy">
          <P>
            Your use of TumbleTree is also governed by our{' '}
            <a href="/privacy" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>Privacy Policy</a>,
            which is incorporated into these Terms by reference. By using TumbleTree, you consent
            to the data practices described in the Privacy Policy.
          </P>
        </Section>

        <Section title="8. Push Notifications">
          <P>
            If you enable push notifications, you consent to receiving alerts about classroom
            activity. You can withdraw consent at any time through your device settings or the
            Profile page. We do not send marketing notifications.
          </P>
        </Section>

        <Section title="9. Platform Availability">
          <P>
            We aim to keep TumbleTree available and reliable, but we do not guarantee
            uninterrupted access. The platform may be unavailable during maintenance, updates,
            or events outside our control. We are not liable for any loss or inconvenience
            caused by downtime.
          </P>
        </Section>

        <Section title="10. Termination">
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>By you</p>
          <P>
            You may close your account at any time by contacting us at{' '}
            <a href="mailto:admin@tumble-tree.com" style={{ color: 'var(--green-leaf)', fontWeight: 600 }}>admin@tumble-tree.com</a>.
            Upon closure, your personal data will be deleted within 30 days.
          </P>

          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>By us</p>
          <P>
            We may suspend or terminate your account at any time, with or without notice, if you
            violate these Terms, if a school removes your classroom membership, or if we determine
            continuation of your access poses a risk to the platform or other users. Sections 5,
            11, 12, and 13 survive termination.
          </P>
        </Section>

        <Section title="11. Disclaimers">
          <P>
            TumbleTree is provided "as is" and "as available" without warranties of any kind,
            express or implied. We do not warrant that the platform will be error-free, secure,
            or continuously available. Your use of the platform is at your own risk.
          </P>
          <P>
            We are not responsible for the content posted by users, the accuracy of information
            entered by school staff, or any decisions made based on that information.
          </P>
        </Section>

        <Section title="12. Limitation of Liability">
          <P>
            To the fullest extent permitted by law, TumbleTree and its operators shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages
            arising from your use of or inability to use the platform — including but not limited
            to loss of data, loss of profits, or unauthorized access to your account.
          </P>
          <P>
            Our total liability to you for any claim arising under these Terms shall not exceed
            the amount you paid to use TumbleTree in the twelve months preceding the claim, or
            $100, whichever is greater.
          </P>
        </Section>

        <Section title="13. Indemnification">
          <P>
            You agree to indemnify and hold harmless TumbleTree and its operators from any claims,
            damages, losses, or expenses (including reasonable legal fees) arising from your use
            of the platform, your violation of these Terms, or your violation of any third-party
            rights, including the privacy rights of children whose information you upload.
          </P>
        </Section>

        <Section title="14. Changes to These Terms">
          <P>
            We may update these Terms from time to time. When we do, we will update the effective
            date at the top of this page. For material changes, we will notify users via email or
            an in-app notice. Continued use of TumbleTree after changes take effect constitutes
            acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="15. Governing Law">
          <P>
            These Terms are governed by the laws of the United States. Any disputes arising under
            these Terms will be resolved in good faith between the parties before pursuing formal
            legal proceedings.
          </P>
        </Section>

        <Section title="16. Contact Us">
          <P>
            Questions about these Terms? Contact us:
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
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>TumbleTree</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/about" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>About</a>
          <a href="/contact" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
          <a href="/terms" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          <a href="/login" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</a>
        </div>
      </div>
    </div>
  )
}
