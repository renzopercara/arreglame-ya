# ✅ Checklist de Producción - ArreglaMe Ya

## 🔒 Seguridad & Variables de Entorno

### API (apps/api/.env.production)

- [ ] **DATABASE_URL** está configurada con credenciales seguras
  ```env
  DATABASE_URL="postgresql://prod_user:STRONG_PASSWORD@prod-db.region.rds.amazonaws.com:5432/arreglame_prod"
  ```
  
- [ ] **JWT_SECRET** es una cadena larga y aleatoria (mín 32 caracteres)
  ```env
  JWT_SECRET="$(openssl rand -base64 32)"
  ```

- [ ] **NODE_ENV=production** está establecido
  ```env
  NODE_ENV=production
  ```

- [ ] **GRAPHQL_PLAYGROUND=false** en producción
  ```env
  GRAPHQL_PLAYGROUND=false
  GRAPHQL_DEBUG=false
  ```

- [ ] API_PORT está documentado y no es el mismo que otros servicios
  ```env
  API_PORT=3000
  ```

- [ ] **Google Maps API Key** tiene restricciones por dominio/aplicación
  ```env
  GOOGLE_MAPS_API_KEY=your_restricted_key
  ```

- [ ] **Gemini API Key** tiene límite de requests configurado en Google Cloud

- [ ] **JWT_EXPIRATION** es razonable (máx 24h-7d para usuarios)
  ```env
  JWT_EXPIRATION=24h
  ```

### Frontend (apps/mobile-app/.env.production)

- [ ] **NEXT_PUBLIC_API_URL** apunta al dominio de producción
  ```env
  NEXT_PUBLIC_API_URL=https://api.yourdomain.com/graphql
  ```

- [ ] **NEXT_PUBLIC_GRAPHQL_WS_URL** usa WSS (WebSocket Secure)
  ```env
  NEXT_PUBLIC_GRAPHQL_WS_URL=wss://api.yourdomain.com/graphql
  ```

- [ ] **No hay secrets en variables públicas** (NEXT_PUBLIC_*). Los secrets van solo en servidor

---

## 🌐 CORS - Configuración

### En apps/api/src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3001',
      'https://yourdomain.com',
      'https://app.yourdomain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.enableCors(corsOptions);
  
  // GraphQL Playground solo en desarrollo
  const graphqlPlayground = process.env.NODE_ENV === 'development';
  
  await app.listen(process.env.API_PORT || 3000);
}
bootstrap();
```

### Variables .env para CORS

```env
# Production
CORS_ORIGIN="https://yourdomain.com,https://app.yourdomain.com"

# Development
# CORS_ORIGIN="http://localhost:3001"
```

### Errores comunes CORS en producción:

```
Access to XMLHttpRequest at 'https://api.example.com' from origin 
'https://app.example.com' has been blocked by CORS policy
```

**Causa:** El origen del frontend no está en la lista blanca de CORS.

**Solución:**
1. Verifica que `CORS_ORIGIN` en `.env.production` incluya tu dominio
2. Asegúrate de usar HTTPS en ambos (API y Frontend)
3. Para WebSockets, necesitas el schema completo: `wss://` no `ws://`

---

## 📦 Build & Optimización

### API

- [ ] **Build compilado:**
  ```bash
  npm --prefix apps/api run build
  ```
  Verifica que la carpeta `dist/` se haya creado correctamente.

- [ ] **Node Modules optimizados:**
  ```bash
  # En producción, instala solo dependencias de producción
  npm --prefix apps/api install --production
  ```

- [ ] **Prisma está generado:**
  ```bash
  npm --prefix apps/api run prisma:generate
  ```

### Frontend

- [ ] **Build Next.js completado:**
  ```bash
  npm --prefix apps/mobile-app run build
  ```
  Verifica que no haya warnings críticos.

- [ ] **Optimizaciones habilitadas en next.config.js:**
  ```javascript
  const nextConfig = {
    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    swcMinify: true,
  };
  ```

- [ ] **PWA/Capacitor está sincronizado:**
  ```bash
  cd apps/mobile-app
  npm run build
  npx cap sync
  ```

---

## 🐳 Dockerización

### Dockerfile para API

Crea `apps/api/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "dist/main"]
```

### Dockerfile para Frontend

Crea `apps/mobile-app/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml para Producción

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      GRAPHQL_PLAYGROUND: "false"
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  web:
    build:
      context: ./apps/mobile-app
      dockerfile: Dockerfile
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_GRAPHQL_WS_URL: ${NEXT_PUBLIC_GRAPHQL_WS_URL}
    ports:
      - "3001:3000"
    depends_on:
      - api
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

### .env.production para Docker Compose

```env
# Database
DB_USER=prod_user
DB_PASSWORD=very_strong_password_here
DB_NAME=arreglame_prod
DATABASE_URL="postgresql://prod_user:very_strong_password_here@postgres:5432/arreglame_prod"

