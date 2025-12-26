# ⚡ Quick Start - Comandos Esenciales

## 🚀 Primero (Una sola vez)

```bash
cd c:\Users\renzo\Projects\Tiendline\arreglame-ya
npm run install:all
npm run db:up
npm run db:migrate
npm run db:generate
```

## 🎯 Desarrollo (Diario)

```bash
npm start
```

Esto levanta:
- **API:** http://localhost:3000/graphql
- **Frontend:** http://localhost:3001

---

## 📋 Comandos Principales

| Comando | Qué Hace | Cuándo |
|---------|----------|--------|
| `npm start` | Levanta API + Frontend | Desarrollo diario |
| `npm run build` | Build de producción | Antes de desplegar |
| `npm run db:up` | Docker con BD | Primera vez |
| `npm run db:migrate` | Crea/aplica migraciones | Después de schema changes |
| `npm run db:studio` | Ver BD visualmente | Debug de datos |
| `npm run db:down` | Para Docker | Al terminar sesión |
| `npm run lint` | Revisa código | Pre-commit |
| `npm run test` | Ejecuta tests | CI/CD |

---

## 🔧 Troubleshooting

### Puerto 3000/3001 ocupado
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencias no instalan
```bash
npm run install:all
```

### BD no conecta
```bash
npm run db:up
npm run db:logs  # Ver errores
```

### CORS error en frontend
Verifica `CORS_ORIGIN` en `.env`

---

## 📚 Documentación Completa

- **EXECUTION_GUIDE.md** - Guía detallada
- **PRODUCTION_CHECKLIST.md** - Para producción
- **GRAPHQL_CORS_SETUP.md** - API ↔ Frontend
- **ARCHITECTURE_SUMMARY.md** - Qué se arregló

---

**Tu proyecto está listo. ¡Empieza con `npm start`!** 🚀
