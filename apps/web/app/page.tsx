import { redirect } from 'next/navigation';

// Middleware handles auth redirect — this is just a fallback
export default function RootPage() {
  redirect('/login');
}
