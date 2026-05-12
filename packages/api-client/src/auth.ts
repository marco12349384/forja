import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export async function signUpWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
}

export async function signInWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut(supabase: SupabaseClient) {
  return supabase.auth.signOut();
}

export async function getCurrentUser(supabase: SupabaseClient) {
  return supabase.auth.getUser();
}
