import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Send, RotateCcw } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Chip } from '../../components/ui/Chip';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: boolean;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
    >
      <Text variant="body" size="base" color="muted" style={styles.dots}>
        ● ● ●
      </Text>
    </MotiView>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  item,
  onRetry,
}: {
  item: ChatMessage;
  onRetry: () => void;
}) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {item.streaming && item.content === '' ? (
        <TypingDots />
      ) : (
        <Text
          variant="body"
          size="sm"
          style={{
            color: isUser ? '#FAF7F2' : '#1A1A1A',
            lineHeight: 20,
          }}
        >
          {item.content}
        </Text>
      )}
      {item.error && (
        <Pressable onPress={onRetry} style={styles.retryRow}>
          <RotateCcw size={12} color="#C65D3A" strokeWidth={1.75} />
          <Text variant="label" size="xs" color="accent" style={styles.retryLabel}>
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatTab() {
  const session = useAuthStore((s) => s.session);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [neighborhood, setNeighborhood] = useState('your area');
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Load neighborhood name for suggested questions
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from('recommendations')
      .select('neighborhood_id, neighborhoods(name)')
      .eq('user_id', session.user.id)
      .order('score', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        const raw = data?.neighborhoods as unknown;
        const nbName = Array.isArray(raw)
          ? (raw[0] as { name?: string } | undefined)?.name
          : (raw as { name?: string } | null | undefined)?.name;
        if (nbName) setNeighborhood(nbName);
      });
  }, [session?.user?.id]);

  // Load existing chat history on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from('chat_messages')
      .select('id, role, content')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(
            data.map((m) => ({
              id: m.id as string,
              role: m.role as 'user' | 'assistant',
              content: m.content as string,
            })),
          );
        }
      });
  }, [session?.user?.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming || !session?.access_token) return;

      const trimmed = text.trim();
      const userMsgId = `user-${Date.now()}`;
      const streamingId = `assistant-${Date.now() + 1}`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: trimmed },
        { id: streamingId, role: 'assistant', content: '', streaming: true },
      ]);
      setInput('');
      setStreaming(true);
      setLastFailedInput(null);
      inputRef.current?.blur();

      try {
        const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ask-city`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!response.ok) {
          throw new Error(`Server error ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Streaming not supported on this platform');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;

            try {
              const event = JSON.parse(payload) as
                | { type: 'token'; text: string }
                | { type: 'done' }
                | { type: 'error'; message: string };

              if (event.type === 'token') {
                accText += event.text;
                const captured = accText;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId ? { ...m, content: captured } : m,
                  ),
                );
              } else if (event.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId ? { ...m, streaming: false } : m,
                  ),
                );
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
        }
      } catch (err) {
        const errMsg =
          err instanceof Error && err.message.includes('rate limit')
            ? 'Rate limit reached. Please wait a moment and retry.'
            : 'Something went wrong. Tap retry to try again.';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === `assistant-${Date.now() + 1}` || (m.role === 'assistant' && m.streaming)
              ? { ...m, content: errMsg, streaming: false, error: true }
              : m,
          ),
        );
        setLastFailedInput(trimmed);
      } finally {
        setStreaming(false);
      }
    },
    [streaming, session],
  );

  // Inverted FlatList needs data newest-first (index 0 = newest = bottom)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const suggestedQuestions = useMemo(
    () => [
      `Is ${neighborhood} safe at night?`,
      `Best PG options in ${neighborhood}?`,
      `How's the water supply situation?`,
      `Weekend things to do near ${neighborhood}?`,
    ],
    [neighborhood],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <MessageBubble
        item={item}
        onRetry={() => lastFailedInput && sendMessage(lastFailedInput)}
      />
    ),
    [lastFailedInput, sendMessage],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.header}
        >
          <Text variant="display" size="2xl" style={styles.headerTitle}>
            Ask the City
          </Text>
          <Text variant="body" size="sm" color="muted">
            Your local friend, powered by Claude
          </Text>
        </MotiView>

        {/* Messages or empty state */}
        {messages.length === 0 ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 120 }}
            style={styles.emptyState}
          >
            <Text variant="body" size="sm" color="muted" style={styles.emptyHint}>
              Try one of these to get started
            </Text>
            <View style={styles.chipGrid}>
              {suggestedQuestions.map((q, i) => (
                <Chip
                  key={q}
                  label={q}
                  delay={80 * i}
                  onPress={() => sendMessage(q)}
                />
              ))}
            </View>
          </MotiView>
        ) : (
          <FlatList
            data={invertedMessages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}

        {/* Input bar */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 180 }}
          style={styles.inputRow}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={`Ask about ${neighborhood}…`}
            placeholderTextColor="#9B8E82"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline
            maxLength={2000}
            editable={!streaming}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            style={[
              styles.sendBtn,
              (!input.trim() || streaming) && styles.sendBtnDisabled,
            ]}
            disabled={!input.trim() || streaming}
          >
            {streaming ? (
              <ActivityIndicator size="small" color="#FAF7F2" />
            ) : (
              <Send color="#FAF7F2" size={16} strokeWidth={1.75} />
            )}
          </Pressable>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  flex: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E0',
  },
  headerTitle: {
    marginBottom: 2,
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  emptyHint: {
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '82%',
  },
  assistantBubble: {
    backgroundColor: '#F0EBE3',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#C65D3A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },

  dots: {
    letterSpacing: 4,
  },

  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  retryLabel: {
    marginLeft: 4,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE8E0',
    backgroundColor: '#FAF7F2',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0EBE3',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: '#C65D3A',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D4B8AE',
  },
});
