'use client'
import { useState } from 'react'
import { OwlIcon, SproutIcon, LeafIcon, MessageIcon } from '@/components/Icons'

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
        <a href="/contact" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--green-forest)', textDecoration: 'none' }}>Contact</a>
        <a href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>Sign in</a>
      </div>
    </nav>
  )
}

export default function Contact() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError('')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong — please try again.')
      setSending(false)
      return
    }

    setDone(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#eef3ea' }}>
      <PublicNav />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '3rem 1rem 4rem',
      }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <MessageIcon size={56} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--green-forest)', marginTop: '0.75rem', marginBottom: '0.375rem' }}>
              Get in touch
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Questions about TumbleTree for your school? We'd love to hear from you.
            </p>
          </div>

          <div className="card">
            {done ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <SproutIcon size={56} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-forest)', margin: '0.75rem 0 0.5rem' }}>
                  Message sent!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  Thanks for reaching out — we'll get back to you at <strong>{email}</strong> soon.
                </p>
                <a href="/" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: '1.25rem' }}>
                  Back to sign in
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="contact-name">Name</label>
                    <input
                      id="contact-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="jane@school.edu"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="contact-subject">Subject <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    id="contact-subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Setting up TumbleTree for our school"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Tell us about your school, how many classrooms you have, or any questions you have…"
                  />
                </div>

                {error && <div className="flash-error" role="alert" style={{ marginBottom: '0.75rem' }}>{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={sending}
                >
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Already have an account? <a href="/login" style={{ fontWeight: 700 }}>Sign in</a>
          </p>
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
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>TumbleTree</span>
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
