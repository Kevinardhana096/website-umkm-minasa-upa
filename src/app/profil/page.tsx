import { ProfilPage } from '@/components/ProfilPage';
import { mockProducts } from '@/data/mockProducts';
import { getPublicCatalog } from '@/lib/catalog';

export const revalidate = 60;

export default async function Profil() {
  const catalog = await getPublicCatalog();

  return (
    <ProfilPage
      store={catalog?.store ?? null}
      products={catalog?.products ?? (catalog === null ? mockProducts : [])}
    />
  );
}
