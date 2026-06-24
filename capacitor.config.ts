import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.TumbleTree.app',
  appName: 'TumbleTree',
  webDir: 'out',
  server: {
    // Load the live Vercel deployment — keeps API routes working and
    // lets us ship updates without a new app store release.
    url: 'https://minimedia-blue.vercel.app',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#27500A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#27500A',
    },
  },
}

export default config
