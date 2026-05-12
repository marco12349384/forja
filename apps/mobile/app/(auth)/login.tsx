import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInWithEmail } from '@forja/api-client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await signInWithEmail(supabase, email, password);
    if (error) setError('Email o contraseña incorrectos');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1 justify-center px-6 gap-8">
        <View className="items-center">
          <Text className="text-6xl mb-2">⚒️</Text>
          <Text className="text-3xl font-bold text-white">Forja</Text>
          <Text className="text-zinc-400 mt-1">Forja tu mejor versión</Text>
        </View>

        <View className="gap-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#71717a"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#71717a"
            secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base"
          />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-orange-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-zinc-400">
          ¿Sin cuenta?{' '}
          <Link href="/(auth)/signup" className="text-orange-400 font-semibold">
            Regístrate gratis
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
