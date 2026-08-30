import Constants from 'expo-constants'
import { Platform } from 'react-native'

const PORT = 8087

// An Android emulator has its own loopback, so `localhost` there is the
// emulator rather than the machine running the server. This alias is how it
// reaches its host.
const ANDROID_EMULATOR_HOST = '10.0.2.2'
const LOOPBACK = ['localhost', '127.0.0.1']

/**
 * Address of the server started by `server/src/server.ts`.
 *
 * Expo knows the address the app was loaded from, which is the machine running
 * the server, so a simulator, an emulator and a phone on the same Wi-Fi all
 * reach it without anything to configure.
 */
export function getServerUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
      ?.debuggerHost

  let host = hostUri?.split(':')[0] ?? 'localhost'

  if (Platform.OS === 'android' && LOOPBACK.includes(host)) {
    host = ANDROID_EMULATOR_HOST
  }

  return `ws://${host}:${PORT}`
}
