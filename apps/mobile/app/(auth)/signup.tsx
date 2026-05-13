import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignupScreen() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!isLoaded) return;
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true); setError('');
    try {
      await signUp.create({ emailAddress: email, password, firstName: name });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Error al crear cuenta');
    } finally { setLoading(false); }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true); setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/onboarding');
      }
    } catch {
      setError('Código incorrecto');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 gap-8 py-12">
        <View className="items-center">
          <Text className="text-6xl mb-2">⚒️</Text>
          <Text className="text-3xl font-bold text-white">Forja</Text>
          <Text className="text-zinc-400 mt-1">
            {step === 'form' ? 'Crea tu cuenta gratis' : 'Verifica tu email'}
          </Text>
        </View>
        {step === 'form' ? (
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
            <TouchableOpacity onPress={handleSignup} disabled={loading || !isLoaded}
              className="bg-orange-500 rounded-2xl py-4 items-center">
              <Text className="text-white font-bold text-base">
                {loading ? 'Creando cuenta...' : 'Crear cuenta — Es gratis'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            <Text className="text-zinc-400 text-center">Enviamos un código a {email}</Text>
            <TextInput value={code} onChangeText={setCode} placeholder="000000"
              placeholderTextColor="#71717a" keyboardType="number-pad" maxLength={6}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-2xl text-center tracking-widest" />
            {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}
            <TouchableOpacity onPress={handleVerify} disabled={loading}
              className="bg-orange-500 rounded-2xl py-4 items-center">
              <Text className="text-white font-bold text-base">
                {loading ? 'Verificando...' : 'Verificar →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <Text className="text-center text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/(auth)/login" className="text-orange-400 font-semibold">Inicia sesión</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
