
# Estructura de Proyecto: Next.js + Capacitor (Production Ready)

Esta arquitectura está diseñada para escalar, facilitar el testing y separar la lógica de UI de la lógica nativa.

## 🌳 Árbol de Directorios

```text
apps/mobile-app/
├── android/                   # Proyecto nativo Android (Generado)
├── ios/                       # Proyecto nativo iOS (Generado)
├── public/                    # Assets estáticos (imágenes, iconos, manifest.json)
├── src/
│   ├── app/                   # Next.js App Router (Solo Vistas y Routing)
│   │   ├── (auth)/            # Grupo de rutas: Login, Registro (Layout dedicado)
│   │   ├── (dashboard)/       # Grupo de rutas: Mapa, Billetera (Layout con Navbar)
│   │   ├── api/               # API Routes (Solo si se usa SSR, evitar en Static Export)
│   │   ├── layout.tsx         # Root Layout (Providers Globales)
│   │   └── globals.css        # Tailwind directives
│   │
│   ├── components/            # UI Kit Compartido (Atomic Design)
│   │   ├── ui/                # Átomos: Button, Input, Card (shadcn/ui style)
│   │   └── shared/            # Moléculas: Navbar, BottomSheet, Loader
│   │
│   ├── features/              # LÓGICA DE NEGOCIO (Domain Driven)
│   │   ├── auth/              # Módulo de Autenticación
│   │   │   ├── components/    # LoginForm, RegisterStep
│   │   │   └── auth.store.ts  # Zustand Store (Session state)
│   │   │
│   │   ├── map/               # Módulo de Mapas
│   │   │   ├── components/    # InteractiveMap, UserMarker
│   │   │   └── hooks/         # useMapCenter, useNearbyDrivers
│   │   │   
│   │   ├── jobs/              # Módulo de Pedidos (Core)
│   │   │   ├── components/    # JobCard, StatusStepper
│   │   │   ├── services/      # job.api.ts (GraphQL calls)
│   │   │   └── job.store.ts   # Zustand Store (Active Job State)
│   │   │
│   │   └── wallet/            # Módulo Financiero
│   │
│   ├── lib/                   # Configuración e Infraestructura
│   │   ├── adapters/          # 🔌 THE BRIDGE (Web vs Native)
│   │   │   ├── camera.ts      # Abstract: Camera.getPhoto vs <input type="file">
│   │   │   ├── storage.ts     # Abstract: Preferences vs localStorage
│   │   │   ├── geo.ts         # Abstract: Geolocation vs navigator
│   │   │   └── haptics.ts     # Abstract: Haptics vs navigator.vibrate
│   │   │
│   │   ├── api/               # Cliente GraphQL/Axios configurado
│   │   ├── constants/         # Variables de entorno y config
│   │   └── utils.ts           # Helpers genéricos (cn, formatCurrency)
│   │
│   └── types/                 # Definiciones de Tipos Globales (User, Job, Geo)
│
├── capacitor.config.ts        # Configuración nativa
├── next.config.js             # Configuración Next (output: export)
├── package.json
└── tailwind.config.ts
```

---

## 🔑 Principios de Diseño

### 1. Separation of Concerns (App vs Features)
*   **`src/app`**: Debe ser "delgada". Solo se encarga de definir la URL y cargar el componente de la página. No debe tener lógica de estado compleja.
*   **`src/features`**: Contiene el "cerebro" de la app. Si borras la carpeta `app`, la lógica de negocio en `features` debería seguir teniendo sentido.

### 2. The Bridge Pattern (`src/lib/adapters`)
Para lograr que la app sea "Write Once, Run Everywhere", **nunca** importes `@capacitor/core` directamente en un componente de UI.

**Incorrecto:**
```typescript
// En un componente
import { Geolocation } from '@capacitor/geolocation';
const pos = await Geolocation.getCurrentPosition(); // Rompe en Web si no hay fallback
```

**Correcto:**
```typescript
// src/lib/adapters/geo.ts
export const getPosition = async () => {
  if (isNative) return await NativeGeo.getCurrentPosition();
  return await WebGeo.getCurrentPosition();
}

// En un componente
import { getPosition } from '@/lib/adapters/geo';
```

### 3. Feature Sliced Design (FSD) Adaptado
Agrupamos por **dominio** (Mapa, Auth, Wallet) y no por tipo de archivo. Esto hace que sea más fácil para un desarrollador nuevo entender dónde está la lógica de "pedir un cortador de pasto" (todo está en `features/jobs`).

### 4. UI Kit Centralizado
Todos los componentes visuales reutilizables van en `components/ui`. Esto permite cambiar el sistema de diseño (ej: de Tailwind a otro framework) tocando solo una carpeta, sin romper la lógica de negocio.

