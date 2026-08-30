import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius } from '../theme'

interface ControlButtonProps {
  label: string
  icon: string
  active?: boolean
  disabled?: boolean
  onPress: () => void
}

/** One of the small round buttons under the conversation */
export function ControlButton({
  label,
  icon,
  active,
  disabled,
  onPress,
}: ControlButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.medium,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: 12,
  },
  active: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.text,
  },
})
