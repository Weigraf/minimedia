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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Only admins can manage subscriptions' }, { status: 403 })
  }

  const { data: settings } = await supabase
    .from('school_settings')
    .select('stripe_customer_id')
    .single()

  if (!settings?.stripe_customer_id) {
    return Response.json({ error: 'No subscription found' }, { status: 404 })
  }

  const stripe = getStripe()
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: settings.stripe_customer_id,
    return_url: `${APP_URL}/subscribe`,
  })

  return Response.json({ url: portalSession.url })
}
