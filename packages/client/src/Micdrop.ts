import { MicdropClient } from './client'

const globalScope = globalThis as typeof globalThis & {
  micdropClient?: MicdropClient
}

// One client for the whole app, kept across fast refreshes
if (!globalScope.micdropClient) {
  globalScope.micdropClient = new MicdropClient()
}

export const Micdrop = globalScope.micdropClient
