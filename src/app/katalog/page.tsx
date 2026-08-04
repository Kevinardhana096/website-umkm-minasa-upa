import { CatalogPage } from '@/components/CatalogPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function Katalog() {
  const catalog = await getPublicCatalog();
  let viewerRole: 'toko' | 'admin' | 'anggota' | undefined;
  let viewerUserId: string | undefined;

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
      viewerRole = profile?.role;
      viewerUserId = userId;
    }
  }

  return (
    <CatalogPage
      initialProducts={catalog?.products ?? (catalog === null ? mockProducts : [])}
      store={catalog?.store ?? null}
      storeOptions={catalog?.stores ?? []}
      viewerRole={viewerRole}
      viewerUserId={viewerUserId}
    />
  );
}
