# 🔧 RUNBOOK DE INGENIERÍA — RESOLUCIÓN DE FALLO CRÍTICO DE CONEXIÓN
## GraphQL API – ERR_CONNECTION_REFUSED / Network Error

> **Propósito**: Diagnosticar y resolver errores de conexión entre el Frontend (Next.js + Apollo Client) y la API GraphQL (NestJS + Apollo Server).

---

## 📋 CONTEXTO

El Frontend (Next.js + Apollo Client) falla al ejecutar una mutación GraphQL y arroja un error de red (`ERR_CONNECTION_REFUSED`).  
Esto indica que el cliente **NO logra establecer conexión TCP** con la API GraphQL.

Este runbook identifica y corrige el problema desde la **capa de infraestructura** hasta la **capa de aplicación**.

---

## 🔍 FASE 1 — VERIFICACIÓN DE PROCESO Y PUERTO (LADO SERVIDOR)

### HIPÓTESIS
El proceso backend no está escuchando en el puerto esperado (**3001**).

### ACCIÓN — Verificar si el puerto está abierto

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3001
```

**Linux / Mac:**
```bash
lsof -i :3001
# o alternativamente:
netstat -tulpn | grep :3001
```

### RESULTADO ESPERADO
Debe existir un proceso Node.js escuchando en el puerto **3001**.

### DECISIÓN
- ❌ **Si NO hay salida** → el servidor NO está corriendo
- ✅ **Si HAY salida** → avanzar a **Fase 2**

### RESOLUCIÓN
Si el proceso no existe, iniciar el backend:

```bash
# Desde la raíz del monorepo:
npm run start:api

# O directamente en el directorio de la API:
cd apps/api
npm run start:dev
```

**Verificar nuevamente el puerto antes de continuar.**

---

## 🚀 FASE 2 — VALIDACIÓN DE ARRANQUE DEL SERVIDOR GRAPHQL

### HIPÓTESIS
El proceso levanta pero falla durante el bootstrap de NestJS / Apollo.

### ACCIÓN
Abrir en el navegador o Postman:

```
http://localhost:3001/graphql
```

### RESULTADOS VÁLIDOS ✅
- Apollo Sandbox (interfaz gráfica)
- Mensaje `"GET query missing"` o similar
- Cualquier respuesta HTTP (no un timeout)

### RESULTADOS INVÁLIDOS ❌
- `ERR_CONNECTION_REFUSED`
- Timeout
- Error 502/504

### DECISIÓN
Si sigue sin responder → **revisar logs del backend inmediatamente**

**Buscar errores de:**
- Configuración de `GraphQLModule`
- Variables de entorno faltantes
- Crash silencioso al inicializar Prisma o Apollo
- Puerto ocupado por otro proceso

### Logs esperados al arrancar correctamente:
```
🚀 ========================================
✅ Backend corriendo en: http://localhost:3001
✅ GraphQL Playground: http://localhost:3001/graphql
✅ Health Check: http://localhost:3001/health
✅ CORS habilitado para: http://localhost:3000, http://localhost:3001
========================================
```

---

## ⚙️ FASE 3 — CONFIGURACIÓN DE VARIABLES DE ENTORNO (FRONTEND)

### HIPÓTESIS
El Apollo Client está apuntando a una **URL incorrecta** o hardcodeada.

### ACCIÓN
Revisar archivo:
```
apps/mobile-app/.env.local
```

### VALIDACIÓN
La variable debe existir y coincidir **EXACTAMENTE**:

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql
```

### ⚠️ IMPORTANTE
- **Reiniciar el frontend** luego de modificar el `.env.local`:
  ```bash
  # Detén el proceso (Ctrl+C) y vuelve a iniciar:
  npm run start:web
  ```
- **No hardcodear URLs** en el código fuente
- Las variables deben tener el prefijo `NEXT_PUBLIC_` para estar disponibles en el cliente

### Verificación en el código:
El Apollo Client está configurado en `apps/mobile-app/src/app/providers.tsx`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
```

---

## 🌐 FASE 4 — POLÍTICA DE CORS (SERVIDOR)

### HIPÓTESIS
El backend responde, pero el navegador **bloquea la petición POST**.

### ACCIÓN
Verificar que CORS esté habilitado correctamente en el servidor.

### CONFIGURACIÓN ACTUAL (apps/api/src/main.ts):

```typescript
// Habilitar CORS con origen configurable
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000', // Frontend Next.js
];

