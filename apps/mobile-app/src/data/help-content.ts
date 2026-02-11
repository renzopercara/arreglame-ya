/**
 * Help Center Content Database
 * 
 * Static content management for Worker Help Center
 */

import { HelpCategory, HelpArticle, HelpFAQ } from '@/types/help';

export const helpCategories: HelpCategory[] = [
  {
    id: 'primeros-pasos',
    name: 'Primeros Pasos',
    description: 'Aprende a usar la plataforma',
    icon: 'Rocket',
    color: 'emerald',
    articleCount: 3,
  },
  {
    id: 'cobros-pagos',
    name: 'Cobros y Pagos',
    description: 'Gestiona tu dinero',
    icon: 'DollarSign',
    color: 'blue',
    articleCount: 4,
  },
  {
    id: 'gestion-servicios',
    name: 'Gestión de Servicios',
    description: 'Administra tu catálogo',
    icon: 'Briefcase',
    color: 'purple',
    articleCount: 3,
  },
  {
    id: 'seguridad-perfil',
    name: 'Seguridad y Perfil',
    description: 'Protege tu cuenta',
    icon: 'Shield',
    color: 'red',
    articleCount: 3,
  },
  {
    id: 'politicas-cancelacion',
    name: 'Políticas de Cancelación',
    description: 'Normas y procedimientos',
    icon: 'FileText',
    color: 'amber',
    articleCount: 2,
  },
];

