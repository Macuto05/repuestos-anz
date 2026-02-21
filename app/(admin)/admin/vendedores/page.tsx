import { getVendedores } from '@/lib/actions-vendedores';
import { VendedoresClientPage } from '@/components/admin/vendedores/VendedoresClientPage';

export default async function VendedoresPage() {
    const vendedores = await getVendedores();

    return <VendedoresClientPage vendedores={vendedores} />;
}
