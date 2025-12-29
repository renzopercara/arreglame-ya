# 📧 Email Templates System (NestJS + Handlebars)

## 🎯 Overview

El sistema de correos ha sido completamente refactorizado usando **@nestjs-modules/mailer** con **Handlebars** templates. Esto separa la lógica de presentación del código de negocio, permitiendo que cambios de diseño se realicen sin tocar la lógica de la aplicación.

### ✅ Beneficios
- **Mantenimiento sencillo**: Los diseños se actualizan en archivos `.hbs`, no en código
- **Reutilización**: Templates compartidas entre diferentes contextos
- **Profesionalismo**: HTML responsivo y bien formateado
- **Escalabilidad**: Fácil agregar nuevos tipos de emails
- **Reintentos automáticos**: Lógica de reintentos integrada en el servicio

---

## 📁 Estructura de Archivos

```
apps/api/src/mail/
├── mail.module.ts              # Configuración de MailerModule con Handlebars
├── mail.service.ts             # Servicio principal (métodos públicos)
├── templates/
│   ├── base-layout.hbs         # Layout base (header, footer, estilos)
│   ├── welcome.hbs             # Email de bienvenida
│   ├── notification.hbs        # Notificaciones genéricas
│   └── action-required.hbs     # Emails que requieren acción del usuario
```

---

## 🔧 Instalación y Configuración

### 1. Dependencias
```bash
npm install @nestjs-modules/mailer hbs
```

### 2. Variables de Entorno
Actualiza `apps/api/.env`:

```env
# SMTP Configuration
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=tu-email@gmail.com
MAIL_SMTP_PASS=tu-contraseña-app

# Email From Address
MAIL_FROM=noreply@arreglame-ya.com

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:3000
```

### 3. Configuración del Módulo

El `MailModule` configura automáticamente:
- **Transport SMTP** con autenticación
- **Handlebars Adapter** para procesar templates
- **Template directory** en `src/mail/templates`
- **Contexto global** con `appUrl` y `year`

---

## 📧 Métodos Disponibles

### 1. `sendWelcomeEmail(email, name)`
Envía email de bienvenida a usuarios recién registrados.

**Uso:**
```typescript
await this.mailService.sendWelcomeEmail('user@example.com', 'Juan');
```

**Template:** `welcome.hbs`

**Variables disponibles:**
- `name` - Nombre del usuario
- `appUrl` - URL de la aplicación
- `activationUrl` - Link para activar la cuenta
- `privacyUrl` - Link a política de privacidad
- `supportUrl` - Link a soporte
- `year` - Año actual

---

### 2. `sendNotificationEmail(email, title, message, options?)`
Envía notificaciones con contenido flexible.

**Uso:**
```typescript
await this.mailService.sendNotificationEmail(
  'user@example.com',
  'Tu trabajo fue completado',
  'El cliente ha completado y aprobado tu servicio.',
  {
    items: ['Pago procesado: $150', 'Reputación: +5 puntos'],
    ctaText: 'Ver detalles',
    ctaUrl: 'https://app.com/jobs/123',
  }
);
```

**Template:** `notification.hbs`

**Variables disponibles:**
- `title` - Título de la notificación
- `message` - Mensaje principal
- `additionalInfo` - HTML adicional (opcional)
- `items` - Array de items a mostrar (opcional)
- `ctaText` - Texto del botón CTA (opcional)
- `ctaUrl` - URL del botón CTA (opcional)

---

### 3. `sendActionRequiredEmail(email, name, title, message, actionUrl, actionButtonText, options?)`
Envía emails que requieren acción inmediata del usuario.

**Uso:**
```typescript
await this.mailService.sendActionRequiredEmail(
  'user@example.com',
  'Juan',
  'Verifica tu email',
  'Haz clic en el botón para verificar tu dirección de correo.',
  'https://app.com/verify/abc123',
  'Verificar Email',
  {
    deadline: '2025-12-31',
    details: '<p>La verificación es obligatoria para acceder a todas las funciones.</p>',
  }
);
```

**Template:** `action-required.hbs`

