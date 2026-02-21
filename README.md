# RepuestosANZ

Marketplace de repuestos automotrices para la zona metropolitana de Anzoátegui, Venezuela.

## Stack Tecnológico

- **Framework:** Next.js 16.0.5 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4.0
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma 7.0.1
- **Auth:** NextAuth.js v5
- **Formularios:** React Hook Form + Zod
- **Imágenes:** Cloudinary

## Estructura del Proyecto

```
app/
├── (publico)/       # Rutas públicas para clientes
├── (vendedor)/      # Dashboard privado para tiendas
├── auth/            # Login y Registro
├── api/             # API Routes
lib/                 # Utilidades y configuración
components/ui/       # Componentes base reutilizables
prisma/              # Schema y seed data
```

## Setup Inicial

1.  **Clonar repositorio e instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Copia `.env.example` a `.env` y configura tu conexión a PostgreSQL.

3.  **Inicializar base de datos:**
    ```bash
    npx prisma generate
    npx prisma db push
    # Para cargar datos iniciales:
    npx prisma db seed
    ```

    *Nota: Si usas `npx prisma db seed`, asegúrate de configurar el script en `package.json` o ejecutar con `ts-node`.*

4.  **Correr servidor de desarrollo:**
    ```bash
    npm run dev
    ```

## Comandos Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia servidor de producción
- `npm run lint`: Ejecuta linter
