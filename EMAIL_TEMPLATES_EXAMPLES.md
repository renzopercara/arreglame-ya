# 📧 Email Templates Examples

## Welcome Email (`welcome.hbs`)

### Variables que Espera:
```typescript
{
  name: string;              // Nombre del usuario
  appUrl: string;           // URL de la aplicación
  activationUrl: string;    // Link para activar la cuenta
  privacyUrl: string;       // Link a política de privacidad
  supportUrl: string;       // Link a soporte
  year: number;             // Año actual
}
```

### Ejemplo de Uso:
```typescript
await this.mailService.sendWelcomeEmail(
  'juan@example.com',
  'Juan Pérez'
);
```

### Vista Previa (Descripción):
- Header con logo "🔧 Arreglame Ya"
- Título: "¡Bienvenido a Arreglame Ya! 🎉"
- Párrafo de bienvenida
- Highlight box con confirmación
- Lista de 5 características (✓)
- Botón "Comenzar Ahora"
- Sección de seguridad
- Footer con links

---

## Notification Email (`notification.hbs`)

### Variables que Espera:
```typescript
{
  title: string;            // Título de la notificación
  message: string;          // Mensaje principal
  additionalInfo?: string;  // HTML adicional (opcional)
  items?: string[];         // Array de items (opcional)
  ctaText?: string;        // Texto del botón (opcional)
  ctaUrl?: string;         // URL del botón (opcional)
  year: number;            // Año actual
}
```

### Ejemplos de Uso:

#### Ejemplo 1: Trabajo Completado
```typescript
await this.mailService.sendNotificationEmail(
  'cliente@example.com',
  '✅ Tu trabajo fue completado',
  'El servicio que solicitaste ha sido completado exitosamente.',
  {
    items: [
      'Servicio: Reparación de tubería',
      'Costo: $150',
      'Horas: 3',
      'Calificación del trabajador: ⭐⭐⭐⭐⭐'
    ],
    ctaText: 'Ver detalles del trabajo',
    ctaUrl: 'https://app.com/jobs/123'
  }
);
```

#### Ejemplo 2: Nuevo Trabajo Disponible
```typescript
await this.mailService.sendNotificationEmail(
  'trabajador@example.com',
  '🔔 Nuevo trabajo en tu zona',
  'Hay un nuevo trabajo que podría interesarte.',
  {
    items: [
      'Tipo: Reparación de electricidad',
      'Ubicación: Centro, a 2km de ti',
      'Presupuesto: $200-250',
      'Urgencia: Alta'
    ],
    ctaText: 'Ver oferta',
    ctaUrl: 'https://app.com/jobs/456'
  }
);
```

#### Ejemplo 3: Sin Botón (Información)
```typescript
await this.mailService.sendNotificationEmail(
  'usuario@example.com',
  'Actualización de cuenta',
  'Tu información ha sido actualizada exitosamente.'
);
```

### Vista Previa (Descripción):
- Header estándar
- Título (h1)
- Mensaje en highlight box
- Lista de items (con ✓)
- Botón CTA (si se proporciona)
- Footer

---

## Action Required Email (`action-required.hbs`)

### Variables que Espera:
```typescript
{
  name: string;             // Nombre del usuario
  title: string;            // Título del email
  message: string;          // Mensaje descriptivo
  actionUrl: string;        // URL para realizar la acción
  actionButtonText: string; // Texto del botón
  deadline?: string;        // Fecha límite (opcional)
  details?: string;         // HTML adicional (opcional)
  supportUrl: string;       // Link a soporte
  year: number;            // Año actual
}
```

### Ejemplos de Uso:

#### Ejemplo 1: Verificación de Email
```typescript
await this.mailService.sendActionRequiredEmail(
  'nuevo-usuario@example.com',
  'Juan',
  'Verifica tu dirección de email',
  'Para completar tu registro en Arreglame Ya, necesitamos que verifiques tu email.',
  'https://app.com/verify/token-xyz-123',
  'Verificar Email',
  {
    deadline: '2025-12-27',
    details: '<p>Este link vence en <strong>24 horas</strong>.</p>'
  }
);
```

#### Ejemplo 2: Cambio de Contraseña
```typescript
await this.mailService.sendActionRequiredEmail(
  'usuario@example.com',
  'María',
  'Restablece tu contraseña',
  'Recibimos una solicitud para restablecer tu contraseña. Haz clic abajo para continuar.',
  'https://app.com/reset-password/token-abc-456',
  'Restablecer Contraseña',
  {
    deadline: '2025-12-27',
    details: '<p>Si no solicitaste esto, ignora este email.</p>'
  }
);
```

