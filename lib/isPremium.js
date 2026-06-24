import { createAdminClient } from '@/lib/supabase-admin'

export async function isPremium() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('school_settings')
    .select('subscription_status')
    .single()
  return data?.subscription_status === 'premium'
}
