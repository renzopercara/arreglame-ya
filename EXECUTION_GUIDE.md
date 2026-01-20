# 📋 Guía Completa de Ejecución - ArreglaMe Ya Monorepo

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 18+** (`node -v`)
- **npm 9+** (`npm -v`)
- **Docker y Docker Compose** (`docker --version && docker-compose --version`)
- **Git** (`git --version`)

## 🚀 Instalación Completa (Desde Cero)

### Paso 1: Clonar o Preparar el Repositorio

```bash
# Si no tienes el proyecto aún:
git clone <tu-repo>
cd arreglame-ya

# O si ya lo tienes:
cd arreglame-ya
```

### Paso 2: Instalar Dependencias del Monorepo

```bash
# Instala las dependencias de la raíz y todas las apps
npm run install:all
```

Este comando equivale a:
```bash
npm install                              # Dependencias raíz
npm --prefix apps/api install           # Dependencias de API
npm --prefix apps/mobile-app install    # Dependencias de Mobile/Web
```

### Paso 3: Iniciar la Base de Datos con Docker

```bash
# Levanta PostgreSQL y otros servicios definidos en docker-compose.yml
npm run db:up

# Verifica que los contenedores estén corriendo:
docker-compose ps

# Ver logs en tiempo real (opcional):
npm run db:logs
```

**⚠️ Nota:** Verifica que en el archivo `docker-compose.yml` esté configurado correctamente el puerto de PostgreSQL (por defecto 5432).

### Paso 4: Generar el Cliente de Prisma

```bash
# Genera el cliente de Prisma basado en el schema
npm run db:generate
```

Este comando genera `@prisma/client` en `apps/api/node_modules/@prisma/client`.

### Paso 5: Ejecutar Migraciones de Base de Datos

```bash
# Opción A: En desarrollo (crea y aplica migraciones)
npm run db:migrate

# Opción B: En producción (solo aplica migraciones existentes)
npm run db:migrate:deploy
```

**¿Qué hace cada uno?**
- `db:migrate`: Ejecuta `prisma migrate dev` (desarrollo, crea nuevas migraciones)
- `db:migrate:deploy`: Ejecuta `prisma migrate deploy` (producción, sin prompts)

### Paso 6 (Opcional): Verificar la Base de Datos

```bash
# Abre Prisma Studio para ver/editar datos visualmente
npm run db:studio

# Se abrirá en http://localhost:5555
```

### Paso 7: Ejecutar el Monorepo Completo

```bash
# Ejecuta simultáneamente la API (puerto 3000) y el Web (puerto 3001)
npm start

# O usa el alias 'dev':
npm run dev
```

**Salida esperada:**
```
[0] [Nest] 12, 12/21/2025, 4:15:22 PM     LOG [NestFactory] Starting Nest application...
[1] > next dev
[1] ▲ Next.js 14.1.0
[1] - Local:        http://localhost:3000
```

---

## 🎯 Comandos por Tarea

### 📡 Solo API

```bash
# Desarrollo (con watch mode)
npm run start:api

# Producción (build previamente ejecutado)
npm --prefix apps/api run start:prod
```

### 🌐 Solo Frontend/Mobile

```bash
# Desarrollo (Next.js dev server)
npm run start:web

# Build para producción
npm run build:web
```

### 🏗️ Build Completo

```bash
# Construye tanto API como Web
npm run build

# O por separado:
npm run build:api
npm run build:web
```

### 📊 Base de Datos

```bash
# Ver interfaz Prisma Studio
npm run db:studio

# Crear una nueva migración
npm run db:migrate

# Seed database (si tienes script en prisma/seed.ts)
npm run db:seed

# Parar servicios Docker
npm run db:down
```

### 🧪 Testing

```bash
# Tests unitarios (API)
npm run test

# Tests en watch mode
npm --prefix apps/api run test:watch

# Tests e2e
npm run test:e2e

# Coverage
npm --prefix apps/api run test:cov
```

### 📝 Linting

```bash
# Lint de todo el monorepo
npm run lint

# Lint y fix de API
npm --prefix apps/api run lint
```

---

## 🐳 Docker Compose - Variables de Entorno

Asegúrate de que tu `docker-compose.yml` tenga las variables correctas:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-arreglame_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-arreglame_password}
      POSTGRES_DB: ${DB_NAME:-arreglame_db}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-arreglame_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 🔐 Variables de Entorno (.env)

### `.env` en la raíz o `apps/api/.env`

```env
# Database
DATABASE_URL="postgresql://arreglame_user:arreglame_password@localhost:5432/arreglame_db"
DB_USER=arreglame_user
DB_PASSWORD=arreglame_password
DB_NAME=arreglame_db
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRATION=24h

# Google Maps / Geo
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true

# Environment
NODE_ENV=development
API_PORT=3000
```

### `.env.local` en `apps/mobile-app/`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3000/graphql
```

---

## 🔍 Verificación de Conectividad

### Paso 1: Verifica que la API está corriendo

```bash
curl http://localhost:3000/graphql
```

Debería devolver un HTML o error de GraphQL (no 404).

### Paso 2: Verifica que el Frontend está corriendo

```bash
curl http://localhost:3001
```

Debería devolver HTML del Next.js app.

### Paso 3: Verifica la conexión GraphQL desde el Frontend

En la consola del navegador (localhost:3001):
```javascript
// En las DevTools de navegador:
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __typename }' })
}).then(r => r.json()).then(console.log)
```

Si ves `{ data: { __typename: 'Query' } }`, ¡todo está conectado! ✅

---

## 🐛 Troubleshooting

### ❌ Error: "Port 3000 already in use"
```bash
# Encuentra qué proceso usa el puerto:
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Mata el proceso:
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### ❌ Error: "Cannot find module '@nestjs/common'"
```bash
# Reinstala dependencias:
npm run install:all
npm --prefix apps/api install
```

### ❌ Error: "Cannot connect to database"
```bash
# Verifica Docker:
docker-compose ps

# Si no está corriendo:
npm run db:up

# Verifica la DATABASE_URL en .env
echo $DATABASE_URL
```

### ❌ Error: "Prisma migration pending"
```bash
# Ejecuta las migraciones:
npm run db:migrate
```

### ❌ Error: "CORS error from Frontend to API"
```
origin 'http://localhost:3001' not allowed
```

Solución: Ve a [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) → "Configuración de CORS"

---

## 📈 Flujo de Desarrollo Típico

1. **Iniciamos el ambiente:**
   ```bash
   npm run db:up       # Docker con BD
   npm run db:migrate  # Migraciones
   npm start           # Todo en paralelo
   ```

2. **Modificas código** en `apps/api/src/` o `apps/mobile-app/src/`

3. **Los cambios se aplican automáticamente** (watch mode)

4. **Pruebas en navegador:**
   - API GraphQL: http://localhost:3000/graphql
   - Frontend: http://localhost:3001

5. **Al terminar:**
   ```bash
   npm run db:down  # Detiene Docker (opcional)
   ```

---

## 🚢 Para Producción

Ver [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) para:
- Build optimizado
- Variables de entorno seguras
- Configuración de CORS
- Dockerización
- Deployment en servicios cloud
