'use server';

import prisma from '@/lib/prisma';

interface SearchParams {
    q?: string;
    categorias?: string[];
    marcas?: string[];
    tiendas?: string[];
    precioMin?: number;
    precioMax?: number;
    soloStock?: boolean;
    marcaVehiculo?: string;
    modeloVehiculo?: string;
    ano?: number;
    orden?: 'relevancia' | 'precio_asc' | 'precio_desc' | 'recientes';
    pagina?: number;
    porPagina?: number;
}

interface ProductoResultado {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    descripcion: string | null;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    disponible: boolean;
    imagenPrincipal: string | null;
    tiendaNombre: string;
    tiendaCiudad: string;
    tiendaEstado: string;
    categoriaNombre: string;
}

interface SearchResult {
    productos: ProductoResultado[];
    total: number;
    totalPages: number;
    filtrosDisponibles: {
        categorias: { id: string; nombre: string; count: number }[];
        marcas: { nombre: string; count: number }[];
        tiendas: { id: string; nombre: string; count: number }[];
        precioMin: number;
        precioMax: number;
    };
    implicitFilters?: {
        categorias: string[];
        marcas: string[];
    };
}

export async function searchProductos(params: SearchParams): Promise<SearchResult> {
    const {
        q = '',
        categorias = [],
        marcas = [],
        tiendas = [],
        precioMin,
        precioMax,
        soloStock = false,
        marcaVehiculo,
        modeloVehiculo,
        ano,
        orden = 'relevancia',
        pagina = 1,
        porPagina = 12,
    } = params;

    const skip = (pagina - 1) * porPagina;
    let searchTerm = q.trim();

    // Implicit Filter Detection
    let implicitCategorias: string[] = [];
    let implicitMarcas: string[] = [];
    const hasExplicitFilters = categorias.length > 0 || marcas.length > 0;

    if (searchTerm && !hasExplicitFilters) {
        // 1. Check for Category Match
        const matchingCategory = await prisma.categoria.findFirst({
            where: {
                nombre: {
                    equals: searchTerm,
                    mode: 'insensitive'
                }
            },
            select: { id: true }
        });

        if (matchingCategory) {
            implicitCategorias = [matchingCategory.id];
            searchTerm = ''; // Clear search term to show all products in category
        } else {
            // 2. Check for Brand Match (if no category matched)
            const matchingBrand = await prisma.producto.findFirst({
                where: {
                    marcaRepuesto: {
                        equals: searchTerm,
                        mode: 'insensitive'
                    }
                },
                select: { marcaRepuesto: true }
            });

            if (matchingBrand) {
                implicitMarcas = [matchingBrand.marcaRepuesto];
                searchTerm = ''; // Clear search term to show all products of brand
            }
        }
    }

    const effectiveCategorias = [...categorias, ...implicitCategorias];
    const effectiveMarcas = [...marcas, ...implicitMarcas];

    // Build WHERE conditions
    const whereConditions: string[] = [
        `p."disponible" = true`,
        `t."activa" = true`,
    ];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Full-text search + fuzzy matching
    if (searchTerm) {
        // Combine FTS ranking with trigram similarity for fuzzy matching
        whereConditions.push(`(
            to_tsvector('spanish', 
                coalesce(p."nombre", '') || ' ' || 
                coalesce(p."descripcion", '') || ' ' || 
                coalesce(p."marcaRepuesto", '') || ' ' || 
                coalesce(c."nombre", '') || ' ' || 
                coalesce(t."nombre", '')
            )
            @@ plainto_tsquery('spanish', $${paramIndex})
            OR similarity(p."nombre", $${paramIndex}) > 0.15
            OR p."nombre" ILIKE $${paramIndex + 1}
            OR p."marcaRepuesto" ILIKE $${paramIndex + 1}
            OR c."nombre" ILIKE $${paramIndex + 1}
            OR t."nombre" ILIKE $${paramIndex + 1}
        )`);
        queryParams.push(searchTerm, `%${searchTerm}%`);
        paramIndex += 2;
    }

    // Category filter
    if (effectiveCategorias.length > 0) {
        whereConditions.push(`p."categoriaId" IN (${effectiveCategorias.map(() => `$${paramIndex++}`).join(', ')})`);
        queryParams.push(...effectiveCategorias);
    }

    // Brand filter
    if (effectiveMarcas.length > 0) {
        whereConditions.push(`p."marcaRepuesto" IN (${effectiveMarcas.map(() => `$${paramIndex++}`).join(', ')})`);
        queryParams.push(...effectiveMarcas);
    }

    // Store filter
    if (tiendas.length > 0) {
        whereConditions.push(`p."tiendaId" IN (${tiendas.map(() => `$${paramIndex++}`).join(', ')})`);
        queryParams.push(...tiendas);
    }

    // Price range filter
    if (precioMin !== undefined && precioMin > 0) {
        whereConditions.push(`p."precio" >= $${paramIndex++}`);
        queryParams.push(precioMin);
    }
    if (precioMax !== undefined && precioMax > 0) {
        whereConditions.push(`p."precio" <= $${paramIndex++}`);
        queryParams.push(precioMax);
    }

    // Stock filter
    if (soloStock) {
        whereConditions.push(`p."stock" > 0`);
    }

    // Vehicle compatibility filter
    const hasVehicleFilter = marcaVehiculo || modeloVehiculo || ano;
    let vehicleJoin = '';
    if (hasVehicleFilter) {
        vehicleJoin = `JOIN "Compatibilidad" comp ON comp."productoId" = p."id"`;
        if (marcaVehiculo) {
            whereConditions.push(`comp."marcaId" = $${paramIndex++}`);
            queryParams.push(marcaVehiculo);
        }
        if (modeloVehiculo) {
            whereConditions.push(`comp."modeloId" = $${paramIndex++}`);
            queryParams.push(modeloVehiculo);
        }
        if (ano) {
            whereConditions.push(`(comp."anoInicio" IS NULL OR comp."anoInicio" <= $${paramIndex})`);
            whereConditions.push(`(comp."anoFin" IS NULL OR comp."anoFin" >= $${paramIndex})`);
            queryParams.push(ano);
            paramIndex++;
        }
    }

    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY
    let orderByClause: string;
    if (searchTerm && orden === 'relevancia') {
        orderByClause = `
            ts_rank(
                to_tsvector('spanish', 
                    coalesce(p."nombre", '') || ' ' || 
                    coalesce(p."descripcion", '') || ' ' || 
                    coalesce(p."marcaRepuesto", '') || ' ' || 
                    coalesce(c."nombre", '') || ' ' || 
                    coalesce(t."nombre", '')
                ),
                plainto_tsquery('spanish', $1)
            ) DESC,
            similarity(p."nombre", $1) DESC,
            p."createdAt" DESC
        `;
    } else {
        switch (orden) {
            case 'precio_asc':
                orderByClause = `p."precio" ASC`;
                break;
            case 'precio_desc':
                orderByClause = `p."precio" DESC`;
                break;
            case 'recientes':
                orderByClause = `p."createdAt" DESC`;
                break;
            default:
                orderByClause = `p."createdAt" DESC`;
        }
    }

    // Main query
    const productosRaw = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            p."id",
            p."nombre",
            p."codigoOEM",
            p."descripcion",
            p."marcaRepuesto",
            p."precio",
            p."stock",
            p."disponible",
            p."imagenPrincipal",
            t."nombre" as "tiendaNombre",
            t."ciudad" as "tiendaCiudad",
            t."estado" as "tiendaEstado",
            c."nombre" as "categoriaNombre"
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        JOIN "Categoria" c ON c."id" = p."categoriaId"
        ${vehicleJoin}
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT ${porPagina}
        OFFSET ${skip}
    `, ...queryParams);

    // Count query
    const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int as total
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        JOIN "Categoria" c ON c."id" = p."categoriaId"
        ${vehicleJoin}
        WHERE ${whereClause}
    `, ...queryParams);

    const total = countResult[0]?.total || 0;

    // Get available filters (from ALL matching products, not just current page)
    // Categories with counts
    const categoriasDisponibles = await prisma.$queryRawUnsafe<any[]>(`
        SELECT c."id", c."nombre", COUNT(*)::int as count
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        JOIN "Categoria" c ON c."id" = p."categoriaId"
        WHERE p."disponible" = true AND t."activa" = true
        GROUP BY c."id", c."nombre"
        ORDER BY count DESC
    `);

    // Brands with counts
    const marcasDisponibles = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p."marcaRepuesto" as nombre, COUNT(*)::int as count
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        WHERE p."disponible" = true AND t."activa" = true
        GROUP BY p."marcaRepuesto"
        ORDER BY count DESC
    `);

    // Stores with counts
    const tiendasDisponibles = await prisma.$queryRawUnsafe<any[]>(`
        SELECT t."id", t."nombre", COUNT(*)::int as count
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        WHERE p."disponible" = true AND t."activa" = true
        GROUP BY t."id", t."nombre"
        ORDER BY count DESC
    `);

    // Price range
    const precioRange = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            COALESCE(MIN(p."precio"), 0)::float as "precioMin",
            COALESCE(MAX(p."precio"), 1000)::float as "precioMax"
        FROM "Producto" p
        JOIN "Tienda" t ON t."id" = p."tiendaId"
        WHERE p."disponible" = true AND t."activa" = true
    `);

    // Serialize results
    const productos: ProductoResultado[] = productosRaw.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoOEM: p.codigoOEM,
        descripcion: p.descripcion,
        marcaRepuesto: p.marcaRepuesto,
        precio: parseFloat(p.precio),
        stock: p.stock,
        disponible: p.disponible,
        imagenPrincipal: p.imagenPrincipal,
        tiendaNombre: p.tiendaNombre,
        tiendaCiudad: p.tiendaCiudad,
        tiendaEstado: p.tiendaEstado,
        categoriaNombre: p.categoriaNombre,
    }));

    return {
        productos,
        total,
        totalPages: Math.ceil(total / porPagina),
        filtrosDisponibles: {
            categorias: categoriasDisponibles,
            marcas: marcasDisponibles,
            tiendas: tiendasDisponibles,
            precioMin: precioRange[0]?.precioMin || 0,
            precioMax: precioRange[0]?.precioMax || 1000,
        },
        implicitFilters: {
            categorias: implicitCategorias,
            marcas: implicitMarcas
        }
    };
}
