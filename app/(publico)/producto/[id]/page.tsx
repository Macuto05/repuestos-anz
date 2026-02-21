
import { notFound } from 'next/navigation';
import { getProductoDetail, getRelatedProducts } from '@/lib/actions-publico';
import { ProductDetailClient } from '@/components/publico/ProductDetailClient';
import { Metadata } from 'next';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const producto = await getProductoDetail(id);

    if (!producto) {
        return {
            title: 'Producto no encontrado | RepuestosANZ',
        };
    }

    return {
        title: `${producto.nombre} | RepuestosANZ`,
        description: producto.descripcion?.slice(0, 160) || `Comprar ${producto.nombre} en RepuestosANZ. Repuesto original ${producto.marcaRepuesto}.`,
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const producto = await getProductoDetail(id);

    if (!producto) {
        notFound();
    }

    const relatedProducts = await getRelatedProducts(producto.categoriaId, producto.id);

    return (
        <ProductDetailClient
            producto={producto}
            relatedProducts={relatedProducts}
        />
    );
}
