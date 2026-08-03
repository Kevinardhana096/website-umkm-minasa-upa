import { ProfilPage } from '@/components/ProfilPage';
import { getPublicCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function Profil() {
  const catalog = await getPublicCatalog();

  return (
    <ProfilPage store={catalog?.store ?? null} />
  );
}
