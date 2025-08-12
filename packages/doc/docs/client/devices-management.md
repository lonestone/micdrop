# Device Management

Select and manage microphone and speaker devices for optimal audio quality and user preference.

## Quick Start

Access available devices and change them using MicdropClient methods:

```typescript
import { Micdrop } from '@micdrop/client'

// Get available devices
console.log('Microphones:', Micdrop.micDevices)
console.log('Speakers:', Micdrop.speakerDevices)

// Change devices
await Micdrop.changeMicDevice('mic-device-id')
await Micdrop.changeSpeakerDevice('speaker-device-id')
```

## Device Listing

### Get Available Microphones

```typescript
// Access microphone devices
const micDevices = Micdrop.micDevices

micDevices.forEach((device) => {
  console.log('Mic:', device.label || 'Unknown Device')
  console.log('ID:', device.deviceId)
  console.log('Group:', device.groupId)
})

// Current microphone device
console.log('Current mic:', Micdrop.micDeviceId)
```

### Get Available Speakers

```typescript
// Access speaker devices
const speakerDevices = Micdrop.speakerDevices

speakerDevices.forEach((device) => {
  console.log('Speaker:', device.label || 'Unknown Device')
  console.log('ID:', device.deviceId)
  console.log('Group:', device.groupId)
})

// Current speaker device
console.log('Current speaker:', Micdrop.speakerDeviceId)
```

## Device Selection

### Change Microphone

Switch to a different microphone device:

```typescript
// Change microphone by device ID
const newMicId = Micdrop.micDevices[1].deviceId
await Micdrop.changeMicDevice(newMicId)

console.log('Microphone changed to:', newMicId)
```

### Change Speaker

Switch to a different speaker/headphone device:

```typescript
// Change speaker by device ID
const newSpeakerId = Micdrop.speakerDevices[1].deviceId
await Micdrop.changeSpeakerDevice(newSpeakerId)

console.log('Speaker changed to:', newSpeakerId)
```

## Device Selection UI

### Device Dropdown Component

Create device selection interface:

```typescript
// Vanilla JavaScript device selector
function createDeviceSelector() {
  const micSelect = document.getElementById('micSelect')
  const speakerSelect = document.getElementById('speakerSelect')

  // Populate microphone options
  Micdrop.micDevices.forEach((device) => {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = device.label || 'Unknown Microphone'
    option.selected = device.deviceId === Micdrop.micDeviceId
    micSelect.appendChild(option)
  })

  // Populate speaker options
  Micdrop.speakerDevices.forEach((device) => {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = device.label || 'Unknown Speaker'
    option.selected = device.deviceId === Micdrop.speakerDeviceId
    speakerSelect.appendChild(option)
  })

  // Handle changes
  micSelect.addEventListener('change', async (e) => {
    await Micdrop.changeMicDevice(e.target.value)
  })

  speakerSelect.addEventListener('change', async (e) => {
    await Micdrop.changeSpeakerDevice(e.target.value)
  })
}
```

### React Device Component

```tsx
import { useState } from 'react'
import { Micdrop } from '@micdrop/client'
import { useMicdropState } from '@micdrop/react'

function DeviceSettings() {
  const state = useMicdropState()
  const [changing, setChanging] = useState(false)

  const changeMic = async (deviceId: string) => {
    setChanging(true)
    try {
      await Micdrop.changeMicDevice(deviceId)
    } finally {
      setChanging(false)
    }
  }

  const changeSpeaker = async (deviceId: string) => {
    setChanging(true)
    try {
      await Micdrop.changeSpeakerDevice(deviceId)
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="device-settings">
      <div className="device-group">
        <label>Microphone:</label>
        <select
          value={state.micDeviceId || ''}
          onChange={(e) => changeMic(e.target.value)}
          disabled={changing}
        >
          {state.micDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Microphone'}
            </option>
          ))}
        </select>
      </div>

      <div className="device-group">
        <label>Speaker:</label>
        <select
          value={state.speakerDeviceId || ''}
          onChange={(e) => changeSpeaker(e.target.value)}
          disabled={changing}
        >
          {state.speakerDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Speaker'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

## Device Testing

### Test Microphone

Check if microphone is working:

```typescript
// Test microphone input
function testMicrophone() {
  if (!Micdrop.isMicStarted) {
    console.log('Please start microphone first')
    return
  }

  // Listen for volume changes
  const volumeListener = (volume) => {
    const normalizedVolume = Math.max(0, volume + 100)
    console.log('Mic volume:', normalizedVolume)

    if (normalizedVolume > 10) {
      console.log('✅ Microphone is working!')
      // Stop listening after successful test
      Micdrop.micRecorder.analyser.off('volume', volumeListener)
    }
  }

  Micdrop.micRecorder.analyser.on('volume', volumeListener)

  // Stop test after 5 seconds
  setTimeout(() => {
    Micdrop.micRecorder.analyser.off('volume', volumeListener)
    console.log('Microphone test ended')
  }, 5000)
}
```

### Test Speaker

Check if speaker is working:

```typescript
// Test speaker output with a test sound
async function testSpeaker() {
  try {
    // Generate test tone
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure test tone
    oscillator.frequency.value = 440 // A note
    gainNode.gain.value = 0.1 // Low volume

    // Play for 1 second
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      audioContext.close()
      console.log('✅ Speaker test completed')
    }, 1000)

    console.log('🔊 Playing test tone...')
  } catch (error) {
    console.error('Speaker test failed:', error)
  }
}
```

## Device Monitoring

### Monitor Device Changes

Detect when devices are added/removed:

```typescript
// Listen for device changes
navigator.mediaDevices.addEventListener('devicechange', async () => {
  console.log('Devices changed, refreshing list...')

  // Refresh device list
  await navigator.mediaDevices.enumerateDevices()

  // Update UI if needed
  updateDeviceSelectors()
})

