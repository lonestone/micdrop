import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme'

interface StatusPillProps {
  label: string
  color: string
}

/** Says what the call is doing right now */
export function StatusPill({ label, color }: StatusPillProps) {
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
})
