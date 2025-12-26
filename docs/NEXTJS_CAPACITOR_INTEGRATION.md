
# Guía de Integración: Next.js + Capacitor

Esta guía detalla cómo configurar un proyecto Next.js (App Router) para que compile correctamente como una aplicación nativa (Android/iOS) utilizando Capacitor.

---

## 1. Concepto Clave: Static Export
A diferencia de una web tradicional, una app móvil no tiene un servidor Node.js corriendo en el teléfono. Capacitor funciona abriendo un `WebView` que carga archivos HTML/CSS/JS locales.

Por lo tanto, **Next.js debe configurarse para exportar archivos estáticos**, no para renderizar en servidor (SSR).

---

## 2. Instalación de Dependencias

Ejecuta estos comandos en la raíz de `apps/mobile-app`:

```bash
# 1. Instalar Core de Capacitor
npm install @capacitor/core @capacitor/cli

# 2. Instalar plataformas nativas
npm install @capacitor/android @capacitor/ios

# 3. Inicializar Capacitor (crea capacitor.config.ts)
npx cap init "Arreglame Ya" com.arreglameya.app --web-dir=out
```

---

## 3. Archivos Clave de Configuración

### A. `next.config.js` (o .mjs)
Este es el paso más crítico. Debemos decirle a Next.js que genere HTML estático y desactive la optimización de imágenes (ya que requiere servidor).

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. OBLIGATORIO: Genera carpeta 'out/' con HTML/CSS/JS estático
  output: 'export',
  
  // 2. OBLIGATORIO: Next/Image necesita servidor para optimizar.
  // En mobile, desactivamos esto para usar imágenes tal cual vienen.
  images: {
    unoptimized: true,
  },

  // 3. Opcional: Desactivar indicador de compilación en esquina inferior
  devIndicators: {
    buildActivity: false
  }
};

module.exports = nextConfig;
```

### B. `capacitor.config.ts`
Este archivo controla cómo se comporta la app nativa.

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arreglameya.app',
  appName: 'Arreglame Ya',
  webDir: 'out', // Debe coincidir con el output de Next.js
  server: {
    androidScheme: 'https', // Permite usar cookies/localStorage seguros
  },
  plugins: {
    // Configuración de plugins (ej: Push, Keyboard)
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

---

## 4. Scripts de Build (package.json)

Agrega estos scripts a `apps/mobile-app/package.json` para facilitar el flujo:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    
    // Sincroniza los cambios web a las carpetas nativas
    "sync": "npx cap sync",
    
    // Abre el IDE nativo (Android Studio / Xcode)
    "open:android": "npx cap open android",
    "open:ios": "npx cap open ios",
    
    // Flujo completo de despliegue
    "mobile:build": "npm run build && npx cap sync"
  }
}
```

---

## 5. Consideraciones con App Router (Next.js 14)

### 🚫 API Routes Locales
No puedes usar `apps/mobile-app/src/app/api/...` para lógica de backend.
*   **Razón:** Esas rutas requieren un servidor Node.js. En el móvil solo hay HTML estático.
*   **Solución:** Tu app debe hacer fetch a tu backend externo (`apps/api` en NestJS).

### 🚫 Server Actions
Las Server Actions no funcionan en `output: 'export'`.
*   **Solución:** Usa manejadores de eventos tradicionales (`onSubmit`, `onClick`) que llamen a tus servicios/APIs.

### 🚫 Cookies (Parcial)
Aunque Capacitor parchea `document.cookie`, las cookies `httpOnly` no funcionan igual que en web.
*   **Solución:** Usa `Authorization: Bearer <token>` headers y guarda el token en `Capacitor Preferences` o `LocalStorage`.

### ✅ Navegación
*   Usa el componente `<Link href="/ruta">` normalmente.
*   Usa el hook `useRouter()` de `next/navigation` normalmente.
*   **Tip:** Evita usar etiquetas `<a>` puras, ya que causan una recarga completa de la "página" (WebView), perdiendo el estado de la app.

---

## 6. Flujo de Desarrollo (Live Reload)

Para desarrollar sin tener que compilar (`npm run build`) a cada cambio, usa el Live Reload de Capacitor. Esto hace que la app nativa apunte a tu `localhost:3000` en lugar de a los archivos estáticos.

1.  Asegúrate de que tu PC y tu celular estén en la misma red WiFi.
2.  Ejecuta:
    ```bash
    npx cap run android -l --external
    ```
3.  Selecciona tu dispositivo conectado.
4.  Capacitor modificará temporalmente `capacitor.config.ts` para apuntar a la IP de tu PC.

**¡Importante!**: Cuando vayas a compilar para producción, asegúrate de revertir este cambio (eliminar la entrada `server.url` en `capacitor.config.ts`) o simplemente correr `npx cap sync` nuevamente.
