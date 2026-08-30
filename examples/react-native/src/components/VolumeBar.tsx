import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, volumeRatio } from '../theme'

interface VolumeBarProps {
  label: string
  volume: number
  color: string
}

/** A level meter for the microphone or for the assistant voice */
export function VolumeBar({ label, volume, color }: VolumeBarProps) {
  const ratio = volumeRatio(volume)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { backgroundColor: color, width: `${ratio * 100}%` },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  track: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.small,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.small,
    height: '100%',
  },
})
