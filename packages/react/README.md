# @micdrop/react

React hooks for Micdrop voice conversation client.

## Installation

```bash
npm install @micdrop/react
```

## Usage

### useMicdropState

Hook to get the complete Micdrop state and subscribe to state changes.

```tsx
import { useMicdropState } from '@micdrop/react'

function MyComponent() {
  const state = useMicdropState()

  return <div>{state.isStarted ? 'Started' : 'Stopped'}</div>
}
```

### useMicdropEndCall

Hook to handle EndCall events.

```tsx
import { useMicdropEndCall } from '@micdrop/react'

function MyComponent() {
  useMicdropEndCall(() => {
    console.log('Call ended!')
    Micdrop.stop()
  })

  return <div>...</div>
}
```

### useMicdropError

Hook to handle Error events.

```tsx
import { useMicdropError } from '@micdrop/react'

function MyComponent() {
  useMicdropError((error) => {
    console.error('Micdrop error:', error.message)
  })

  return <div>...</div>
}
```

### useMicVolume

Hook to get microphone volume data.

```tsx
import { useMicVolume } from '@micdrop/react'

function MicVolumeIndicator() {
  const { micVolume, maxMicVolume } = useMicVolume()

  return (
    <div>
      Volume: {micVolume}
      Max: {maxMicVolume}
    </div>
  )
}
```

### useSpeakerVolume

Hook to get speaker volume data.

```tsx
import { useSpeakerVolume } from '@micdrop/react'

function SpeakerVolumeIndicator() {
  const { speakerVolume, maxSpeakerVolume } = useSpeakerVolume()

  return (
    <div>
      Volume: {speakerVolume}
      Max: {maxSpeakerVolume}
    </div>
  )
}
```
