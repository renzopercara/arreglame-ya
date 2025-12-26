# 🔧 Configuración GraphQL & CORS - Guía Rápida

## 📡 Comunicación GraphQL: API ↔ Frontend

### 1️⃣ Verificar que la API expone GraphQL

**Archivo:** `apps/api/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS - CRÍTICO para comunicación frontend ↔ API
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3001',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.enableCors(corsOptions);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // GraphQL se sirve automáticamente en /graphql por @nestjs/graphql
  const apiPort = process.env.API_PORT || 3000;
  await app.listen(apiPort);

  console.log(`✅ API running on http://localhost:${apiPort}/graphql`);
  console.log(`   CORS enabled for: ${corsOptions.origin}`);
}

bootstrap();
```

### 2️⃣ Configurar Apollo Client en Frontend

**Archivo:** `apps/mobile-app/lib/apolloClient.ts` (créalo si no existe)

```typescript
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// URLs de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';
const WS_URL = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:3000/graphql';

// HTTP Link para queries y mutations
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'include', // Incluye cookies/auth
});

// WebSocket Link para subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_URL,
  })
);

// Decide si usar HTTP o WebSocket según el tipo de operación
const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Cliente Apollo
const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export default client;
```

### 3️⃣ Usar Apollo Client en App

**Archivo:** `apps/mobile-app/src/App.tsx`

```typescript
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apolloClient';

export default function App() {
  return (
    <ApolloProvider client={client}>
      {/* Resto de tu app */}
    </ApolloProvider>
  );
}
```

### 4️⃣ Hacer una Query de Prueba

**Archivo:** `apps/mobile-app/components/TestQuery.tsx`

```typescript
import { useQuery, gql } from '@apollo/client';

const TEST_QUERY = gql`
  query TestConnection {
    __typename
  }
`;

export function TestQuery() {
  const { data, loading, error } = useQuery(TEST_QUERY);

  if (loading) return <p>Conectando a la API...</p>;
  if (error) return <p>❌ Error: {error.message}</p>;

  return <p>✅ Conectado a GraphQL: {data?.__typename}</p>;
}
```

---

## 🌐 CORS - Configuración Completa

### ¿Qué es CORS?

CORS (Cross-Origin Resource Sharing) permite que un frontend en `http://localhost:3001` acceda a un backend en `http://localhost:3000`.

**Sin CORS correcta:** 
```
❌ Access to XMLHttpRequest blocked by CORS policy
   Origin 'http://localhost:3001' not allowed
```

### Desarrollo (localhost)

**Archivo:** `apps/api/.env` (desarrollo)

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
NODE_ENV=development
```

**Resultado en API:**
```typescript
origin: ['http://localhost:3001', 'http://localhost:3000']
```

### Producción (dominio real)

**Archivo:** `apps/api/.env.production`

```env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

**Resultado en API:**
```typescript
origin: ['https://yourdomain.com', 'https://app.yourdomain.com', 'https://www.yourdomain.com']
```

### Errores Comunes de CORS

| Error | Causa | Solución |
|-------|-------|----------|
| `Access to XMLHttpRequest blocked by CORS policy` | Tu dominio no está en `CORS_ORIGIN` | Agrega tu dominio a `.env` |
| `method not allowed by CORS policy` | Método HTTP no permitido | Verifica `methods` en `corsOptions` |
| `Not allowed to access header` | Header no permitido | Agrega header a `allowedHeaders` |
| WebSocket fails pero HTTP works | Usando `ws://` en producción HTTPS | Cambia a `wss://` para HTTPS |

---

## 🔌 WebSockets - Subscriptions GraphQL

### En API (NestJS)

**Archivo:** `apps/api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': {
          onConnect: (context) => {
            console.log('WebSocket Client Connected');
          },
        },
      },
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
        credentials: true,
      },
      playground: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}
```

### En Frontend (Apollo Client)

Ya está configurado en el paso 2️⃣ anterior.

### Ejemplo de Subscription

**Resolver en API:**
```typescript
@Subscription()
messageAdded() {
  return this.pubSub.asyncIterator(['messageAdded']);
}
```

**Hook en Frontend:**
```typescript
import { useSubscription, gql } from '@apollo/client';

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded {
    messageAdded {
      id
      text
    }
  }
`;

export function MessageListener() {
  const { data, loading, error } = useSubscription(MESSAGE_SUBSCRIPTION);

  if (loading) return <p>Escuchando mensajes...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <p>Nuevo mensaje: {data?.messageAdded?.text}</p>;
}
```

---

## 🧪 Testing de Conectividad

### Test 1: ¿API GraphQL está disponible?

```bash
# Terminal 1: Levanta la API
npm run start:api

# Terminal 2: Test
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Resultado esperado:
# {"data":{"__typename":"Query"}}
```

### Test 2: ¿Frontend se conecta a API?

En navegador (http://localhost:3001):

```javascript
// En DevTools Console:
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: '{ __typename }' 
  }),
})
  .then(r => r.json())
  .then(d => console.log('✅ Conectado:', d))
  .catch(e => console.error('❌ Error:', e));
```

Si ves `✅ Conectado: { data: { __typename: "Query" } }`, todo está bien.

### Test 3: ¿JWT/Auth funciona?

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "{ me { id email } }"}'
```

### Test 4: ¿WebSockets funcionan?

```javascript
// En navegador DevTools:
const ws = new WebSocket('ws://localhost:3000/graphql', ['graphql-ws']);
ws.onopen = () => console.log('✅ WebSocket conectado');
ws.onerror = (e) => console.error('❌ Error:', e);
```

---

## 📝 Variables de Entorno Resumen

### API - apps/api/.env

```env
# Conexión Base de Datos
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT
JWT_SECRET=tu_secret_aqui
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# GraphQL
GRAPHQL_PLAYGROUND=true (solo desarrollo)

# Env
NODE_ENV=development
API_PORT=3000
```

### Frontend - apps/mobile-app/.env.local

```env
# URLs de API
NEXT_PUBLIC_API_URL=http://localhost:3000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3000/graphql
```

### Frontend - apps/mobile-app/.env.production

```env
# URLs de API (producción)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://api.yourdomain.com/graphql
```

---

## ✅ Checklist: ¿Todo funciona?

- [ ] API corre sin errores en puerto 3000
- [ ] Frontend corre sin errores en puerto 3001
- [ ] `curl` a GraphQL devuelve `{ data: { __typename: "Query" } }`
- [ ] Browser console muestra `✅ Conectado`
- [ ] CORS_ORIGIN en `.env` incluye `http://localhost:3001`
- [ ] Apollo Client está configurado con URLs correctas
- [ ] ApolloProvider envuelve la app
- [ ] Prueba de Query funciona (TestQuery.tsx)
- [ ] WebSockets conectan si usas subscriptions
- [ ] JWT_SECRET existe en API

Si todos están ✅, **¡tu monorepo está listo para desarrollo!** 🚀

---

**Última actualización:** Diciembre 2024
