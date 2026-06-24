import webpush from 'web-push'

export async function sendPush(subscription, payload) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'sent'
  } catch (err) {
    // 404/410 means the subscription is no longer valid
    if (err.statusCode === 404 || err.statusCode === 410) return 'expired'
    console.error('Push send error:', err.message)
    return 'error'
  }
}
