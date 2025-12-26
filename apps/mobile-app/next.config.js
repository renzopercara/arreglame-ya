
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Estrategia de caché:
  // En Mobile (Capacitor), los assets ya están locales, el SW ayuda poco con los archivos estáticos.
  // En Web, queremos caché agresiva.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // Deshabilitar PWA en desarrollo para no cachear errores
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Importante para Capacitor: No intentar cachear rutas que no existen en export
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================
  // DESARROLLO (Development Mode)
  // ============================================
  // En desarrollo, usa SSR con rewrites para proxy a la API
  // En producción, usa export estático para Capacitor
  ...(process.env.NODE_ENV === "development" ? {
    // Rewrites para proxy: /api/:path* -> http://localhost:3001/api/:path*
    // Esto evita errores de CORS durante el desarrollo
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
    },
  } : {
    // Requerido para Capacitor en producción (genera HTML/CSS/JS estático)
    output: "export",
  }),

  // Imágenes externas permitidas (CDNs/Unsplash) y sin optimizador en export
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.arreglameya.com" },
    ],
  },

  // Evitar conflictos de rutas en sistemas de archivos estrictos
  trailingSlash: true,

  // Permitir headers personalizados en rewrites
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "http://localhost:3001" },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
        },
      ],
    },
  ],
};

module.exports = withPWA(nextConfig);
