# Guía de Configuración - Arréglame Ya

## Estructura del Proyecto

```
arreglame-ya/
├── apps/
│   ├── api/                    # Backend NestJS + GraphQL
│   │   ├── src/
│   │   │   ├── health/         # Health Check Endpoint (NUEVO)
│   │   │   ├── app.module.ts   # Importa HealthModule
│   │   │   └── main.ts         # Escucha en puerto 3001
│   │   └── prisma/
│   │       └── schema.prisma   # PostgreSQL + PostGIS
│   │
│   └── mobile-app/             # Frontend Next.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx    # Home con HealthCheck
│       │   │   └── layout.tsx  # Root Layout
│       │   └── components/
│       │       └── HealthCheck.tsx  # Component de verificación
│       ├── next.config.js      # Rewrites para proxy a /api
│       └── .env.local          # Variables de entorno (NUEVO)
```

## Configuración de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 3001 | http://localhost:3001 |
| GraphQL Playground | 3001 | http://localhost:3001/graphql |

## Cambios Realizados

### 1. Backend (NestJS)

**apps/api/src/main.ts**
```typescript
// Prefijo global
app.setGlobalPrefix('api');

// Puerto 3001
const port = process.env.API_PORT || 3001;

// CORS permitiendo http://localhost:3000
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

**Nuevo Health Module**
- `apps/api/src/health/health.controller.ts` - Controlador REST
- `apps/api/src/health/health.service.ts` - Lógica de negocio
- `apps/api/src/health/health.module.ts` - Módulo NestJS
- Endpoint: `GET /api/health` → `{ status: "ok", message: "Servidor operativo" }`

**app.module.ts actualizado**
```typescript
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PubSubModule,
    ConfigModule,
    HealthModule,  // ← NUEVO
    JobsModule,
    WorkerModule,
    LegalModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({...}),
  ],
})
```

### 2. Frontend (Next.js)

**apps/mobile-app/next.config.js**
```javascript
// Rewrites en desarrollo
async rewrites() {
  return {
    beforeFiles: [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
      {
        source: "/graphql",
        destination: "http://localhost:3001/graphql",
      },
    ],
  };
}
```

**apps/mobile-app/.env.local** (NUEVO)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
```

**apps/mobile-app/src/components/HealthCheck.tsx** (NUEVO)
- Componente React que verifica conexión a `/api/health`
- Muestra estado visual: verde (conectado) / rojo (error)
- Auto-reintento cada 5 segundos

**apps/mobile-app/src/app/page.tsx** (NUEVO)
- Página de inicio con Tailwind CSS minimalista
- Integra HealthCheck Component
- Muestra información de configuración

## Cómo Ejecutar

### Terminal 1: Backend
```bash
cd apps/api
npm run start:dev
# Esperado:
# ✅ Backend corriendo en: http://localhost:3001/graphql
# ✅ CORS habilitado para: http://localhost:3000, http://localhost:3001
```

### Terminal 2: Frontend
```bash
cd apps/mobile-app
npm run dev
# Esperado:
# > Ready in 2.5s
# ➜  Local:   http://localhost:3000
```

### Terminal 3: Verificar conexión
```bash
curl http://localhost:3000
# Renderiza Home con HealthCheck
# Si está verde → API conectada ✅
# Si está roja → Verificar que backend esté en 3001
```

## Solución de Errores

### Error: "EADDRINUSE :::3001"
```bash
# Windows: Matar procesos Node
taskkill /F /IM node.exe /T

# O cambiar puerto en apps/api/.env
API_PORT=3002
```

### Error: "404 en /api/health"
- Verificar que NestJS está escuchando en 3001
- Verificar que `app.setGlobalPrefix('api')` existe en `main.ts`
- Verificar que `HealthModule` está en imports de `app.module.ts`

### Error: "CORS Error"
- Verificar que el origen está en `corsOrigin` array
- Verificar que `app.enableCors()` se ejecuta ANTES de `app.listen()`

### Error: "Rewrites no funcionan"
- Verificar que Next.js está en modo **desarrollo** (no `output: "export"`)
- Verificar que `async rewrites()` devuelve `beforeFiles` array
- Verificar que el backend está corriendo en 3001

## Arquitectura: Schema-First vs Code-First

Este proyecto usa **schema-first GraphQL** (Recomendado):
- Las definiciones están en `.graphql` files
- Los resolvers usan `@Query('queryName')` (string syntax)
- NO uses `@Query(() => ReturnType)` (code-first)
- Para copilot: Cualquier `@ObjectType` DTO debe ser eliminado

## Próximos Pasos

1. ✅ Configurar puertos correctos (3000/3001)
2. ✅ Crear Health Endpoint
3. ✅ Configurar Rewrites en Next.js
4. ✅ Crear HealthCheck Component
5. ⏳ Implementar autenticación JWT
6. ⏳ Conectar GraphQL queries
7. ⏳ Crear formulario de servicios
8. ⏳ Integrar Google Maps / Leaflet

## Recursos

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
