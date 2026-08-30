import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius } from '../theme'

interface CallButtonProps {
  isStarted: boolean
  isStarting: boolean
  onPress: () => void
}

/** The one button that opens and closes the call */
export function CallButton({
  isStarted,
  isStarting,
  onPress,
}: CallButtonProps) {
  const label = isStarted ? 'Hang up' : 'Start the call'

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={isStarting}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isStarted && styles.hangUp,
        pressed && styles.pressed,
      ]}
    >
      {isStarting ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.label}>
          {isStarted ? '📞  Hang up' : '🎤  Start the call'}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.large,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  hangUp: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
})