**Variables disponibles:**
- `name` - Nombre del usuario
- `title` - Título del email
- `message` - Mensaje descriptivo
- `actionUrl` - URL para realizar la acción
- `actionButtonText` - Texto del botón
- `deadline` - Fecha límite (opcional)
- `details` - HTML adicional con detalles (opcional)
- `supportUrl` - Link a soporte

---

### 4. `sendBulkEmail(emails[], subject, template, context)`
Envía el mismo email a múltiples destinatarios (notificaciones masivas).

**Uso:**
```typescript
await this.mailService.sendBulkEmail(
  ['user1@example.com', 'user2@example.com'],
  'Mantenimiento programado',
  'notification',
  {
    title: 'Mantenimiento de plataforma',
    message: 'Realizaremos mantenimiento el 25 de diciembre de 23:00 a 01:00',
  }
);
```

Retorna log con:
- Cantidad de emails enviados exitosamente
- Cantidad de fallos

---

## 🎨 Customización de Templates

### Estructura Base
Todos los templates heredan de `base-layout.hbs`:

```handlebars
{{!-- Body del email --}}
<h1>Tu título</h1>
<p>Tu contenido</p>

{{!-- Las variables globales están disponibles:
  - appUrl
  - year
  - Todas las variables pasadas en context}}
```

### Variables Handlebars

#### Condicionales
```handlebars
{{#if variable}}
  <p>Se muestra si variable es truthy</p>
{{/if}}

{{#unless variable}}
  <p>Se muestra si variable es falsy</p>
{{/unless}}
```

#### Iteración
```handlebars
{{#each items}}
  <li>{{this}}</li>
{{/each}}
```

#### Expresiones
```handlebars
{{name}}              {{!-- Variables simples --}}
{{{html}}}            {{!-- HTML sin escapar --}}
{{variable "default"}} {{!-- Con valor por defecto --}}
```

---

## 📝 Ejemplos de Uso en la App

### En el Auth Service (Bienvenida)
```typescript
@Injectable()
export class AuthService {
  async register(email: string, password: string, name: string) {
    // ... crear usuario ...
    
    // Emitir evento que dispara el listener
    this.eventEmitter.emit('user.registered', { email, name });
    
    return { accessToken, user };
  }
}
```

### En el Event Listener
```typescript
@Injectable()
export class UserEventsListener {
  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    await this.mailService.sendWelcomeEmail(event.email, event.name);
  }
}
```

### En Notificaciones de Trabajos
```typescript
@Injectable()
export class JobsService {
  async completeJob(jobId: string) {
    // ... marcar trabajo como completado ...
    
    const job = await this.getJob(jobId);
    await this.mailService.sendNotificationEmail(
      job.clientEmail,
      '✅ Tu trabajo fue completado',
      `${job.workerName} ha finalizado el servicio.`,
      {
        items: [
          `Trabajo: ${job.title}`,
          `Monto: $${job.price}`,
        ],
        ctaText: 'Ver trabajo',
        ctaUrl: `${process.env.FRONTEND_URL}/jobs/${jobId}`,
      }
    );
  }
}
```

---

## 🔄 Arquitectura de Reintentos

El servicio incluye lógica de reintentos automáticos:

```typescript
// Reintenta hasta 3 veces
// Espera: 1s, 2s, 3s entre intentos
private async sendMail(options: SendEmailOptions): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Enviar...
      return;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw;
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * attempt)
      );
    }
  }
}
```

---

## 🎯 Testing en Desarrollo

### Opción 1: Ethereal Email (Pruebas Gratis)
```bash
# Ir a https://ethereal.email/
# Crear cuenta y obtener credenciales
# Usar en .env:
MAIL_SMTP_HOST=smtp.ethereal.email
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=xxxxx@ethereal.email
MAIL_SMTP_PASS=xxxxx

# Los emails se "envían" a una bandeja de prueba
# Revisar en: https://ethereal.email/messages
```

### Opción 2: Gmail (Requiere configuración)
```bash
# 1. Activar 2FA en https://myaccount.google.com/
# 2. Generar contraseña de aplicación en:
#    https://myaccount.google.com/apppasswords
# 3. Usar en .env:
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=tu-email@gmail.com
MAIL_SMTP_PASS=contraseña-de-app
```

