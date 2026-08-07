import { CatalogPage } from '@/components/CatalogPage';
import { PublicCatalogAutoRefresh } from '@/components/PublicCatalogAutoRefresh';
import { getAdminCatalog, getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

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

function getCatalogProductsKey(products: Product[]) {
  let hash = 2_166_136_261;
  const content = JSON.stringify(products);
  for (let index = 0; index < content.length; index += 1) {
    hash = Math.imul(hash ^ content.charCodeAt(index), 16_777_619);
  }
  return `${products.length}-${(hash >>> 0).toString(36)}`;
}

export default async function Katalog() {
  const viewer = await getViewer();
  const adminCatalog = viewer.role === 'admin' ? await getAdminCatalog() : null;
  const catalog = adminCatalog ?? await getPublicCatalog();
  const demoProducts = process.env.NODE_ENV !== 'production' && catalog === null ? mockProducts : [];
  const catalogProducts = catalog?.products ?? demoProducts;

  return (
    <>
      <CatalogPage
        key={viewer.role === 'anggota' ? 'member-catalog' : getCatalogProductsKey(catalogProducts)}
        initialProducts={catalogProducts}
        store={catalog?.store ?? null}
        storeOptions={catalog?.stores ?? []}
        adminProductRows={adminCatalog?.productRows ?? []}
        viewerRole={viewer.role}
        viewerUserId={viewer.userId}
      />
      {viewer.role !== 'anggota' && <PublicCatalogAutoRefresh />}
    </>
  );
}
