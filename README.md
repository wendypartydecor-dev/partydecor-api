# Aurea SaaS - Party Decor API

Sistema multi-tenant para gestión de eventos y cotizaciones de decoración.

## Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT custom con PIN + Cookie
- **UI Components**: Tailwind CSS 4 + OKLCH semantic tokens
- **Estado**: Zustand (Workspace) + React Context (Quotes)

## Arquitectura Multi-Tenant

El sistema utiliza Row Level Security (RLS) de PostgreSQL para el aislamiento de datos por tenant:

- Cada tenant (empresa) tiene un `tenant_id` único
- El JWT contiene el `tenant_id` en los claims
- Las políticas RLS filtran automáticamente por `tenant_id`

### JWT Claims

```json
{
  "sub": "user_uuid",
  "tenant_id": "PD001",
  "role": "authenticated",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Sistema de Cotizaciones con Snapshots

Las cotizaciones implementan un sistema de **snapshots** que congela los valores de productos en el momento de la venta:

### Por qué guardamos snapshots?

1. **Inmutabilidad histórica**: El precio de un producto puede cambiar después de crear la cotización. El snapshot asegura que la cotización refleje exactamente lo que se cotizó.

2. **Auditoría**: Permite reconstruir exactamente qué se ofreció al cliente en cualquier momento.

3. **Integridad**: Si el catálogo se modifica o elimina un producto, la cotización sigue siendo válida.

### Campos de Snapshot

| Campo | Descripción |
|-------|-------------|
| `nombre_personalizado` | Nombre mostrado en la línea (puede diferir del catálogo) |
| `nombre_snapshot` | Copia del nombre original del catálogo |
| `precio_unitario_aplicado` | Precio congelado al momento de cotizar |

## API Endpoints

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login con PIN. Retorna JWT. |

### Eventos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/eventos` | Lista eventos del tenant |
| POST | `/api/eventos` | Crear evento |
| PATCH | `/api/eventos/:id` | Editar evento |
| DELETE | `/api/eventos/:id` | Eliminar evento (solo admin) |

### Cotizaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cotizaciones` | Lista cotizaciones |
| POST | `/api/cotizaciones` | Crear/Actualizar cotización con líneas |
| GET | `/api/cotizaciones/:id/items` | Obtener líneas de cotización |
| POST | `/api/cotizaciones/:id/items` | Agregar línea |
| PATCH | `/api/cotizaciones/:id/items` | Actualizar línea |
| DELETE | `/api/cotizaciones/:id/items` | Eliminar línea |

### Catálogo

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/catalogos/productos` | Buscar productos del catálogo |

## Esquema de Base de Datos

### Tablas Principales

- `empresas` - Tenants (con configuración fiscal: iva_default, isr_default)
- `usuarios` - Usuarios del sistema
- `usuario_empresa` - Relación usuario-tenant
- `eventos` - Eventos de decoración
- `clientes` - Clientes finales
- `catalogos` - Catálogo de productos/servicios
- `cotizaciones` - Cabeceras de cotización
- `lineas_cotizacion` - Líneas de detalle con snapshots

### Impuestos por Línea

Cada línea de cotización puede tener configuración individual de impuestos:

- `incluye_iva` (boolean, default: true) - Si false, esta línea no aporta a la base del IVA
- `incluye_isr` (boolean, default: false) - Si true, aplica retención ISR

## Setup Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear archivo .env

```bash
cp .env.example .env
```

### 3. Correr en desarrollo

```bash
npm run dev
```

## Deploy en Vercel

1. Push a GitHub
2. Vercel detecta Next.js automáticamente
3. Configurar variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`

## Migraciones de Base de Datos

Las migraciones SQL están en `packages/supabase/`. Para aplicar:

1. Abrir Supabase Dashboard → SQL Editor
2. Copiar el contenido del archivo de migración
3. Ejecutar

## Agregar un empleado

```sql
INSERT INTO usuarios (nombre, pin_hash, es_admin)
VALUES ('Maria', crypt('5678', gen_salt('bf')), false);
```

## Convenciones de Código

- **Naming**: camelCase para JS/TS, snake_case para SQL
- **Colores**: OKLCH para tokens semánticos
- **Commits**: Conventional Commits (feat:, fix:, refactor:)