#### Ejemplo 3: KYC Verification Requerida
```typescript
await this.mailService.sendActionRequiredEmail(
  'trabajador@example.com',
  'Carlos',
  'Completa tu verificación de identidad',
  'Para poder recibir pagos, necesitamos que completes la verificación de identidad (KYC).',
  'https://app.com/kyc-verification',
  'Comenzar Verificación',
  {
    deadline: '2025-12-31',
    details: `
      <ul>
        <li>Documento de identidad (DNI o Pasaporte)</li>
        <li>Foto de perfil actualizada</li>
        <li>Comprobante de domicilio</li>
      </ul>
    `
  }
);
```

#### Ejemplo 4: Acción Requerida - Disputa
```typescript
await this.mailService.sendActionRequiredEmail(
  'cliente@example.com',
  'Pedro',
  'Disputa abierta - Necesitamos tu respuesta',
  'Se ha abierto una disputa sobre el trabajo realizado. Por favor, proporciona tu versión de los hechos.',
  'https://app.com/disputes/dispute-789',
  'Ver Disputa',
  {
    deadline: '2025-12-29',
    details: '<p><strong>Plazo límite para responder: 72 horas</strong></p>'
  }
);
```

### Vista Previa (Descripción):
- Header estándar
- Título con ⚠️
- Nombre del usuario
- Mensaje en highlight box
- Sección de detalles (si se proporciona)
- Badge de deadline (si se proporciona)
- Botón CTA prominente
- Fallback con URL en texto
- Sección "¿No solicitaste esto?"
- Footer

---

## Bulk Email Notification

### Caso de Uso: Mantenimiento Programado
```typescript
const allUsers = await this.userRepository.find({
  status: 'ACTIVE'
});

const emails = allUsers.map(u => u.email);

await this.mailService.sendBulkEmail(
  emails,
  '⚠️ Mantenimiento de plataforma',
  'notification',
  {
    title: 'Mantenimiento programado',
    message: 'Realizaremos un mantenimiento de sistema el 31 de diciembre de 23:00 a 01:00 UTC.',
    additionalInfo: '<p>Durante este tiempo, la plataforma no estará disponible.</p>',
    ctaText: 'Más información',
    ctaUrl: 'https://app.com/status'
  }
);
```

Retorna:
```
📧 Email enviados: 1250/1250 (Fallos: 0)
```

---

## Customización de Estilos

### Cambiar Colores Primarios
Edita `base-layout.hbs`:

```css
/* Header gradient */
background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
/* Cambia a tus colores */
background: linear-gradient(135deg, #00d084 0%, #00c896 100%);
```

### Cambiar Tipografía
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...;
  /* Cambiar a */
  font-family: 'Helvetica', 'Arial', sans-serif;
}
```

### Agregar Logo
En `base-layout.hbs`, reemplaza:
```handlebars
<div class="header-logo">🔧 Arreglame Ya</div>
```

Con:
```handlebars
<div class="header-logo">
  <img src="https://cdn.example.com/logo.png" alt="Arreglame Ya" style="height: 40px;">
</div>
```

### Dark Mode
Agrega media query en `base-layout.hbs`:
```css
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1f2937;
    color: #f0f0f0;
  }
  .container {
    background-color: #111827;
  }
}
```

---

## Testing en Email Clients

### Ethereal Email
1. Enviar email vía servicio
2. Acceder a https://ethereal.email/messages
3. Ver preview en distintos clients

### Mailhog Web Interface
1. Enviar email
2. Acceder a http://localhost:8025
3. Ver HTML renderizado
4. Descargar fuente completa

### Gmail
1. Enviar a cuenta de prueba
2. Verificar rendering en Gmail desktop/mobile
3. Revisar spam folder

---

## Variables de Entorno Necesarias

```env
# SMTP
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=tu-email@gmail.com
MAIL_SMTP_PASS=contraseña-app

# Sender
MAIL_FROM=noreply@arreglame-ya.com

# App
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## Logging

Todos los emails generan logs:

```
✅ Email de bienvenida enviado a: juan@example.com
✅ Email de notificación enviado a: maria@example.com
✅ Email de acción requerida enviado a: carlos@example.com
❌ Error enviando email de notificación a pedro@example.com
📧 Email enviados: 1250/1250 (Fallos: 0)
```

---

## Checklist para Producción

- [ ] Variables SMTP configuradas
- [ ] MAIL_FROM es dominio verificado
- [ ] FRONTEND_URL apunta a producción
- [ ] Handlebars templates revisadas
- [ ] SPF/DKIM/DMARC configurado en DNS
- [ ] Testing completo con clientes de email
- [ ] Logging y monitoreo en place
- [ ] Rate limiting en endpoints de verificación
- [ ] Tokens con expiración en URLs
- [ ] Error handling sin perder solicitudes

---

**Documentación Completa:** Ver [EMAIL_TEMPLATES_SYSTEM.md](./EMAIL_TEMPLATES_SYSTEM.md)
