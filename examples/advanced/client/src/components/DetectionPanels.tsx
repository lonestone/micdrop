import { SMART_TURN_HELP, useDetection, VAD_INFO, vads } from '../detection'
import DetectorCard from './DetectorCard'
import SileroVADSettings from './SileroVADSettings'
import SmartTurnSettings from './SmartTurnSettings'
import VADIndicator from './VADIndicator'
import VolumeVADSettings from './VolumeVADSettings'

/**
 * Every detector the call can run, each one switchable on its own.
 *
 * Voice detection says what is worth sending, turn detection says when the
 * turn is over, so the two answer different questions and stack rather than
 * replace each other.
 */
export default function DetectionPanels() {
  const {
    vads: enabled,
    smartTurn: turnEnabled,
    loading,
    error,
    toggleVAD,
    toggleSmartTurn,
    serverTurnDetection,
  } = useDetection()

  const lastOneOn = VAD_INFO.filter((info) => enabled[info.name]).length === 1

  return (
    <>
      {VAD_INFO.map((info) => (
        <DetectorCard
          key={info.name}
          name={info.label}
          description={info.help}
          enabled={enabled[info.name]}
          // The microphone always keeps one way of hearing speech
          lockedOn={enabled[info.name] && lastOneOn}
          onToggle={(next) => toggleVAD(info.name, next)}
          status={
            enabled[info.name] ? (
              <VADIndicator vad={vads[info.name]} />
            ) : undefined
          }
        >
          {info.name === 'volume' ? (
            <VolumeVADSettings vad={vads.volume} />
          ) : (
            <SileroVADSettings vad={vads.silero} />
          )}
        </DetectorCard>
      ))}

      <DetectorCard
        name="Smart Turn"
        description={SMART_TURN_HELP}
        // The server weighs the turns, so the browser leaves them alone
        enabled={turnEnabled && !serverTurnDetection}
        lockedOff={serverTurnDetection}
        onToggle={toggleSmartTurn}
        note={
          serverTurnDetection
            ? 'On the server'
            : loading
              ? 'Loading the model'
              : undefined
        }
      >
        <SmartTurnSettings />
      </DetectorCard>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
    </>
  )
}
