import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, spacing, radius, shadows } from '@/design/tokens';

// ── Types ────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'socio';
  text: string;
  timestamp: Date;
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '·'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md }}>
      {/* SOCIO avatar */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.ai}20`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${colors.ai}30`,
        }}
      >
        <Text style={{ fontSize: 16 }}>💬</Text>
      </View>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderBottomLeftRadius: 4,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: colors.border,
          minWidth: 64,
        }}
      >
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 16, color: colors.ai, letterSpacing: 4 }}>
          {dots || '···'}
        </Text>
      </View>
    </View>
  );
}

// ── Message bubble ───────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View
      style={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      {!isUser && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${colors.ai}20`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${colors.ai}30`,
          }}
        >
          <Text style={{ fontSize: 16 }}>💬</Text>
        </View>
      )}
      <View
        style={{
          maxWidth: '78%',
          backgroundColor: isUser ? colors.primary : colors.surface,
          borderRadius: radius.lg,
          borderBottomRightRadius: isUser ? 4 : radius.lg,
          borderBottomLeftRadius: isUser ? radius.lg : 4,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
          ...(isUser ? {} : shadows.card),
        }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 15,
            color: isUser ? '#FFF' : colors.text,
            lineHeight: 22,
          }}
        >
          {msg.text}
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 11,
            color: isUser ? 'rgba(255,255,255,0.6)' : colors.subtle,
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {msg.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ── Context chips ────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '🥗', label: '¿Qué como hoy?' },
  { icon: '💪', label: 'Ajusta mi entreno' },
  { icon: '😴', label: 'Dormí poco' },
  { icon: '🏠', label: 'Hoy entreno en casa' },
  { icon: '📊', label: 'Mi progreso esta semana' },
];

// ── Initial SOCIO greeting ────────────────────────────────────────
function getGreeting(name: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'mañana' : hour < 19 ? 'tarde' : 'noche';
  return `Buenas ${time}, ${name}! 👋 Soy tu SOCIO. Estoy aquí para ayudarte con tu entrenamiento, dieta, y lo que necesites. ¿Cómo puedo apoyarte hoy?`;
}

// ── Main SOCIO screen ─────────────────────────────────────────────
export default function SOCIOScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const userName = user?.firstName ?? 'Socio';

  // Initialize with SOCIO greeting
  useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'socio',
        text: getGreeting(userName),
        timestamp: new Date(),
      },
    ]);
  }, [userName]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/socio/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.slice(-10).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          }),
        }
      );
      const data = await res.json();
      const socioMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'socio',
        text: data.reply ?? 'No pude responder ahora. Intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, socioMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'socio', text: 'Hubo un error al conectarme. ¿Tienes internet?', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: `${colors.ai}20`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: `${colors.ai}40`,
          }}
        >
          <Text style={{ fontSize: 22 }}>💬</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text }}>
            SOCIO
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted }}>
              Tu compañero de fitness
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
      </ScrollView>

      {/* Quick prompts */}
      {messages.length <= 1 && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm }}
          style={{ maxHeight: 50, flexGrow: 0 }}
        >
          {QUICK_PROMPTS.map((qp) => (
            <TouchableOpacity
              key={qp.label}
              onPress={() => sendMessage(qp.label)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: spacing.md,
                paddingVertical: 8,
                backgroundColor: colors.surface,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: `${colors.ai}30`,
              }}
            >
              <Text style={{ fontSize: 14 }}>{qp.icon}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted }}>
                {qp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
          alignItems: 'flex-end',
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pregúntale algo a tu SOCIO..."
          placeholderTextColor={colors.subtle}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(input)}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: input ? colors.ai : colors.border,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: 12,
            fontFamily: 'DMSans_400Regular',
            fontSize: 15,
            color: colors.text,
            maxHeight: 120,
            lineHeight: 22,
          }}
        />
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
          style={[
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: input.trim() && !loading ? colors.ai : `${colors.ai}30`,
              alignItems: 'center',
              justifyContent: 'center',
            },
            input.trim() && !loading ? shadows.ai : undefined,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={{ fontSize: 18 }}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
