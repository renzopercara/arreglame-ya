const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentamos el timeout para evitar el error de /offline en Windows
  staticPageGenerationTimeout: 300,

  ...(process.env.NODE_ENV === "development"
    ? {
        // MODO DESARROLLO: Permitimos Rewrites y Headers para proxy
        async rewrites() {
          return {
            beforeFiles: [
              { source: "/api/:path*", destination: "http://localhost:3001/api/:path*" },
              { source: "/graphql", destination: "http://localhost:3001/graphql" },
            ],
          };
        },
        async headers() {
          return [
            {
              source: "/api/:path*",
              headers: [
                { key: "Access-Control-Allow-Credentials", value: "true" },
                { key: "Access-Control-Allow-Origin", value: "http://localhost:3001" },
                { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
              ],
            },
          ];
        },
      }
    : {
        // MODO PRODUCCIÓN: Exportación limpia para Capacitor/PWA
        output: "export",
      }),

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.arreglameya.com" },
    ],
  },

  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = withPWA(nextConfig);