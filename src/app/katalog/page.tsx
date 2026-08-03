import { CatalogPage } from '@/components/CatalogPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';

export const revalidate = 60;

export default async function Katalog() {
  const catalog = await getPublicCatalog();

  return (
    <CatalogPage
      initialProducts={catalog?.products ?? (catalog === null ? mockProducts : [])}
      store={catalog?.store ?? null}
    />
  );
}
