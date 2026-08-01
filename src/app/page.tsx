import { CatalogPage } from '@/components/CatalogPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const catalog = await getPublicCatalog();

  return (
    <CatalogPage
      initialProducts={catalog?.products ?? (catalog === null ? mockProducts : [])}
      store={catalog?.store ?? null}
    />
  );
}
