import { ProfilPage } from '@/components/ProfilPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';

export const revalidate = 60;

export default async function Home() {
  const catalog = await getPublicCatalog();

  return (
    <ProfilPage
      products={catalog?.products ?? (catalog === null ? mockProducts : [])}
      store={catalog?.store ?? null}
    />
  );
}
