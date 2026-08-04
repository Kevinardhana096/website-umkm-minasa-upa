import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthPage } from '@/components/AuthPage';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : '';

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle<{ role: 'toko' | 'admin' | 'anggota' }>();
      if (profile?.role === 'admin') redirect('/admin');
      if (profile?.role === 'toko') redirect('/dashboard');
      if (profile?.role === 'anggota') redirect('/katalog');
    }
  }

  return <AuthPage />;
}