export const helpArticles: HelpArticle[] = [
  // Primeros Pasos
  {
    id: 'como-empezar',
    slug: 'como-empezar',
    title: '¿Cómo empezar en Arreglame Ya?',
    excerpt: 'Guía completa para dar tus primeros pasos como profesional',
    categoryId: 'primeros-pasos',
    isFeatured: true,
    content: `# ¿Cómo empezar en Arreglame Ya?

Bienvenido a Arreglame Ya, la plataforma que conecta profesionales de servicios con clientes que los necesitan.

## 1. Completa tu perfil

- **Foto profesional**: Sube una foto clara donde se vea tu rostro
- **Información personal**: Completa tus datos de contacto
- **Descripción**: Cuéntanos sobre tu experiencia y habilidades

## 2. Configura tus servicios

- Ve a "Mi Catálogo de Servicios"
- Agrega los servicios que ofreces
- Define tu experiencia en cada área
- Activa/desactiva servicios según tu disponibilidad

## 3. Verifica tu identidad (KYC)

Para recibir pagos, necesitas completar la verificación de identidad:

- Sube una foto de tu documento de identidad
- Toma una selfie para verificación
- Espera la aprobación (usualmente 24-48 horas)

## 4. Recibe tu primera solicitud

Una vez configurado, los clientes podrán:

- Ver tu perfil en los resultados de búsqueda
- Solicitar tus servicios
- Contactarte directamente

## Consejos para el éxito

- **Responde rápido**: Los clientes valoran respuestas rápidas
- **Sé profesional**: Mantén una comunicación clara y respetuosa
- **Cumple tus compromisos**: La puntualidad es clave
- **Pide reseñas**: Las buenas calificaciones atraen más clientes`,
  },
  {
    id: 'configurar-servicios',
    slug: 'configurar-servicios',
    title: 'Cómo configurar tus servicios',
    excerpt: 'Aprende a gestionar tu catálogo de servicios profesionales',
    categoryId: 'primeros-pasos',
    content: `# Cómo configurar tus servicios

Tu catálogo de servicios es tu vitrina. Aprende a configurarlo correctamente.

## Agregar un nuevo servicio

1. Ve a tu Panel Profesional
2. Toca el botón "+" en "Mi Catálogo de Servicios"
3. Selecciona la categoría del servicio
4. Indica tus años de experiencia
5. Guarda los cambios

## Activar/Desactivar servicios

Usa el switch junto a cada servicio para:

- **Activar**: El servicio aparecerá en búsquedas
- **Desactivar**: El servicio no será visible (útil si estás ocupado)

## Mejores prácticas

- **Sé específico**: Indica claramente qué servicios ofreces
- **Actualiza regularmente**: Mantén tu catálogo al día
- **Experiencia real**: Indica tus años de experiencia con honestidad`,
  },
  {
    id: 'mi-primer-trabajo',
    slug: 'mi-primer-trabajo',
    title: 'Recibiendo mi primer trabajo',
    excerpt: 'Todo lo que necesitas saber para tu primera solicitud',
    categoryId: 'primeros-pasos',
    isFeatured: true,
    content: `# Recibiendo mi primer trabajo

¡Felicitaciones! Estás a punto de recibir tu primera solicitud.

## Cuando recibas una solicitud

1. **Revisa los detalles**: Lee cuidadosamente lo que el cliente necesita
2. **Confirma tu disponibilidad**: Asegúrate de poder cumplir
3. **Contacta al cliente**: Usa el chat para aclarar dudas
4. **Acuerda el precio**: Negocia un precio justo para ambos
5. **Confirma el trabajo**: Acepta la solicitud

## Durante el trabajo

- Llega puntual al lugar acordado
- Trae todas las herramientas necesarias
- Mantén comunicación con el cliente
- Trabaja con profesionalismo

## Al finalizar

- Solicita confirmación del cliente
- Pide que califique el servicio
- El pago se procesará automáticamente

## ¿Problemas durante el trabajo?

Si surge algún inconveniente:

- Comunícalo inmediatamente al cliente
- Contacta a soporte si es necesario
- Documenta todo con fotos si es relevante`,
  },

  // Cobros y Pagos
  {
    id: 'como-cobrar',
    slug: 'como-cobrar-mi-primer-trabajo',
    title: '¿Cómo cobrar mi primer trabajo?',
    excerpt: 'Guía paso a paso para recibir tu primer pago',
    categoryId: 'cobros-pagos',
    isFeatured: true,
    content: `# ¿Cómo cobrar mi primer trabajo?

El sistema de pagos de Arreglame Ya es seguro y transparente.

## Requisitos previos

Antes de poder cobrar, debes:

1. **Completar el KYC**: Verificación de identidad obligatoria
2. **Configurar tu cuenta bancaria**: Donde recibirás el dinero
3. **Tener trabajos completados**: Con confirmación del cliente

## Proceso de pago

### 1. Cliente paga el servicio
El cliente paga a través de la plataforma usando:
- Tarjeta de crédito/débito
- Transferencia bancaria
- Otros métodos disponibles

### 2. El dinero se retiene temporalmente
Arreglame Ya retiene el pago hasta que:
- El servicio sea completado
- El cliente confirme satisfacción

### 3. Liberación del pago
Una vez confirmado el trabajo:
- El dinero se acredita a tu balance
- Puedes solicitar retiro a tu cuenta bancaria

## Tiempos de procesamiento

- **Acreditación al balance**: Inmediata tras confirmación
- **Retiro a cuenta bancaria**: 2-5 días hábiles

## Comisión de la plataforma

Arreglame Ya cobra una comisión del **15%** por:
- Uso de la plataforma
- Procesamiento de pagos
- Soporte y seguridad

## Consulta tu balance

Revisa tu balance actual en:
- Panel Profesional (tarjeta "Balance")
- Sección de Pagos`,
  },
  {
    id: 'retirar-dinero',
    slug: 'retirar-dinero',
    title: 'Cómo retirar dinero',
    excerpt: 'Transfiere tus ganancias a tu cuenta bancaria',
    categoryId: 'cobros-pagos',
    content: `# Cómo retirar dinero

Transfiere tus ganancias a tu cuenta bancaria cuando lo necesites.

## Requisitos

- Balance mínimo de $500
- Cuenta bancaria verificada
- KYC completado

## Pasos para retirar

1. Ve a tu Perfil
2. Selecciona "Pagos y Balance"
3. Toca "Retirar Dinero"
4. Ingresa el monto a retirar
5. Confirma la operación

## Importante

- Los retiros se procesan en 2-5 días hábiles
- Puedes retirar hasta tu balance disponible
- No hay costo adicional por retiros`,
  },
  {
    id: 'facturas-recibos',
    slug: 'facturas-recibos',
    title: 'Facturas y recibos',
    excerpt: 'Gestiona tu documentación fiscal',
    categoryId: 'cobros-pagos',
    content: `# Facturas y recibos

Mantén un registro de todos tus trabajos y pagos.

## Historial de trabajos

En tu perfil encontrarás:
- Lista de todos los trabajos realizados
- Montos cobrados
- Fechas y clientes

## Recibos automáticos

Por cada pago recibido, se genera:
- Recibo digital
- Desglose de comisiones
- Comprobante de transferencia

## Descarga tus documentos

1. Ve a "Mis Trabajos"
2. Selecciona un trabajo completado
3. Toca "Descargar Recibo"`,
  },
  {
    id: 'comisiones-costos',
    slug: 'comisiones-costos',
    title: 'Comisiones y costos',
    excerpt: 'Entiende las comisiones de la plataforma',
    categoryId: 'cobros-pagos',
    content: `# Comisiones y costos

Transparencia total sobre los costos de usar Arreglame Ya.

## Comisión estándar: 15%

Por cada trabajo cobrado, Arreglame Ya retiene el 15% que incluye:

- Uso de la plataforma
- Procesamiento de pagos
- Soporte al cliente
- Seguridad de transacciones
- Marketing y promoción

## Ejemplo práctico

Si cobras un trabajo de $1,000:
- Comisión: $150 (15%)
- Recibes: $850

## Sin costos ocultos

- **Registro**: GRATIS
- **Publicar servicios**: GRATIS
- **Recibir solicitudes**: GRATIS
- **Retiros**: GRATIS
- **Soporte**: GRATIS

Solo pagas cuando cobras un trabajo.`,
  },

  // Gestión de Servicios
  {
    id: 'editar-servicios',
    slug: 'editar-servicios',
    title: 'Editar mis servicios',
    excerpt: 'Actualiza tu catálogo en cualquier momento',
    categoryId: 'gestion-servicios',
    content: `# Editar mis servicios

Mantén tu catálogo actualizado para atraer más clientes.

## Modificar un servicio existente

1. Ve al Panel Profesional
2. Toca el ícono de edición (lápiz) en "Mi Catálogo"
3. Selecciona el servicio a editar
4. Actualiza la información
5. Guarda los cambios

## Qué puedes editar

- Años de experiencia
- Estado (activo/inactivo)
- Especialidades dentro del servicio

## Eliminar un servicio

Si ya no ofreces un servicio:
1. Desactívalo primero
2. Contacta a soporte para eliminarlo permanentemente

## Consejos

- Actualiza tu experiencia anualmente
- Desactiva servicios cuando estés ocupado
- Agrega nuevos servicios según aprendas`,
  },
  {
    id: 'disponibilidad',
    slug: 'gestionar-disponibilidad',
    title: 'Gestionar mi disponibilidad',
    excerpt: 'Controla cuándo recibir solicitudes',
    categoryId: 'gestion-servicios',
    content: `# Gestionar mi disponibilidad

Controla tu tiempo y cuándo estar disponible para trabajar.

## Estado del trabajador

En tu panel verás tu estado actual:
- **ONLINE**: Recibiendo solicitudes activamente
- **OFFLINE**: No recibirás nuevas solicitudes

## Cambiar tu estado

1. Ve al Panel Profesional
2. En la tarjeta "Estado" verás tu estado actual
3. Contacta a soporte para cambiar de estado

## Desactivar servicios temporalmente

Si necesitas un descanso pero no desconectarte:
- Desactiva servicios individuales
- Mantén tu perfil visible
- Reactiva cuando estés listo

## Recomendaciones

- Actualiza tu estado antes de descansos largos
- Avisa a tus clientes recurrentes
- Mantén tu perfil al día`,
  },
  {
    id: 'mejorar-perfil',
    slug: 'mejorar-perfil',
    title: 'Mejorar mi perfil',
    excerpt: 'Tips para destacar y conseguir más trabajos',
    categoryId: 'gestion-servicios',
    content: `# Mejorar mi perfil

Un buen perfil atrae más clientes y mejores oportunidades.

## Foto de perfil

- Usa una foto profesional
- Fondo limpio y claro
- Sonríe y mira a la cámara
- Actualízala cada año

## Descripción

Escribe sobre:
- Tu experiencia y especialidades
- Años en el oficio
- Lo que te hace único
- Tu compromiso con la calidad

## Catálogo de servicios

- Lista todos los servicios que ofreces
- Sé específico sobre tu experiencia
- Mantén activos solo servicios que puedas cumplir

## Reseñas y calificaciones

- Pide a tus clientes que te califiquen
- Responde profesionalmente a feedback
- Aprende de las críticas constructivas

## Mantente activo

- Responde rápido a mensajes
- Acepta trabajos regularmente
- Actualiza tu perfil periódicamente`,
  },

  // Seguridad y Perfil
  {
    id: 'verificacion-identidad',
    slug: 'verificacion-identidad',
    title: 'Verificación de identidad (KYC)',
    excerpt: 'Cómo completar tu verificación para cobrar',
    categoryId: 'seguridad-perfil',
    content: `# Verificación de identidad (KYC)

La verificación de identidad es obligatoria para recibir pagos.

## ¿Por qué es necesario?

- Cumplimiento legal y regulatorio
- Prevención de fraudes
- Seguridad para todos los usuarios
- Protección de tus pagos

## Documentos necesarios

- **Identificación oficial**: DNI, Pasaporte o Licencia
- **Selfie de verificación**: Foto tuya sosteniendo el documento

## Proceso de verificación

1. Ve a tu Perfil
2. Selecciona "Verificar Identidad"
3. Sube foto del frente de tu documento
4. Sube foto del reverso de tu documento
5. Toma una selfie con el documento
6. Espera la revisión (24-48 horas)

## Estados de verificación

- **PENDING_SUBMISSION**: Aún no has enviado documentos
- **PENDING_REVIEW**: En revisión por nuestro equipo
- **APPROVED**: ¡Verificación completa!
- **REJECTED**: Necesitas reenviar documentos

## Si tu verificación es rechazada

Posibles razones:
- Documentos borrosos o ilegibles
- Información no coincide
- Documentos vencidos
- Selfie no clara

Solución: Reenvía documentos de mejor calidad.`,
  },
  {
    id: 'seguridad-cuenta',
    slug: 'seguridad-cuenta',
    title: 'Seguridad de mi cuenta',
    excerpt: 'Protege tu cuenta y datos personales',
    categoryId: 'seguridad-perfil',
    content: `# Seguridad de mi cuenta

Mantén tu cuenta segura siguiendo estas recomendaciones.

## Contraseña segura

- Usa al menos 8 caracteres
- Combina letras, números y símbolos
- No uses información personal obvia
- Cámbiala cada 3-6 meses

## Protege tus datos

- **No compartas tu contraseña** con nadie
- **No uses la misma contraseña** en otros sitios
- **Cierra sesión** en dispositivos compartidos
- **Revisa actividad** regularmente

## Alertas de seguridad

Te notificaremos si detectamos:
- Inicio de sesión desde dispositivo nuevo
- Cambio de contraseña
- Modificación de datos bancarios
- Actividad sospechosa

## Si sospechas acceso no autorizado

1. Cambia tu contraseña inmediatamente
2. Revisa tus datos de pago
3. Contacta a soporte
4. Revisa el historial de actividad

## Nunca compartas

- Tu contraseña
- Códigos de verificación
- Datos bancarios completos
- Información de documentos`,
  },
  {
    id: 'privacidad-datos',
    slug: 'privacidad-datos',
    title: 'Privacidad y datos personales',
    excerpt: 'Cómo protegemos tu información',
    categoryId: 'seguridad-perfil',
    content: `# Privacidad y datos personales

Tu privacidad es nuestra prioridad.

## Datos que recopilamos

- Información de perfil (nombre, foto, etc.)
- Datos de contacto (email, teléfono)
- Documentos de verificación (KYC)
- Información bancaria (para pagos)
- Historial de trabajos

## Cómo usamos tus datos

- Conectarte con clientes
- Procesar pagos
- Verificar identidad
- Mejorar el servicio
- Cumplimiento legal

## No compartimos sin permiso

Tu información nunca será:
- Vendida a terceros
- Compartida con fines publicitarios
- Revelada sin tu consentimiento

## Tus derechos

Puedes:
- Acceder a tus datos
- Corregir información incorrecta
- Solicitar eliminación de cuenta
- Exportar tu información

## Contacto

Para consultas sobre privacidad:
- Email: privacidad@arreglamaya.com`,
  },

  // Políticas de Cancelación
  {
    id: 'cancelar-trabajo',
    slug: 'cancelar-trabajo',
    title: 'Cómo cancelar un trabajo',
    excerpt: 'Procedimiento y consecuencias de cancelaciones',
    categoryId: 'politicas-cancelacion',
    content: `# Cómo cancelar un trabajo

A veces es necesario cancelar. Hazlo correctamente.

## Antes de aceptar

- Revisa bien los detalles
- Confirma tu disponibilidad
- Asegúrate de poder cumplir

## Si necesitas cancelar

### Antes de comenzar el trabajo

1. Contacta al cliente inmediatamente
2. Explica la razón de la cancelación
3. Cancela formalmente en la app
4. Sin penalización si es con anticipación

### Después de comenzar el trabajo

- **No recomendado**: Afecta tu reputación
- Contacta a soporte para asistencia
- Posible penalización en tu perfil

## Razones válidas para cancelar

- Emergencia personal o familiar
- Enfermedad
- Condiciones climáticas extremas
- Error en los detalles del trabajo
- Cliente no disponible

## Consecuencias de cancelaciones

**Cancelaciones ocasionales**: Sin problema

**Cancelaciones frecuentes**:
- Reducción en ranking de búsqueda
- Advertencia del sistema
- Posible suspensión de cuenta

## Recomendaciones

- Cancela solo cuando sea absolutamente necesario
- Comunica con anticipación
- Ofrece alternativas al cliente
- Sé honesto sobre las razones`,
  },
  {
    id: 'politicas-generales',
    slug: 'politicas-generales',
    title: 'Políticas generales',
    excerpt: 'Normas de uso de la plataforma',
    categoryId: 'politicas-cancelacion',
    content: `# Políticas generales

Reglas importantes para todos los profesionales.

## Código de conducta

Como profesional en Arreglame Ya debes:

- Ser respetuoso con clientes y staff
- Cumplir con trabajos aceptados
- Ser honesto en tu perfil y experiencia
- Proveer servicios de calidad
- Comunicarte profesionalmente

## Prohibiciones

**Estrictamente prohibido**:

- Solicitar pagos fuera de la plataforma
- Compartir información de contacto antes de aceptar trabajo
- Subcontratar sin autorización
- Inflar precios injustificadamente
- Acosar o amenazar usuarios

## Sistema de calificaciones

- Los clientes califican tu servicio (1-5 estrellas)
- Las calificaciones afectan tu visibilidad
- Baja calificación puede resultar en revisión de cuenta

## Disputas y quejas

Si hay un problema:
1. Intenta resolverlo con el cliente
2. Documenta todo (fotos, mensajes)
3. Contacta a soporte si no se resuelve
4. Soporte mediará y tomará decisión final

## Suspensión de cuenta

Razones para suspensión:
- Violación de políticas
- Múltiples quejas de clientes
- Fraude o actividad sospechosa
- Cancelaciones excesivas

## Apelaciones

Si tu cuenta es suspendida:
- Recibirás notificación con la razón
- Puedes apelar en 7 días
- Proporciona evidencia de tu caso
- Respuesta en 5-10 días hábiles`,
  },
];

export const helpFAQs: HelpFAQ[] = [
  {
    id: 'faq-1',
    question: '¿Cómo cobrar mi primer trabajo?',
    articleSlug: 'como-cobrar-mi-primer-trabajo',
  },
  {
    id: 'faq-2',
    question: '¿Cómo empezar en la plataforma?',
    articleSlug: 'como-empezar',
  },
  {
    id: 'faq-3',
    question: '¿Cómo verificar mi identidad?',
    articleSlug: 'verificacion-identidad',
  },
];