### Opción 3: Mailhog (Docker - Local)
```bash
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Usar en .env:
MAIL_SMTP_HOST=localhost
MAIL_SMTP_PORT=1025

# Revisar emails en: http://localhost:8025
```

---

## 🚀 Mejores Prácticas

### 1. **Siempre validar emails**
```typescript
// Antes de enviar
if (!email || !isValidEmail(email)) {
  throw new BadRequestException('Email inválido');
}
```

### 2. **Usar enums para tipos**
```typescript
enum EmailTemplate {
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  ACTION_REQUIRED = 'action-required',
}
```

### 3. **Encapsular lógica de contexto**
```typescript
// Evitar pasar contexto crudo
private buildWelcomeContext(user: User) {
  return {
    name: user.name,
    activationUrl: `${this.config.get('FRONTEND_URL')}/verify/${user.token}`,
    // ... más variables
  };
}
```

### 4. **Loguear todo**
```typescript
this.logger.log(`✅ Email enviado a: ${email}`);
this.logger.error(`❌ Error enviando email:`, error);
this.logger.warn(`⚠️ Reintentando email...`);
```

### 5. **Manejar errores apropiadamente**
```typescript
try {
  await this.mailService.sendEmail(...);
} catch (error) {
  this.logger.error('Error enviando email', error);
  // No fallar la solicitud principal
  // Guardar en cola para reintentar después
}
```

---

## 📊 Monitoreo en Producción

### Variables a Monitorear
- Cantidad de emails enviados exitosamente
- Cantidad de fallos
- Tiempo promedio de envío
- Tasa de rebote

### Implementación Sugerida
```typescript
// Agregar métricas a un servicio de monitoreo
async sendWelcomeEmail(email: string, name: string) {
  const start = Date.now();
  try {
    await this.sendMail(...);
    const duration = Date.now() - start;
    this.metrics.recordEmailSent('welcome', duration);
  } catch (error) {
    this.metrics.recordEmailFailed('welcome', error);
    throw;
  }
}
```

---

## 🔐 Seguridad

### No incluir en emails:
- ❌ Contraseñas o tokens sensibles en el cuerpo (solo en URLs con expiración)
- ❌ Información personal sensible (SSN, datos bancarios)
- ❌ URLs no autenticadas a recursos privados

### Buenas prácticas:
- ✅ URLs con tokens de corta duración
- ✅ Validar origen del email en backend
- ✅ Rate limiting en endpoints de verificación
- ✅ HTTPS en todas las URLs

---

## 🛠️ Troubleshooting

### Error: "Cannot find module 'hbs'"
```bash
npm install hbs
```

### Error: "Template not found"
- Verificar ruta: `apps/api/src/mail/templates/`
- Verificar extensión: `.hbs` (no `.html`)
- Verificar nombre en `sendMail()` sin extensión

### SMTP Connection Timeout
- Verificar host y puerto
- Verificar credenciales
- Verificar firewall (especialmente puerto 465 vs 587)

### Caracteres especiales en templates
```handlebars
{{!-- Usar {{{ }}} para HTML sin escapar --}}
{{{htmlContent}}}

{{!-- Para texto normal --}}
{{textContent}}
```

---

## 📚 Referencias

- [Handlebars Docs](https://handlebarsjs.com/)
- [@nestjs-modules/mailer](https://github.com/nest-modules/mailer)
- [Nodemailer](https://nodemailer.com/)
- [MJML (Email Framework)](https://mjml.io/)

---

## ✨ Resumen

El sistema está completamente **profesionalizado** y **listo para producción**:

✅ Templates separadas en archivos `.hbs`  
✅ Handlebars para lógica de presentación  
✅ MailerModule de NestJS para gestión  
✅ Reintentos automáticos incorporados  
✅ Variables dinámicas flexibles  
✅ Soporte para bulk emails  
✅ Logging completo  
✅ Error handling robusto  

**Los cambios de diseño ahora se hacen sin tocar código de negocio. 🎉**
