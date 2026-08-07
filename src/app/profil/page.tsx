import { ProfilPage } from '@/components/ProfilPage';
import { PublicCatalogAutoRefresh } from '@/components/PublicCatalogAutoRefresh';
import { mockProducts } from '@/data/mockProducts';
import { getPublicCatalog } from '@/lib/catalog';
import { getPublicHeroSlides } from '@/lib/hero-slides';

export const revalidate = 60;

export default async function Profil() {
  const [catalog, heroSlides] = await Promise.all([getPublicCatalog(), getPublicHeroSlides()]);

  return (
    <>
      <ProfilPage
        store={catalog?.store ?? null}
        products={catalog?.products ?? (catalog === null ? mockProducts : [])}
        heroSlides={heroSlides}
      />
      <PublicCatalogAutoRefresh />
    </>
  );
}
