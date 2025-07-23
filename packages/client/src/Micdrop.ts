import { MicdropClient } from './client'

// Setup and export MicdropClient instance
if (!window.micdropClient) {
  window.micdropClient = new MicdropClient()
}
export const Micdrop = window.micdropClient
