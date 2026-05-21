import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MessageCircle, Send } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';

const PREVIEW_MESSAGES = [
  { role: 'assistant', text: 'Hi! I'm your CitySettle guide. Which city are you moving to?', delay: 160 },
  { role: 'user', text: 'Bengaluru — joining a startup in Koramangala.', delay: 240 },
  { role: 'assistant', text: 'Great choice! What's your approximate monthly rent budget?', delay: 320 },
];

export default function ChatTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="AI Guide" subtitle="Ask anything about your new city" />

        <Card delay={100} style={styles.card}>
          <View style={styles.iconRow}>
            <MessageCircle color="#C65D3A" size={18} strokeWidth={1.75} />
            <Text variant="label" size="sm" color="accent" style={styles.phaseTag}>
              Phase 4
            </Text>
          </View>
          <Text variant="body" size="base" style={styles.body}>
            A conversational AI guide powered by Claude. Ask about neighbourhood safety, commute routes, cost of living, best schools, and more — all grounded in real data.
          </Text>
        </Card>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 140 }}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Preview conversation
          </Text>
        </MotiView>

        <View style={styles.messages}>
          {PREVIEW_MESSAGES.map((msg, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: msg.delay }}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                variant="body"
                size="sm"
                style={{ color: msg.role === 'user' ? '#FAF7F2' : '#1A1A1A', lineHeight: 20 }}
              >
                {msg.text}
              </Text>
            </MotiView>
          ))}

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 420 }}
            style={styles.typing}
          >
            <Skeleton width={60} height={12} radius={4} />
          </MotiView>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 480 }}
          style={styles.inputRow}
        >
          <View style={styles.fakeInput}>
            <Text variant="body" size="sm" color="muted">
              Ask about Indiranagar…
            </Text>
          </View>
          <View style={styles.sendBtn}>
            <Send color="#FAF7F2" size={16} strokeWidth={1.75} />
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { marginBottom: 24 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseTag: { letterSpacing: 0.2 },
  body: { lineHeight: 22, color: '#5C5650' },
  sectionLabel: { marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  messages: { gap: 10, marginBottom: 16 },
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '82%',
  },
  assistantBubble: {
    backgroundColor: '#F5F1EA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#C65D3A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  typing: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  fakeInput: {
    flex: 1,
    backgroundColor: '#F5F1EA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sendBtn: {
    backgroundColor: '#C65D3A',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
