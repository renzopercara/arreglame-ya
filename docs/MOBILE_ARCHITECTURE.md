
# Arquitectura Mobile Cross-Platform (Next.js + Capacitor)

## 1. Visión General
El objetivo es mantener un **Single Codebase** que genere tres artefactos de salida:
1.  **Web PWA:** Accesible vía URL, indexable por SEO (parcialmente), instalable.
2.  **Android APK/AAB:** Nativo, con acceso a APIs de fondo y hardware avanzado.
3.  **iOS IPA:** Nativo, optimizado para WebKit y App Store.

### Stack Tecnológico
*   **Core:** Next.js 14 (App Router) configurado en modo `output: 'export'`.
*   **Runtime Nativo:** Capacitor 6.
*   **UI System:** Tailwind CSS + Lucide React (Componentes propios, sin Ionic UI Framework pesado para mantener identidad de marca propia tipo Uber).
*   **State Management:** Zustand (Ligero, ideal para mobile).
*   **Data Fetching:** TanStack Query (React Query) para manejo de caché offline y reintentos.

---

## 2. Diagrama de Capas (Clean Architecture)

La aplicación se divide en 4 capas estrictas para desacoplar la UI de la lógica nativa.

```mermaid
graph TD
    UI[Capa de Presentación (React/Tailwind)] --> Feature[Capa de Funcionalidad (Hooks/State)]
    Feature --> Domain[Capa de Dominio (Entidades/Reglas)]
    Feature --> Infra[Capa de Infraestructura (Adapters)]
    
    subgraph Infraestructura
    Infra --> WebAdapter[Web Adapter]
    Infra --> NativeAdapter[Capacitor Adapter]
    end
```

### A. Capa de Infraestructura (The Bridge)
Aquí ocurre la magia "Cross-Platform". No se invoca `Geolocation` directamente en los componentes. Se usa una interfaz.

**Ejemplo: Servicio de Ubicación**
```typescript
// 1. Interfaz Abstracta
interface ILocationService {
  getCurrentPosition(): Promise<{lat: number, lng: number}>;
  watchPosition(cb: (pos: Position) => void): string;
}

// 2. Implementación Web
class WebLocationService implements ILocationService {
  async getCurrentPosition() {
    return new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve));
  }
}

// 3. Implementación Nativa (Capacitor)
class NativeLocationService implements ILocationService {
  async getCurrentPosition() {
    const pos = await Geolocation.getCurrentPosition(); // Capacitor Plugin
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
}

// 4. Factory (Dependency Injection)
export const LocationService = Capacitor.isNativePlatform() 
  ? new NativeLocationService() 
  : new WebLocationService();
```

---

## 3. Estructura de Carpetas (Feature-Sliced modificada)

Dentro de `apps/mobile-app/src`:

```text
src/
├── app/                  # Next.js App Router (Rutas = Pantallas)
│   ├── (auth)/           # Grupo de rutas de autenticación
│   ├── (dashboard)/      # Grupo protegido (Mapa, Wallet)
│   └── layout.tsx        # Providers globales (QueryClient, AuthProvider)
│
├── components/           # UI Kit (Botones, Inputs, Cards - "Dumb Components")
│   ├── ui/               # Átomos (Button, Input)
│   └── shared/           # Moléculas (Navbar, BottomSheet)
│
├── features/             # Lógica de Negocio (El corazón de la app)
│   ├── map/              # Funcionalidad de Mapas
│   │   ├── components/   # Marcadores, MapView
│   │   ├── hooks/        # useMapCenter, useNearbyDrivers
│   │   └── services/     # Lógica de Leaflet/Native Maps
│   │   
│   ├── ride/             # Ciclo de vida del viaje
│   │   ├── store/        # rideStore.ts (Zustand)
│   │   └── utils/        # Calculadora de tarifas
│   │   
│   └── wallet/           # Billetera y Pagos
│
├── lib/                  # Infraestructura y Configuración
│   ├── adapters/         # Implementaciones Web vs Nativo (Storage, Camera, Geo)
│   ├── api/              # Cliente Axios/GraphQL configurado
│   └── utils.ts          # Helpers genéricos
│
└── styles/               # CSS Global y Configuración Tailwind
```

---

## 4. Estrategia Web vs. Mobile

### Qué corre dónde

| Feature | Web / PWA | iOS / Android (Nativo) | Estrategia |
| :--- | :--- | :--- | :--- |
| **Navegación** | URL Bar visible, History API | Gestos nativos, sin URL bar | Usar `Next.js Link` funciona en ambos. En native se oculta la UI del navegador. |
| **Mapas** | Leaflet (JS) | Leaflet (JS) o Google Maps SDK | MVP: Leaflet optimizado. V2: Google Maps Native SDK (Capacitor) para performance 60fps. |
| **Almacenamiento** | LocalStorage / IndexedDB | Native UserDefaults / SQLite | Usar `Capacitor Preferences API` (abstrae ambas). |
| **Notificaciones** | Web Push (Service Worker) | APNs / FCM | Usar `@capacitor/push-notifications`. |
| **Cámara** | HTML5 Input File | Cámara Nativa | Usar `@capacitor/camera` con fallback web. |
| **Área Segura** | N/A | Notch (Muesca) iPhone | Usar `safe-area-inset-*` de Tailwind. |

### Configuración de Build

Para que Next.js funcione en Capacitor, `next.config.js` debe tener:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // CRÍTICO: Genera HTML/CSS/JS estático
  images: {
    unoptimized: true, // Next/Image requiere servidor, en estático se deshabilita
  },
};
```

### Ciclo de Deploy

1.  **Desarrollo:** `npm run dev` (Browser local).
2.  **Prueba en Dispositivo:** `npx cap run android -l --external` (Live Reload en el celular apuntando a la IP de tu PC).
3.  **Producción:** 
    *   `npm run build` (Genera carpeta `out/`).
    *   `npx cap sync` (Copia `out/` a `android/app/src/main/assets/public`).
    *   Compilar en Android Studio / Xcode.

---

## 5. Recomendaciones de UX "App-Like"

Para que la app no se sienta como una página web en un marco:

1.  **Deshabilitar Zoom y Selección:** CSS global para evitar que el usuario seleccione texto o haga zoom accidental.
    ```css
    body {
      user-select: none;
      -webkit-touch-callout: none;
      touch-action: manipulation;
    }
    ```
2.  **Transiciones:** Usar `framer-motion` para animar cambios de pantalla (ej: deslizar izquierda/derecha) simulando navegación nativa.
3.  **Feedback Táctil:** Usar `@capacitor/haptics` para vibrar levemente al tocar botones importantes ("Aceptar Viaje").
4.  **Overscroll:** Bloquear el "rebote" elástico del scroll en iOS (`overscroll-behavior-y: none`).

