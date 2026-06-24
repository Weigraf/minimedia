import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'

export const config = { api: { bodyParser: false } }

export async function POST(request) {
  const stripe = getStripe()
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  const activeStatuses = ['active', 'trialing']

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object
      const status = activeStatuses.includes(sub.status) ? 'premium' : 'free'
      await supabase
        .from('school_settings')
        .upsert({
          id: 1,
          stripe_customer_id: sub.customer,
          subscription_status: status,
          subscription_id: sub.id,
        })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabase
        .from('school_settings')
        .upsert({
          id: 1,
          stripe_customer_id: sub.customer,
          subscription_status: 'free',
          subscription_id: null,
        })
      break
    }
  }

  return Response.json({ received: true })
}
