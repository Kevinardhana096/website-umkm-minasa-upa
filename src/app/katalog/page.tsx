import { CatalogPage } from '@/components/CatalogPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

async function getViewer() {
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
      return { role: profile?.role, userId };
    }
  }

  return { role: undefined, userId: undefined };
}

export default async function Katalog() {
  // Catalog and session data are independent, so start both network requests
  // together instead of serializing them on every navigation.
  const [catalog, viewer] = await Promise.all([getPublicCatalog(), getViewer()]);

  return (
    <CatalogPage
      initialProducts={catalog?.products ?? (catalog === null ? mockProducts : [])}
      store={catalog?.store ?? null}
      storeOptions={catalog?.stores ?? []}
      viewerRole={viewer.role}
      viewerUserId={viewer.userId}
    />
  );
}
