# partydecor-api

Backend REST para Party Decor. Node.js + Express + Supabase.

## Setup local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear archivo .env
```bash
cp .env.example .env
```
Edita `.env` y pon tus credenciales reales de Supabase.

Para generar el JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Correr en desarrollo
```bash
npm run dev
```

### 4. Verificar que funciona
```bash
curl http://localhost:3000/health
# {"ok":true,"service":"partydecor-api"}
```

---

## Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login con PIN. Retorna JWT. |

### Listas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/listas` | Listas de opciones (tipos, estados, etc.) |
| GET | `/api/listas/clientes` | Lista de clientes activos |
| GET | `/api/listas/catalogo` | Catálogo de productos |

### Eventos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/eventos` | Lista todos los eventos |
| POST | `/api/eventos` | Crear evento |
| PATCH | `/api/eventos/:id` | Editar evento |
| DELETE | `/api/eventos/:id` | Eliminar evento (solo admin) |

### Items de cotización
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/items/:idEvento` | Items de un evento |
| POST | `/api/items/:idEvento` | Agregar item del catálogo |
| POST | `/api/items/:idEvento/externo` | Agregar item externo |
| PATCH | `/api/items/:idEvento/cantidad` | Actualizar cantidad |
| PATCH | `/api/items/:idEvento/precio` | Actualizar precio |
| DELETE | `/api/items/:idEvento/:nombre` | Eliminar item |
| DELETE | `/api/items/:idEvento` | Limpiar cotización (solo admin) |

---

## Deploy en Railway

1. Sube el proyecto a GitHub (sin `.env`, sin `node_modules`)
2. En Railway: **New Project → Deploy from GitHub repo**
3. Agrega las variables de entorno en Railway → **Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `ALLOWED_ORIGIN` → URL de tu frontend (ej: `https://app.partydecor.mx`)
4. Railway detecta automáticamente que es Node.js y corre `npm start`

---

## Agregar un empleado

Desde Supabase → SQL Editor:
```sql
insert into usuarios (nombre, pin_hash, es_admin)
values ('Maria', crypt('5678', gen_salt('bf')), false);
```
