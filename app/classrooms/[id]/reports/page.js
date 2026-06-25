'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { AcornIcon } from '@/components/Icons'

export default function ReportsPage() {
  const { id: classroomId } = useParams()
  const searchParams = useSearchParams()
  const preselectedChild = searchParams.get('child')

  const [profile, setProfile] = useState(null)
  const [premium, setPremium] = useState(false)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(preselectedChild ?? '')
  const [reports, setReports] = useState([])
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const isAdmin = profile?.role === 'admin' || profile?.role === 'classroom_admin'

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)

      const { data: settings } = await supabase.from('school_settings').select('subscription_status').single()
      if (settings?.subscription_status !== 'premium') { setLoading(false); return }
      setPremium(true)

      // Admins see all children in classroom; parents see only their assigned children
      let childQuery = supabase.from('children').select('id, name').eq('classroom_id', classroomId).order('name')
      if (p.role === 'parent') {
        const { data: fm } = await supabase.from('family_members').select('child_id').eq('profile_id', user.id)
        const ids = fm?.map(f => f.child_id) ?? []
        if (!ids.length) { setLoading(false); return }
        childQuery = childQuery.in('id', ids)
      }
      const { data: ch } = await childQuery
      setChildren(ch ?? [])
      if (preselectedChild && ch?.some(c => c.id === preselectedChild)) {
        setSelectedChild(preselectedChild)
        loadReports(preselectedChild, supabase)
      } else if (ch?.length) {
        setSelectedChild(ch[0].id)
        loadReports(ch[0].id, supabase)
      }
      setLoading(false)
    }
    load()
  }, [classroomId])

  async function loadReports(childId, supabaseClient) {
    const supabase = supabaseClient ?? createClient()
    const { data } = await supabase
      .from('progress_reports')
      .select('*, profiles(full_name)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
    setReports(data ?? [])
  }

  async function handleChildChange(childId) {
    setSelectedChild(childId)
    setReports([])
    if (childId) loadReports(childId)
  }

  async function saveReport(e) {
    e.preventDefault()
    if (!selectedChild || !title.trim() || !content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('progress_reports')
      .insert({ child_id: selectedChild, classroom_id: classroomId, author_id: user.id, title: title.trim(), content: content.trim() })
      .select('*, profiles(full_name)')
      .single()
    if (!error) {
      setReports(prev => [data, ...prev])
      setTitle('')
      setContent('')
    }
    setSaving(false)
  }

  async function deleteReport(reportId) {
    if (!confirm('Delete this report?')) return
    const supabase = createClient()
    await supabase.from('progress_reports').delete().eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  if (!loading && !premium) {
    return (
      <>
        <Navbar profile={profile} />
        <div className="page-sm" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <AcornIcon size={52} />
          <h2 style={{ marginTop: '1rem', color: 'var(--green-forest)' }}>Premium Feature</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem' }}>
            Progress reports require a Premium subscription.
          </p>
          <a href="/subscribe" className="btn btn-primary">View plans →</a>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar profile={profile} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a href={`/classrooms/${classroomId}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>← Classroom</a>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Progress Reports</h1>
        </div>

        {children.length === 0 && !loading ? (
          <div className="empty-state">
            {isAdmin ? (
              <>No students in this classroom. <a href="/admin/students">Add students →</a></>
            ) : (
              'No students assigned to your account yet.'
            )}
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <select
                  value={selectedChild}
                  onChange={e => handleChildChange(e.target.value)}
                  style={{ borderRadius: '50px', fontWeight: 600 }}
                >
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {children.length === 1 && (
              <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '1.25rem', color: 'var(--green-forest)' }}>
                {children[0].name}
              </div>
            )}

            {/* New report form — admins/classroom admins only */}
            {isAdmin && (
              <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--yellow-glow)', border: '1.5px solid var(--amber-honey)' }}>
                <div className="section-title">New Report</div>
                <form onSubmit={saveReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Report title (e.g. Spring 2025 Update)"
                    required
                  />
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write the progress report here…"
                    rows={6}
                    required
                    style={{ resize: 'vertical' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                    {saving ? 'Saving…' : 'Save report'}
                  </button>
                </form>
              </div>
            )}

            {/* Reports list */}
            {reports.length === 0 ? (
              <div className="empty-state">No reports yet for this child.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.map(r => (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          By {r.profiles?.full_name} · {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteReport(r.id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          Delete
                        </button>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                      {r.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
