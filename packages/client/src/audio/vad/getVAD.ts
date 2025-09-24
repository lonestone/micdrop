import { MultipleVAD } from './MultipleVAD'
import { SileroVAD } from './SileroVAD'
import { VAD } from './VAD'
import { VolumeVAD } from './VolumeVAD'

export type VADConfigName = 'volume' | 'silero'
export type VADConfig = VAD | VADConfigName | Array<VAD | VADConfigName>

const DefaultVAD = VolumeVAD

export function getVAD(vad?: VADConfig): VAD {
  if (!vad) return new DefaultVAD()
  if (vad === 'volume') return new VolumeVAD()
  if (vad === 'silero') return new SileroVAD()
  if (Array.isArray(vad)) {
    return new MultipleVAD(vad)
  }
  return vad
}

export function equalVADConfig(a?: VADConfig, b?: VADConfig): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.every((item, index) => equalVADConfig(item, b[index]))
  }
  return false
}