app.enableCors({
  origin: corsOrigin,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

### VALIDACIÓN
- El error debe cambiar de **"Network Error"** a un **error GraphQL real**
- Si sigue fallando, revisar headers en **DevTools → Network**
- Buscar errores tipo `CORS policy: No 'Access-Control-Allow-Origin' header`

### Variables de entorno necesarias (apps/api/.env):
```bash
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

---

## 💪 FASE 5 — ROBUSTEZ DEL APOLLO CLIENT (FRONTEND)

### HIPÓTESIS
La app crashea porque no maneja errores de red correctamente.

### IMPLEMENTACIÓN ACTUAL

#### 1. Apollo Client con Error Link (apps/mobile-app/src/app/providers.tsx):
```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[GraphQL Error]: ${message}`)
    );
  }

  if (networkError) {
    console.error(
      `[Network Error]: ${networkError.message}`,
      `API URL: ${API_URL}`,
      `Operation: ${operation.operationName}`
    );
  }
});
```

#### 2. Manejo de errores en mutations (apps/mobile-app/src/components/AuthModal.tsx):
```typescript
const onSubmit = async (data: FormValues) => {
  try {
    const { data: response } = await registerMutation({
      variables: { ...data },
    });
    // Manejo de éxito
  } catch (error: any) {
    if (error.networkError) {
      console.error('[Network Error] API no disponible');
      alert(
        'Error de conexión. El servidor no está disponible.\n' +
        'Por favor verifica que el backend esté corriendo.'
      );
      return;
    }

    if (error.graphQLErrors) {
      error.graphQLErrors.forEach((e: any) =>
        console.error(`[GraphQL Error]: ${e.message}`)
      );
      alert(`Error: ${error.graphQLErrors[0].message}`);
      return;
    }

    alert(error.message || 'Error en autenticación');
  }
};
```

### OBJETIVO
- ✅ La app no debe romperse ante un backend caído
- ✅ El usuario debe recibir feedback claro
- ✅ Los logs deben facilitar el debugging

---

## ✅ CHECKLIST FINAL DE ESTABILIDAD (PREVENCIÓN)

Para evitar recurrencia del incidente:

### 1. Orquestación
- [ ] Usar **Docker Compose** para levantar API + Frontend juntos
- [ ] Configurar dependencias entre servicios
- [ ] Scripts npm en la raíz del monorepo:
  ```bash
  npm run dev  # Inicia API y Frontend simultáneamente
  ```

### 2. Health Check
- [x] Implementado endpoint `/health` en el backend
  ```
  GET http://localhost:3001/health
  ```
- [ ] Verificar disponibilidad antes de permitir submit de formularios
- [ ] Mostrar indicador visual de conexión en el frontend

### 3. Observabilidad
- [x] Logs mejorados en el backend al inicializar
- [x] Error logging estructurado en Apollo Client
- [ ] Considerar herramientas de monitoreo (Sentry, LogRocket)
- [ ] Revisar logs del backend al ejecutar mutaciones
- [ ] Confirmar que Prisma y GraphQL no estén fallando silenciosamente

### 4. Documentación
- [x] Este runbook documentado y versionado
- [ ] Diagrama de arquitectura actualizado
- [ ] Guía de troubleshooting en README

---

## 🔧 COMANDOS RÁPIDOS DE DIAGNÓSTICO

### Verificar estado de servicios:
```bash
# 1. Backend
curl http://localhost:3001/health

# 2. GraphQL
curl http://localhost:3001/graphql

# 3. Logs del backend
npm --prefix apps/api run start:dev

# 4. Variables de entorno
cat apps/mobile-app/.env.local
cat apps/api/.env.example
```

### Reiniciar todo desde cero:
```bash
# 1. Detener todos los procesos
# (Ctrl+C en las terminales)

# 2. Limpiar caché de Node
npm --prefix apps/api run clean
npm --prefix apps/mobile-app run clean

# 3. Reinstalar dependencias
npm install

# 4. Iniciar servicios
npm run dev
```

---

## 📞 ESCALACIÓN

Si después de seguir todas las fases el problema persiste:

1. **Revisar logs completos del backend** en busca de stack traces
2. **Verificar versiones de dependencias** (Apollo Client, @nestjs/graphql)
3. **Comprobar configuración de Prisma** y conexión a base de datos
4. **Revisar firewall y antivirus** que puedan bloquear el puerto 3001
5. **Probar en modo incógnito** del navegador para descartar extensiones

---

## 📚 REFERENCIAS

- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Apollo Client Error Handling](https://www.apollographql.com/docs/react/data/error-handling/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Última actualización**: 2025-12-30  
**Versión**: 1.0.0  
**Mantenedor**: DevOps Team
