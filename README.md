# ArreglaMe Ya - Monorepo

> **Marketplace de Jardinería con IA y Geolocalización**  
> Stack: NestJS + Next.js + PostgreSQL + GraphQL

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red)](/)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black)](/)

---

## 📚 **Empieza Aquí**

1. **⚡ Quick Start** → [QUICK_START.md](./QUICK_START.md) *(2 minutos)*
2. **📖 Guía Completa** → [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md) *(10 minutos)*
3. **🚀 Producción** → [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) *(antes de deploy)*
4. **🔧 GraphQL Connection Issues** → [QUICK_START_GRAPHQL_FIX.md](./QUICK_START_GRAPHQL_FIX.md) *(troubleshooting)*

---

## 🏗️ Arquitectura del Monorepo

```
apps/
├── api/              # Backend NestJS + GraphQL + Prisma
│   ├── src/          # Módulos: auth, matching, jobs, worker, etc.
│   └── prisma/       # Schema de base de datos
│
└── mobile-app/       # Frontend Next.js + Capacitor (PWA)
    ├── src/          # Components, views, hooks
    └── public/       # Assets, manifest.json
```

**Stack Completo:**
- 🔧 **API:** NestJS + GraphQL + Apollo Server + Prisma
- 🌐 **Frontend:** Next.js 14 + React 18 + Capacitor 6 (iOS/Android)
- 🗄️ **Base de Datos:** PostgreSQL 15 + PostGIS (geolocalización)
- 🤖 **IA:** Google Gemini 1.5 Flash
- 🔐 **Auth:** JWT + Guards de NestJS

---

## 🚀 Instalación & Ejecución

### ⚡ Quick Start (Para Desarrollo)

```bash
# 1. Instala dependencias
npm run install:all

# 2. Levanta base de datos (Docker)
npm run db:up

# 3. Ejecuta migraciones
npm run db:migrate

# 4. Genera Prisma Client
npm run db:generate

# 5. Levanta API + Frontend
npm start
```

**URLs:**
- 🔧 API GraphQL: http://localhost:3001/graphql
- 🌐 Frontend: http://localhost:3000

---

## 📋 Comandos Principales

### Desarrollo
```bash
npm start              # Levanta API (3001) + Frontend (3000)
npm run start:api      # Solo API
npm run start:web      # Solo Frontend
```

### Base de Datos
```bash
npm run db:up          # Levanta PostgreSQL (Docker)
npm run db:migrate     # Ejecuta migraciones
npm run db:studio      # Abre Prisma Studio (GUI)
npm run db:down        # Detiene Docker
```

### Build & Deploy
```bash
npm run build          # Build completo (API + Frontend)
npm run build:api      # Solo API
npm run build:web      # Solo Frontend
```

### Calidad
```bash
npm run lint           # Lint de todo el proyecto
npm run test           # Tests de API
npm run test:e2e       # Tests end-to-end
```

---

## 🧠 Reglas de Negocio Clave

### 1. **Matching Inteligente**
Usa PostGIS para encontrar trabajadores cercanos:
```sql
SELECT * FROM "WorkerProfile"
WHERE ST_DWithin(lastKnownLocation, requestLocation, 5000)
  AND isOnline = true
ORDER BY rating DESC, ST_Distance(lastKnownLocation, requestLocation);
```

### 2. **Penalización Automática**
- 3 rechazos consecutivos → 1 hora offline automático

### 3. **Call-out Fee**
- Si el cliente cancela después de que el trabajador recorrió >50% de la distancia, se cobra una penalización

### 4. **Verificación con IA**
- Google Gemini valida fotos de trabajos completados

---

## 🔐 Variables de Entorno

### API (apps/api/.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (apps/mobile-app/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3000/graphql
```

**Ver plantillas completas:**
- [apps/api/.env.example](./apps/api/.env.example)
- [apps/mobile-app/.env.example](./apps/mobile-app/.env.example)

---

## 📚 Documentación Completa

| Documento | Propósito |
|-----------|-----------|
| [QUICK_START.md](./QUICK_START.md) | ⭐ Empezar en 2 minutos |
| [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md) | Guía paso a paso completa |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Checklist para producción |
| [GRAPHQL_CORS_SETUP.md](./GRAPHQL_CORS_SETUP.md) | Setup API ↔ Frontend |
| [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) | Qué se arregló en el proyecto |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Estructura del monorepo |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Comandos y URLs rápidos |

---

## 🐳 Docker & PostgreSQL

El proyecto incluye `docker-compose.yml` para levantar PostgreSQL con PostGIS:

```bash
npm run db:up      # Levanta contenedor
npm run db:logs    # Ver logs
npm run db:down    # Detiene contenedor
```

**Servicios:**
- PostgreSQL 15 con PostGIS (puerto 5432)
- Credenciales por defecto en `.env`

---

## 🧪 Testing

```bash
npm run test           # Tests unitarios (API)
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # Tests end-to-end
```

---

## 📱 Mobile (iOS/Android)

El frontend usa **Capacitor** para generar apps nativas:

```bash
cd apps/mobile-app
npm run build
npx cap sync
npx cap open ios      # Abre Xcode
npx cap open android  # Abre Android Studio
```

---

## 🚀 Producción

**Antes de desplegar, lee [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md):**

- ✅ Variables de entorno seguras
- ✅ CORS configurado para dominio real
- ✅ JWT_SECRET aleatorio y largo
- ✅ HTTPS/SSL habilitado
- ✅ GraphQL Playground deshabilitado
- ✅ Build optimizado
- ✅ Backups configurados

---

## 🆘 Troubleshooting

| Error | Solución |
|-------|----------|
| Port 3000 occupied | `netstat -ano \| findstr :3000` y mata proceso |
| Cannot find @nestjs | `npm run install:all` |
| Database connection | `npm run db:up` |
| CORS error | Verifica `CORS_ORIGIN` en `.env` |
| Prisma client error | `npm run db:generate` |

**Ver más:** [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md) → Troubleshooting

---

## 🎯 Estado del Proyecto

- ✅ Monorepo funcional con npm workspaces
- ✅ API NestJS + GraphQL operativa
- ✅ Frontend Next.js + Capacitor listo
- ✅ CORS configurado y seguro
- ✅ Prisma + PostgreSQL + PostGIS
- ✅ Docker para desarrollo
- ✅ Documentación completa (7 guías)
- ✅ Production ready

---

## 📞 Soporte

- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Guía Completa:** [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)
- **Producción:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- **API-Frontend:** [GRAPHQL_CORS_SETUP.md](./GRAPHQL_CORS_SETUP.md)

---

## 📄 Licencia

MIT

---

**¡Tu proyecto está listo para desarrollo y producción!** 🚀

Empieza con: `npm run install:all && npm start`
