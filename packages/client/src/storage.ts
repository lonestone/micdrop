/**
 * Where settings that outlive a call are kept.
 *
 * A browser has `localStorage`, a phone has whatever the app installs. Reads
 * are synchronous, so a VAD can be built with its saved options in hand.
 */
export interface MicdropStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export enum MicdropStorageKeys {
  MicDevice = 'micdrop.micDevice',
  SpeakerDevice = 'micdrop.speakerDevice',
  VolumeVADOptions = 'micdrop.VolumeVADOptions',
  SileroVADOptions = 'micdrop.SileroVADOptions',
}

/** Remembers nothing, which is what a platform without storage gets */
class MemoryStorage implements MicdropStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

let current: MicdropStorage = new MemoryStorage()

/**
 * Chooses where settings are kept
 * @param storage - Anything with the three `localStorage` methods
 */
export function setMicdropStorage(storage: MicdropStorage) {
  current = storage
}

export const storage: MicdropStorage = {
  getItem: (key) => {
    try {
      return current.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      current.setItem(key, value)
    } catch {
      // A browser in private mode, or a full disk. Settings are a convenience.
    }
  },
  removeItem: (key) => {
    try {
      current.removeItem(key)
    } catch {
      // Same
    }
  },
}
