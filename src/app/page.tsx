import { ProfilPage } from '@/components/ProfilPage';
import { getPublicCatalog } from '@/lib/catalog';
import { mockProducts } from '@/data/mockProducts';

export const revalidate = 60;

export default async function Home() {
  const catalog = await getPublicCatalog();
  const demoProducts = process.env.NODE_ENV !== "production" && catalog === null ? mockProducts : [];

  return (
    <ProfilPage
      products={catalog?.products ?? demoProducts}
      store={catalog?.store ?? null}
    />
  );
}
