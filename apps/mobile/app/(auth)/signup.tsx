import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signUpWithEmail } from '@forja/api-client';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUpWithEmail(supabase, email, password, name);
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 gap-8 py-12">
        <View className="items-center">
          <Text className="text-6xl mb-2">⚒️</Text>
          <Text className="text-3xl font-bold text-white">Forja</Text>
          <Text className="text-zinc-400 mt-1">Crea tu cuenta gratis</Text>
        </View>
        <View className="gap-4">
          <TextInput value={name} onChangeText={setName} placeholder="Tu nombre"
            placeholderTextColor="#71717a"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email"
            placeholderTextColor="#71717a" keyboardType="email-address" autoCapitalize="none"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          <TextInput value={password} onChangeText={setPassword}
            placeholder="Contraseña (mín. 8 caracteres)"
            placeholderTextColor="#71717a" secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base" />
          {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
          <TouchableOpacity onPress={handleSignup} disabled={loading}
            className="bg-orange-500 rounded-2xl py-4 items-center">
            <Text className="text-white font-bold text-base">
              {loading ? 'Creando cuenta...' : 'Crear cuenta — Es gratis'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-center text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/(auth)/login" className="text-orange-400 font-semibold">Inicia sesión</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
