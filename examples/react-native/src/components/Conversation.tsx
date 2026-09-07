import { MicdropConversation } from '@micdrop/react-native'
import React, { useRef } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme'

interface ConversationProps {
  conversation: MicdropConversation
  /**
   * The answer as the agent writes it, sent by a server running with
   * `partialMessages`. Empty until the first words arrive, and empty again once
   * the finished message has taken its place in the conversation.
   */
  partialAssistantMessage?: string
}

/** What has been said so far, kept scrolled to the last message */
export function Conversation({
  conversation,
  partialAssistantMessage = '',
}: ConversationProps) {
  const scrollView = useRef<React.ComponentRef<typeof ScrollView>>(null)

  const said = conversation.filter(
    (item) => item.role === 'user' || item.role === 'assistant'
  )

  // The answer being written takes the place the finished one will occupy, so
  // the two share a key and the bubble stays put when the message settles
  const messages: MicdropConversation = partialAssistantMessage
    ? [...said, { role: 'assistant', content: partialAssistantMessage }]
    : said

  const handleContentSizeChange = () => {
    scrollView.current?.scrollToEnd({ animated: true })
  }

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Start the call and say something. What you say and what the assistant
          answers shows up here.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      ref={scrollView}
      contentContainerStyle={styles.content}
      onContentSizeChange={handleContentSizeChange}
      style={styles.container}
    >
      {messages.map((item, index) => (
        <View
          key={index}
          style={[
            styles.bubble,
            item.role === 'user' ? styles.user : styles.assistant,
          ]}
        >
          <Text style={styles.role}>
            {item.role === 'user' ? 'You' : 'Assistant'}
          </Text>
          <Text style={styles.text}>
            {'content' in item ? item.content : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 10,
    paddingVertical: 4,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bubble: {
    borderRadius: radius.medium,
    gap: 4,
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accentSoft,
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  role: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  text: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
})
