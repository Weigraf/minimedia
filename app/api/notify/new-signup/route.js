import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = 'https://minimedia-blue.vercel.app'

export async function POST(request) {
  const { name, email } = await request.json()
  if (!name || !email) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const adminEmail = process.env.NOTIFY_ADMIN_EMAIL
  if (!adminEmail) return Response.json({ ok: true, sent: 0 })

  await resend.emails.send({
    from: process.env.NOTIFY_FROM_EMAIL,
    to: [adminEmail],
    subject: `New account request on TumbleTree`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#27500A;margin-bottom:4px">New account request</h2>
        <p style="color:#555;margin-top:0;font-size:14px">
          <strong>${name}</strong> (<strong>${email}</strong>) has requested access to TumbleTree
          and is waiting for your approval.
        </p>
        <a href="${APP_URL}/admin/approvals"
           style="display:inline-block;background:#3B6D11;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:600;font-size:14px">
          Review in approvals →
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:24px">
          You're receiving this as the TumbleTree admin.
        </p>
      </div>
    `,
  })

  return Response.json({ ok: true, sent: 1 })
}
