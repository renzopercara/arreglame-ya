# 🚀 Guía Rápida: Sistema de Emails

## Enviar un Email de Bienvenida
```typescript
import { MailService } from './mail/mail.service';

constructor(private mailService: MailService) {}

// En tu servicio
await this.mailService.sendWelcomeEmail('user@example.com', 'Juan');
```

**Template:** `apps/api/src/mail/templates/welcome.hbs`

---

## Enviar Notificación Genérica
```typescript
await this.mailService.sendNotificationEmail(
  'user@example.com',
  'Tu trabajo fue aceptado',
  'El cliente ha aceptado tu presupuesto.',
  {
    items: ['Monto: $150', 'Ubicación: Calle Principal 123'],
    ctaText: 'Ver trabajo',
    ctaUrl: 'https://app.com/jobs/123'
  }
);
```

**Template:** `apps/api/src/mail/templates/notification.hbs`

---

## Enviar Email con Acción Requerida
```typescript
await this.mailService.sendActionRequiredEmail(
  'user@example.com',
  'Juan',
  'Verifica tu email',
  'Por favor haz clic en el botón para confirmar tu identidad.',
  'https://app.com/verify/token123',
  'Verificar Ahora',
  {
    deadline: '2025-12-31',
    details: '<p>La verificación vence en 48 horas.</p>'
  }
);
```

**Template:** `apps/api/src/mail/templates/action-required.hbs`

---

## Enviar Notificaciones en Masa
```typescript
await this.mailService.sendBulkEmail(
  ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  'Mantenimiento programado',
  'notification',
  {
    title: 'Notificación importante',
    message: 'Realizaremos mantenimiento el 31 de diciembre.'
  }
);
```

---

## Editar Templates

### Ubicación
```
apps/api/src/mail/templates/
├── welcome.hbs
├── notification.hbs
├── action-required.hbs
└── base-layout.hbs
```

### Variables Disponibles en Todos
- `appUrl` - URL de la aplicación
- `year` - Año actual

### Ejemplos
```handlebars
<!-- En welcome.hbs -->
<h1>¡Bienvenido {{name}}!</h1>
<a href="{{activationUrl}}">Activar Cuenta</a>

<!-- En notification.hbs -->
{{#each items}}
  <li>{{this}}</li>
{{/each}}

<!-- Condicionales -->
{{#if deadline}}
  <p>Vence: {{deadline}}</p>
{{/if}}
```

---

## Variables por Template

### `welcome.hbs`
- `name` - Nombre del usuario
- `appUrl` - URL app
- `activationUrl` - Link activación
- `privacyUrl` - Link privacidad
- `supportUrl` - Link soporte

### `notification.hbs`
- `title` - Título
- `message` - Mensaje
- `additionalInfo` - HTML extra
- `items` - Array de items
- `ctaText` - Botón texto
- `ctaUrl` - Botón URL

### `action-required.hbs`
- `name` - Nombre usuario
- `title` - Título
- `message` - Mensaje
- `actionUrl` - URL acción
- `actionButtonText` - Botón texto
- `deadline` - Fecha límite
- `details` - HTML detalles
- `supportUrl` - Link soporte

---

## Configuración del .env

```env
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=tu-email@gmail.com
MAIL_SMTP_PASS=contraseña-app
MAIL_FROM=noreply@arreglame-ya.com
FRONTEND_URL=http://localhost:3000
```

---

## Testing en Desarrollo

### Opción 1: Ethereal (Gratuito)
```
1. Ir a https://ethereal.email/
2. Crear cuenta (Auto)
3. Copiar credenciales a .env
4. Emails aparecen en portal web
```

### Opción 2: Mailhog (Docker)
```bash
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
# Acceder a http://localhost:8025
```

### Opción 3: Gmail (Con 2FA)
```
1. Activar 2FA en myaccount.google.com
2. Generar contraseña app en apppasswords
3. Usar contraseña-app en .env (no la del email)
```

---

## Mejores Prácticas

✅ **Siempre validar emails**
```typescript
if (!isValidEmail(email)) throw new BadRequestException();
```

✅ **Manejar errores sin detener el flujo**
```typescript
try {
  await this.mailService.sendWelcomeEmail(email, name);
} catch (error) {
  this.logger.error('Email no enviado', error);
  // No fallar la respuesta, guardar para reintentar
}
```

✅ **Usar métodos de alto nivel**
```typescript
// ✅ Hacer esto
await this.mailService.sendWelcomeEmail(email, name);

// ❌ No hacer esto (implementación interna)
await this.mailerService.sendMail({ ... });
```

✅ **Agregar información útil en logs**
```typescript
this.logger.log(`📧 Email enviado a: ${email} (template: welcome)`);
this.logger.error(`❌ Email fallido: ${email}`, error.message);
```

---

## Estructura HTML Profesional

El template base incluye:
- ✅ Header con logo y gradiente
- ✅ Contenido centrado y responsivo
- ✅ Footer con links y redes
- ✅ Estilos CSS embebidos
- ✅ Mobile-friendly (media queries)
- ✅ Colores consistentes
- ✅ Typography clara

---

## Agregar Nuevo Tipo de Email

### 1. Crear template
```
apps/api/src/mail/templates/my-template.hbs
```

### 2. Agregar método en MailService
```typescript
async sendMyEmail(
  email: string,
  param1: string,
  param2: string
): Promise<void> {
  await this.sendMail({
    to: email,
    subject: 'Mi Email',
    template: 'my-template',
    context: {
      param1,
      param2,
      appUrl: this.configService.get('FRONTEND_URL'),
      year: new Date().getFullYear(),
    },
  });
}
```

### 3. Usar en tu lógica
```typescript
await this.mailService.sendMyEmail(email, param1, param2);
```

---

## Archivos Principales

| Archivo | Propósito |
|---------|-----------|
| `mail.module.ts` | Configuración MailerModule |
| `mail.service.ts` | Métodos públicos de email |
| `templates/base-layout.hbs` | Layout HTML base |
| `templates/welcome.hbs` | Email bienvenida |
| `templates/notification.hbs` | Notificaciones |
| `templates/action-required.hbs` | Acciones requeridas |

---

## Comandos Útiles

```bash
# Build
npm run build

# Desarrollo
npm run start:dev

# Validar templates
# (Los errores aparecen en consola al enviar)

# Ver logs en producción
# (Usar: this.logger.log(), logger.error(), etc.)
```

---

## ¿Necesitas Ayuda?

Ver: [EMAIL_TEMPLATES_SYSTEM.md](./EMAIL_TEMPLATES_SYSTEM.md) para documentación completa.
