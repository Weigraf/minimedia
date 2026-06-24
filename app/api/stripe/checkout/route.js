import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'

const APP_URL = 'https://minimedia-blue.vercel.app'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Only admins can manage subscriptions' }, { status: 403 })
  }

  const stripe = getStripe()

  // Get or create Stripe customer tied to school_settings
  const { data: settings } = await supabase
    .from('school_settings')
    .select('stripe_customer_id')
    .single()

  let customerId = settings?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile.full_name ?? 'TumbleTree Admin',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('school_settings')
      .upsert({ id: 1, stripe_customer_id: customerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/admin/approvals?upgraded=1`,
    cancel_url: `${APP_URL}/subscribe`,
    allow_promotion_codes: true,
  })

  return Response.json({ url: session.url })
}
