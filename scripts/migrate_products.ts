
import { PrismaClient } from '@prisma/client';
import { analyzeProductData } from '../lib/actions-ia';
import { searchImageGoogle } from '../lib/search-image';
import { uploadImageFromUrl } from '../lib/cloudinary';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function migrateProducts(filePath: string) {
    console.log('Iniciando migración desde:', filePath);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const products: any[] = xlsx.utils.sheet_to_json(sheet);

    console.log(`Encontrados ${products.length} productos.`);

    // Obtener categorías para la IA
    const categorias = await prisma.categoria.findMany({ select: { id: true, nombre: true } });

    for (const [index, p] of products.entries()) {
        const rawName = p['Nombre'] || p['Descripcion']; // Ajustar según columnas del Excel

        if (!rawName) continue;

        console.log(`\nProcesando [${index + 1}/${products.length}]: ${rawName}`);

        try {
            // 1. Analizar con IA
            const aiResult = await analyzeProductData(rawName, categorias);

            if (!aiResult.success || !aiResult.data) {
                console.error('Error IA:', aiResult.error);
                continue;
            }

            const { nombre, marcaRepuesto, codigo_oem, descripcion, categoriaId } = aiResult.data;

            // 2. Buscar Imagen
            console.log('Buscando imagen...');
            const searchQuery = `${nombre} ${codigo_oem} ${marcaRepuesto}`;
            const imageUrl = await searchImageGoogle(searchQuery);

            let finalImage = '';

            if (imageUrl) {
                console.log('Imagen encontrada:', imageUrl);
                // 3. Subir a Cloudinary
                try {
                    const uploadResult = await uploadImageFromUrl(imageUrl);
                    finalImage = uploadResult.url;
                    console.log('Subida a Cloudinary:', finalImage);
                } catch (uploadError) {
                    console.error('Error subiendo imagen:', uploadError);
                }
            } else {
                console.log('No se encontró imagen.');
            }

            // 4. Guardar en DB
            // Buscar si ya existe por OEM
            const existing = await prisma.producto.findFirst({
                where: { codigoOEM: codigo_oem }
            });

            if (existing) {
                console.log(`Producto ya existe (OEM: ${codigo_oem}). Saltando.`);
                continue;
            }

            await prisma.producto.create({
                data: {
                    nombre,
                    codigoOEM: codigo_oem,
                    marcaRepuesto: marcaRepuesto || 'Genérico',
                    descripcion: descripcion || '',
                    categoriaId: categoriaId || categorias[0].id, // Fallback
                    precio: 0, // Ajustar precio base
                    stock: 0,
                    imagenPrincipal: finalImage,
                    tiendaId: 'TIENDA_ID_POR_DEFECTO' // Necesitas definir esto
                }
            });

            console.log('Producto guardado correctamente.');

            // Delay para no saturar APIs
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error('Error procesando producto:', error);
        }
    }
}

// Ejecutar
// migrateProducts('./productos.xlsx');
