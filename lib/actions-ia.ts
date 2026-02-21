'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function analyzeProductData(productName: string, categorias: { id: string; nombre: string }[]) {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        console.error('API Key no configurada');
        return { success: false, error: 'API Key no configurada' };
    }

    try {
        // Usamos una configuración de temperatura baja para mayor determinismo
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1, // Baja temperatura para respuestas más fácticas y precisas
                topP: 0.8,
                topK: 40,
            }
        });

        const categoriasTexto = categorias.map(c => `- ${c.nombre} (ID: ${c.id})`).join('\n');

        const prompt = `
        Eres un ASISTENTE EXPERTO en catálogos de repuestos automotrices (GM, Toyota, Ford, etc.).
        
        Tu única misión es encontrar los datos técnicos EXACTOS para el siguiente producto:
        "${productName}"

        INSTRUCCIONES CRÍTICAS PARA EL CÓDIGO OEM:
        1. Analiza el nombre del producto, el vehículo, el motor y los años (ej: "Aveo 1.6 2005-2013").
        2. Busca en tu base de conocimiento el Número de Parte Original (OEM) MÁS COMÚN y EXACTO para esa combinación específica.
        3. Si el producto es de General Motors (Chevrolet/Daewoo), prioriza los códigos GM comenzando por 9 (ej: 96xxxxxx).
        4. Si es Toyota, prioriza formatos (ej: 90915-xxxxx).
        5. COMPARA internamente con códigos de MercadoLibre o catálogos oficiales. Si tu primera opción es un "reemplazo", busca el código ORIGINAL de fábrica.
        
        EJEMPLO DE RAZONAMIENTO:
        - Input: "Muñón Aveo 1.6 2005"
        - Tu análisis: Es una rótula de suspensión inferior. Para Aveo 1.6, el código GM original más difundido es 96535089.
        - Salida OEM: "96535089"

        Genera también una descripción comercial atractiva y selecciona la categoría correcta.

        CATEGORÍAS DISPONIBLES:
        ${categoriasTexto}

        Devuelve SOLO un JSON con este formato:
        {
            "nombre": "${productName}",
            "marcaRepuesto": "Marca del fabricante (ej: GM Genuine, AC Delco, Bosch). Si no es obvio, usa 'Genérico' u observar si el nombre lo dice.",
            "codigo_oem": "El código OEM más preciso (ej: 96535089)",
            "descripcion": "Descripción técnica con aplicaciones (Lista de vehículos), ubicación (delantero/trasero) y beneficios.",
            "categoriaId": "ID de la categoría"
        }
        `;

        console.log(`Generating data for product: "${productName}"...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanJson);
            return { success: true, data };
        } catch (e) {
            console.error('Error parsing JSON from Gemini:', text, e);
            return { success: false, error: 'Error al interpretar la respuesta de la IA' };
        }

    } catch (error) {
        console.error('Error calling Gemini:', error);
        return { success: false, error: 'Error al generar datos con IA' };
    }
}
