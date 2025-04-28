import { MultipleVAD } from './MultipleVAD'
import { SileroVAD } from './SileroVAD'
import { VAD } from './VAD'
import { VolumeVAD } from './VolumeVAD'

export type VADConfigName = 'volume' | 'silero'
export type VADConfig = VAD | VADConfigName | Array<VAD | VADConfigName>

export function getVAD(vad?: VADConfig): VAD {
  if (!vad) return new VolumeVAD()
  if (vad === 'volume') return new VolumeVAD()
  if (vad === 'silero') return new SileroVAD()
  if (Array.isArray(vad)) {
    return new MultipleVAD(vad)
  }
  return vad
}