// Monitor state changes for device updates
Micdrop.on('StateChange', (state) => {
  // Check if selected devices are still available
  const currentMic = state.micDevices.find(
    (d) => d.deviceId === state.micDeviceId
  )
  const currentSpeaker = state.speakerDevices.find(
    (d) => d.deviceId === state.speakerDeviceId
  )

  if (!currentMic) {
    console.warn('Selected microphone no longer available')
    showDeviceWarning('microphone')
  }

  if (!currentSpeaker) {
    console.warn('Selected speaker no longer available')
    showDeviceWarning('speaker')
  }
})
```

## Device Permissions

### Request Permissions

Ensure proper device access:

```typescript
// Request microphone permission
async function requestMicPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })

    console.log('✅ Microphone permission granted')

    // Stop the test stream
    stream.getTracks().forEach((track) => track.stop())

    return true
  } catch (error) {
    console.error('❌ Microphone permission denied:', error)
    return false
  }
}

// Check current permissions
async function checkPermissions() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' })
    console.log('Microphone permission:', result.state)

    result.addEventListener('change', () => {
      console.log('Permission changed:', result.state)
    })

    return result.state === 'granted'
  } catch (error) {
    console.log('Permissions API not supported')
    return null
  }
}
```

## Device Storage

Device preferences are automatically persisted:

```typescript
// Device selection is automatically saved
await Micdrop.changeMicDevice('preferred-mic-id')
await Micdrop.changeSpeakerDevice('preferred-speaker-id')

// On next session, preferences are restored
await Micdrop.start({
  url: 'ws://localhost:8081',
}) // Will use saved device preferences
```

## Error Handling

### Handle Device Errors

```typescript
// Handle device change errors
async function safeChangeDevice(deviceId, type) {
  try {
    if (type === 'microphone') {
      await Micdrop.changeMicDevice(deviceId)
    } else {
      await Micdrop.changeSpeakerDevice(deviceId)
    }

    console.log(`✅ ${type} changed successfully`)
  } catch (error) {
    console.error(`❌ Failed to change ${type}:`, error.message)

    if (error.name === 'NotFoundError') {
      showError('Device not found. Please check connections.')
    } else if (error.name === 'NotAllowedError') {
      showError('Permission denied. Please allow device access.')
    } else {
      showError(`Failed to change ${type}. Please try again.`)
    }
  }
}
```

## Best Practices

### Default Device Selection

```typescript
// Choose best available devices automatically
function selectOptimalDevices() {
  const micDevices = Micdrop.micDevices
  const speakerDevices = Micdrop.speakerDevices

  // Prefer non-default devices (often better quality)
  const preferredMic =
    micDevices.find(
      (d) =>
        !d.label.toLowerCase().includes('default') &&
        !d.label.toLowerCase().includes('communications')
    ) || micDevices[0]

  const preferredSpeaker =
    speakerDevices.find(
      (d) =>
        !d.label.toLowerCase().includes('default') &&
        !d.label.toLowerCase().includes('communications')
    ) || speakerDevices[0]

  return { preferredMic, preferredSpeaker }
}
```

### Device Labels

```typescript
// Clean up device labels for display
function formatDeviceLabel(device) {
  if (!device.label) {
    return `${device.kind} (${device.deviceId.slice(0, 8)}...)`
  }

  // Remove common prefixes/suffixes
  let label = device.label
    .replace(/^Default - /, '')
    .replace(/ - Default$/, '')
    .replace(/\s*\([^)]*\)$/, '') // Remove parenthetical info

  return label
}
```

## Next Steps

- [**Error Handling**](./error-handling) - Handle device-related errors
- [**React Hooks**](./react-hooks) - Device management in React apps
- [**Utility Classes**](./utility-classes) - Direct access to Mic and Speaker APIs
