import { searchProductos } from '@/lib/actions-busqueda';
import { BuscarClientPage } from '@/components/publico/BuscarClientPage';

export const dynamic = 'force-dynamic';

interface BuscarPageProps {
    searchParams: Promise<{
        q?: string;
        categoria?: string | string[];
        marca?: string | string[];
        tiendas?: string | string[];
        precioMin?: string;
        precioMax?: string;
        stock?: string;
        marcaVehiculo?: string;
        modeloVehiculo?: string;
        ano?: string;
        orden?: string;
        pagina?: string;
    }>;
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
    const params = await searchParams;

    const q = params.q || '';
    const categorias = params.categoria
        ? Array.isArray(params.categoria) ? params.categoria : [params.categoria]
        : [];
    const marcas = params.marca
        ? Array.isArray(params.marca) ? params.marca : [params.marca]
        : [];
    const tiendas = params.tiendas
        ? Array.isArray(params.tiendas) ? params.tiendas : [params.tiendas]
        : [];
    const precioMin = params.precioMin ? parseFloat(params.precioMin) : undefined;
    const precioMax = params.precioMax ? parseFloat(params.precioMax) : undefined;
    const soloStock = params.stock === 'true';
    const orden = (params.orden || 'relevancia') as 'relevancia' | 'precio_asc' | 'precio_desc' | 'recientes';
    const pagina = params.pagina ? parseInt(params.pagina) : 1;

    const marcaVehiculo = params.marcaVehiculo || undefined;
    const modeloVehiculo = params.modeloVehiculo || undefined;
    const ano = params.ano ? parseInt(params.ano) : undefined;

    const result = await searchProductos({
        q,
        categorias,
        marcas,
        tiendas,
        precioMin,
        precioMax,
        soloStock,
        marcaVehiculo,
        modeloVehiculo,
        ano,
        orden,
        pagina,
        porPagina: 12,
    });

    return (
        <BuscarClientPage
            productos={result.productos}
            total={result.total}
            totalPages={result.totalPages}
            currentPage={pagina}
            query={q}
            filtrosDisponibles={result.filtrosDisponibles}
            filtrosActivos={{
                categorias,
                marcas,
                tiendas,
                precioMin,
                precioMax,
                soloStock,
                orden,
            }}
            implicitFilters={result.implicitFilters}
        />
    );
}
