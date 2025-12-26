# 📊 Referencia Rápida - Monorepo Setup

## 🎯 Tu Proyecto ArreglaMe Ya

**Tipo:** Marketplace de Jardinería  
**Stack:** NestJS (API) + Next.js (Frontend) + PostgreSQL (BD)  
**Arquitectura:** Monorepo con npm workspaces  
**Estado:** ✅ Production Ready

---

## 📋 Checklist Rápido

### Después de clonar:
- [ ] `npm run install:all` - Instala todo
- [ ] `npm run db:up` - Levanta Docker
- [ ] `npm run db:migrate` - Crea tablas
- [ ] `npm run db:generate` - Genera Prisma client
- [ ] `npm start` - Levanta API + Frontend

### Verificación:
- [ ] API corre en http://localhost:3000/graphql
- [ ] Frontend corre en http://localhost:3001
- [ ] BD conecta correctamente
- [ ] No hay errores de CORS

---

## 🏗️ Estructura de Carpetas

| Carpeta | Propósito | Estado |
|---------|-----------|--------|
| `apps/api` | Backend NestJS + GraphQL | ✅ Completo |
| `apps/mobile-app` | Frontend Next.js + Capacitor | ✅ Completo |
| `docs/` | Documentación | ✅ Actualizada |
| `prisma/` | Esquema BD (raíz) | ✅ Existe |
| `docker-compose.yml` | BD + servicios | ✅ Existe |

---

## 🔧 Scripts Principales

### Inicio & Parada

| Script | Comando | Puerto | Cuándo |
|--------|---------|--------|--------|
| **Desarrollo** | `npm start` | 3000+3001 | Diario |
| Solo API | `npm run start:api` | 3000 | Debug API |
| Solo Frontend | `npm run start:web` | 3001 | Debug Frontend |
| Parar BD | `npm run db:down` | - | Terminar sesión |

### Base de Datos

| Script | Comando | Qué Hace |
|--------|---------|----------|
| **Levanta BD** | `npm run db:up` | Docker on |
| **Migración** | `npm run db:migrate` | Schema → BD |
| **Prisma** | `npm run db:generate` | Genera cliente |
| **Studio** | `npm run db:studio` | GUI en puerto 5555 |
| **Ver logs** | `npm run db:logs` | Docker logs |

### Build & Deploy

| Script | Comando | Output | Cuándo |
|--------|---------|--------|--------|
| **Build todo** | `npm run build` | dist/ + .next/ | Deploy |
| Build API | `npm run build:api` | apps/api/dist/ | Deploy API |
| Build Frontend | `npm run build:web` | apps/mobile-app/.next/ | Deploy Web |

### Mantenimiento

| Script | Comando | Para | Cuándo |
|--------|---------|------|--------|
| **Lint** | `npm run lint` | Revisa código | Pre-commit |
| **Test** | `npm run test` | Tests API | CI/CD |
| **E2E** | `npm run test:e2e` | Tests full | QA |

---

## 🔐 Variables de Entorno Críticas

### APIs (DEBEN Estar)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=tu_secret_long_random
CORS_ORIGIN=http://localhost:3001
```

### Frontend (DEBEN Estar)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3000/graphql
```

### Opcionales pero Recomendados

```env
GOOGLE_MAPS_API_KEY=...
GEMINI_API_KEY=...
NODE_ENV=development
```

---

## 🌐 URLs Importantes

| Servicio | URL | Cuándo Existe |
|----------|-----|---------------|
| **API GraphQL** | http://localhost:3000/graphql | Siempre |
| **GraphQL Playground** | http://localhost:3000/graphql | `GRAPHQL_PLAYGROUND=true` |
| **Prisma Studio** | http://localhost:5555 | Corres `npm run db:studio` |
| **Frontend Web** | http://localhost:3001 | `npm start` |

---

## 📱 Puertos Usados

| Puerto | Servicio | Cambiar En |
|--------|----------|------------|
| **3000** | API NestJS | `.env` - `API_PORT` |
| **3001** | Next.js Frontend | `next.config.js` |
| **5432** | PostgreSQL | `docker-compose.yml` |
| **5555** | Prisma Studio | Auto, no cambiar |

---

## 🚨 Errores Comunes & Soluciones

| Error | Solución |
|-------|----------|
| `Port 3000 already in use` | `npm run db:down` o mata proceso |
| `Cannot find module @nestjs` | `npm run install:all` |
| `Cannot connect to database` | `npm run db:up` |
| `Prisma client not found` | `npm run db:generate` |
| `CORS block from frontend` | Agrega origen a `CORS_ORIGIN` en `.env` |
| `JWT signature invalid` | Mismo `JWT_SECRET` en todos lados |

---

## 📚 Documentación

| Archivo | Para | Cuándo Leer |
|---------|------|------------|
| **QUICK_START.md** | Empezar rápido | Primera vez |
| **EXECUTION_GUIDE.md** | Guía detallada | Necesitas ayuda |
| **GRAPHQL_CORS_SETUP.md** | API ↔ Frontend | Quieres entender |
| **PRODUCTION_CHECKLIST.md** | Deploy | Antes de producción |
| **ARCHITECTURE_SUMMARY.md** | Qué se arregló | Curiosidad |
| **FOLDER_STRUCTURE.md** | Estructura proyecto | Onboarding |

---

## 🚀 Deploy Rápido

### Heroku (API)
```bash
cd apps/api
heroku create my-api
heroku config:set JWT_SECRET=... DATABASE_URL=...
git push heroku main
```

### Vercel (Frontend)
```bash
cd apps/mobile-app
vercel --prod
```

### Docker (Ambas)
```bash
docker-compose build
docker-compose up -d
```

---

## 🎯 Dependencias Principales

### Backend
```json
{
  "@nestjs/common": "API framework",
  "@nestjs/graphql": "GraphQL server",
  "@prisma/client": "Database ORM",
  "graphql": "GraphQL language",
  "@google/genai": "Google Gemini AI"
}
```

### Frontend
```json
{
  "next": "React framework",
  "react": "UI library",
  "@apollo/client": "GraphQL client",
  "@capacitor/core": "Mobile wrapper"
}
```

---

## ✅ Pre-Launch Checklist

- [ ] Instalación completa: `npm run install:all`
- [ ] BD levantada: `npm run db:up`
- [ ] Migraciones aplicadas: `npm run db:migrate`
- [ ] Prisma generado: `npm run db:generate`
- [ ] Ambas apps corren: `npm start`
- [ ] No hay errores de CORS
- [ ] GraphQL Playground accesible
- [ ] .env.example está actualizado
- [ ] Documentación leída

---

## 🆘 SOS - Reiniciar Todo

```bash
# Nuclear option: start over
npm run db:down              # Stop DB
rm -rf node_modules         # Remove all node_modules
rm -rf apps/api/node_modules
rm -rf apps/mobile-app/node_modules
npm run install:all         # Fresh install
npm run db:up              # New DB
npm run db:migrate         # Fresh migrations
npm start                  # Run
```

---

## 📞 Contacto Rápido

Si necesitas:
- **Ayuda de instalación** → EXECUTION_GUIDE.md
- **Producción** → PRODUCTION_CHECKLIST.md
- **API-Frontend comms** → GRAPHQL_CORS_SETUP.md
- **Entender estructura** → ARCHITECTURE_SUMMARY.md

---

**Tu proyecto está listo. ¡Empieza!** 🚀

Última actualización: Diciembre 2024  
Versión: 1.0.0