# JWT
JWT_SECRET=your_long_random_secret_here_minimum_32_chars

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://api.yourdomain.com/graphql

# API
NODE_ENV=production
API_PORT=3000
GRAPHQL_PLAYGROUND=false
```

---

## 🚀 Deployment en Servicios Cloud

### AWS ECS/Fargate

1. **Push images a ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -t arreglame-api:latest -f apps/api/Dockerfile .
   docker tag arreglame-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/arreglame-api:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/arreglame-api:latest
   ```

2. **RDS Database:** Usa PostgreSQL 15 managed
3. **Load Balancer:** CloudFront o ALB
4. **HTTPS/SSL:** ACM certificates

### Heroku (Simplificado)

```bash
# Solo API
cd apps/api
heroku create arreglame-api
heroku config:set NODE_ENV=production JWT_SECRET=... DATABASE_URL=...
git push heroku main
```

### Vercel (Frontend)

```bash
# Solo Mobile/Web
cd apps/mobile-app
vercel --prod --env-file .env.production
```

---

## 📊 Monitoreo & Logs

### Logs en Producción

- [ ] **Winston Logger en NestJS** (aplicar en main.ts)
  ```typescript
  import { Logger } from '@nestjs/common';
  
  async function bootstrap() {
    const logger = new Logger();
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.API_PORT);
    logger.log(`API running on port ${process.env.API_PORT}`);
  }
  ```

- [ ] **Errors deben ir a servicio de logging** (ej: Sentry, DataDog)
  ```env
  SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
  ```

### Métricas

- [ ] **Endpoint de health check:**
  ```typescript
  @Get('/health')
  health() {
    return { status: 'OK', timestamp: new Date() };
  }
  ```

- [ ] **Prometheus metrics** (opcional pero recomendado)

---

## 🔐 Backup & Recovery

- [ ] **Backups automáticos de BD** configurados
  ```bash
  # Backup manual (test)
  pg_dump postgresql://user:pass@host/db > backup.sql
  ```

- [ ] **Plan de disaster recovery** documentado

- [ ] **Test de restauración** hecho al menos una vez

---

## 🎯 Pre-Launch Checklist Final

- [ ] Todas las variables de `.env.production` están configuradas
- [ ] CORS está correctamente configurado para dominio de producción
- [ ] JWT_SECRET es seguro y único
- [ ] Database está en servidor de producción (no localhost)
- [ ] HTTPS/SSL está habilitado en ambos API y Frontend
- [ ] GraphQL Playground está deshabilitado (`GRAPHQL_PLAYGROUND=false`)
- [ ] Node modules están optimizados (`--production`)
- [ ] Build testing realizado sin errores críticos
- [ ] Logs y monitoreo están configurados
- [ ] Backups están configurados y testeados
- [ ] Team tiene acceso a secretos en `.env` de forma segura
- [ ] Tests e2e pasan correctamente
- [ ] Performance testing realizado (lighthouse, load test)

---

## 📋 Deployment Workflow

```bash
# 1. Commit y push
git add .
git commit -m "Production ready: v1.0.0"
git push origin main

# 2. Build local (test)
npm run build

# 3. Docker test
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up

# 4. Verifica salud
curl http://localhost:3000/health
curl http://localhost:3001

# 5. Deploy a producción (según tu setup)
# AWS/Heroku/Vercel/etc

# 6. Monitor
npm run db:logs  # O equivalente en tu plataforma
```

---

## 🆘 SOS - Errores Comunes en Producción

### Error: "Cannot connect to PostgreSQL"
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución:** Verifica `DATABASE_URL` apunta a servidor correcto (no localhost en prod)

### Error: "CORS block from frontend"
```
Access to XMLHttpRequest blocked by CORS
```
**Solución:** Agrega tu dominio a `CORS_ORIGIN` en `.env.production`

### Error: "Prisma Client not found"
```
Error: Cannot find module '.prisma/client'
```
**Solución:** 
```bash
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run build
```

### Error: "JWT signature invalid"
```
Invalid token or expired
```
**Solución:** Verifica que `JWT_SECRET` es el mismo en API y client

### Error: "Out of memory in Next.js build"
```bash
# Aumenta memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build:web
```

---

**Última actualización:** Diciembre 2024  
**Versión del Setup:** 1.0.0
