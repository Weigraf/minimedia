import admin from 'firebase-admin'

function getApp() {
  if (admin.apps.length) return admin.apps[0]
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

export async function sendFCMPush(tokens, payload) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !tokens.length) return { sent: 0, expired: [] }

  const app = getApp()
  const messaging = admin.messaging(app)

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: { url: payload.url ?? '/' },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
  })

  const expired = []
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code
      if (code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token') {
        expired.push(tokens[i])
      }
    }
  })

  return { sent: response.successCount, expired }
}
