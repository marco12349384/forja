import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@/lib/tokenCache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === '(auth)';

    if (!isSignedIn && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && (inAuth || segments.length === 0)) {
      router.replace('/(app)/home');
    }
  }, [isLoaded, isSignedIn, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}
