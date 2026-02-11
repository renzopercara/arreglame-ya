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
    description: 'Comienza a recibir trabajos',
    icon: 'Rocket',
    color: 'emerald',
    articleCount: 1,
  },
  {
    id: 'ubicacion',
    name: 'Ubicación',
    description: 'Configura tu GPS',
    icon: 'MapPin',
    color: 'blue',
    articleCount: 1,
  },
  {
    id: 'especialidades',
    name: 'Especialidades',
    description: 'Gestiona tus servicios',
    icon: 'Briefcase',
    color: 'purple',
    articleCount: 1,
  },
  {
    id: 'cobros',
    name: 'Cobros',
    description: 'Sistema de pagos',
    icon: 'Wallet',
    color: 'amber',
    articleCount: 1,
  },
  {
    id: 'verificacion',
    name: 'Verificación',
    description: 'Obtén tu sello KYC',
    icon: 'ShieldCheck',
    color: 'red',
    articleCount: 1,
  },
];

export const helpArticles: HelpArticle[] = [
  // Primeros Pasos
  {
    id: 'comenzar-como-profesional',
    slug: 'comenzar-como-profesional',
    title: '¿Cómo empezar a recibir trabajos?',
    excerpt: 'Para recibir solicitudes, asegúrate de tener tu perfil completo y al menos una especialidad activa.',
    categoryId: 'primeros-pasos',
    isFeatured: true,
    content: `# ¿Cómo empezar a recibir trabajos?

Para recibir solicitudes, asegúrate de tener tu perfil completo y al menos una especialidad activa. Nuestro equipo revisará tu perfil en un plazo de 24hs para darte de alta.

## Pasos para comenzar

1. **Completa tu perfil**: Asegúrate de que toda tu información esté actualizada
2. **Agrega especialidades**: Añade al menos una especialidad desde tu catálogo de servicios
3. **Activa tus servicios**: Marca tus servicios como activos para que los clientes puedan encontrarte
4. **Espera la revisión**: Nuestro equipo revisará tu perfil en un plazo de 24 horas

## Requisitos básicos

- Foto de perfil profesional
- Información de contacto completa
- Al menos una especialidad activa
- Disponibilidad configurada

Una vez que tu perfil sea aprobado, comenzarás a recibir solicitudes de trabajo de clientes en tu área.`,
  },
  
  // Ubicación
  {
    id: 'gestion-ubicacion',
    slug: 'gestion-ubicacion',
    title: 'Configurando tu ubicación',
    excerpt: 'La app utiliza tu ubicación actual para mostrarte a clientes cercanos.',
    categoryId: 'ubicacion',
    isFeatured: true,
    content: `# Configurando tu ubicación

La app utiliza tu ubicación actual para mostrarte a clientes cercanos. Asegúrate de dar permisos de GPS para que tu perfil sea visible en el mapa de búsqueda.

## Permisos de ubicación

Para que los clientes puedan encontrarte, necesitas:

1. **Activar GPS**: Habilita el GPS en tu dispositivo
2. **Dar permisos**: Permite que la app acceda a tu ubicación
3. **Mantener activo**: Mantén la ubicación activa mientras estés disponible

## ¿Por qué es importante?

- Los clientes buscan profesionales cercanos a su ubicación
- Tu perfil aparecerá en el mapa de búsqueda
- Recibirás más solicitudes de trabajo en tu zona
- Los clientes pueden ver qué tan lejos estás

## Privacidad

Tu ubicación solo se comparte con clientes cuando:
- Tienes servicios activos
- Estás en modo ONLINE
- Un cliente busca profesionales en tu área`,
  },
  
  // Especialidades
  {
    id: 'especialidades-y-experiencia',
    slug: 'especialidades-y-experiencia',
    title: 'Especialidades y Experiencia',
    excerpt: 'Puedes añadir múltiples servicios desde tu perfil.',
    categoryId: 'especialidades',
    isFeatured: true,
    content: `# Especialidades y Experiencia

Puedes añadir múltiples servicios desde tu perfil. Detallar tus años de experiencia ayuda a que los clientes te elijan sobre otros profesionales.

## Agregar especialidades

1. Ve a tu Panel Profesional
2. Toca el botón "+" en "Mi Catálogo de Servicios"
3. Selecciona la especialidad que deseas agregar
4. Indica tus años de experiencia
5. Guarda los cambios

## La importancia de la experiencia

Indicar tus años de experiencia:
- Genera confianza en los clientes
- Te diferencia de otros profesionales
- Puede justificar mejores tarifas
- Aumenta tus probabilidades de ser elegido

## Consejos

- **Sé honesto**: Indica tu experiencia real
- **Múltiples servicios**: Agrega todas tus especialidades
- **Actualiza regularmente**: Mantén tu experiencia al día
- **Detalla tu expertise**: Cuanto más específico, mejor`,
  },
  
  // Cobros
  {
    id: 'cobros-y-pagos',
    slug: 'cobros-y-pagos',
    title: 'Sistema de Cobros',
    excerpt: 'Tus ganancias se verán reflejadas en tu balance.',
    categoryId: 'cobros',
    isFeatured: true,
    content: `# Sistema de Cobros

Tus ganancias se verán reflejadas en tu balance. Puedes configurar tus métodos de cobro desde la sección de configuración de cuenta.

## Cómo funciona

1. **Completas un trabajo**: El cliente confirma que el servicio fue completado
2. **Pago procesado**: El dinero se acredita automáticamente a tu balance
3. **Retira tus ganancias**: Configura tu método de cobro y solicita retiros

## Configurar métodos de cobro

Para recibir tus pagos:

1. Ve a tu Perfil
2. Selecciona "Configuración de Cuenta"
3. Agrega tu información bancaria
4. Verifica tus datos

## Balance disponible

Puedes ver tu balance actual en:
- Panel Profesional (tarjeta "Balance")
- Sección de Pagos en tu perfil

## Retiros

- **Mínimo**: $500 para solicitar retiro
- **Tiempo de procesamiento**: 2-5 días hábiles
- **Sin costo adicional**: Los retiros son gratuitos

## Comisión de la plataforma

Arreglame Ya cobra una comisión del 15% por cada trabajo completado, que incluye:
- Uso de la plataforma
- Procesamiento de pagos
- Soporte técnico
- Seguridad de transacciones`,
  },
  
  // Verificación
  {
    id: 'verificacion-perfil',
    slug: 'verificacion-perfil',
    title: 'Sello de Verificación',
    excerpt: 'Un perfil verificado (KYC) recibe hasta un 300% más de contactos.',
    categoryId: 'verificacion',
    isFeatured: true,
    content: `# Sello de Verificación

Un perfil verificado (KYC) recibe hasta un 300% más de contactos. Sube una foto de tu documento para obtener tu insignia.

## ¿Por qué verificar tu perfil?

Beneficios de la verificación:

- **300% más contactos**: Los perfiles verificados son preferidos por los clientes
- **Mayor confianza**: Los clientes confían más en profesionales verificados
- **Acceso a pagos**: Necesario para recibir pagos por tus trabajos
- **Mejor posicionamiento**: Apareces antes en los resultados de búsqueda

## Proceso de verificación KYC

1. Ve a tu Perfil
2. Selecciona "Verificar Identidad"
3. Sube una foto del frente de tu documento de identidad
4. Sube una foto del reverso de tu documento
5. Toma una selfie sosteniendo el documento
6. Espera la aprobación (24-48 horas)

## Documentos aceptados

- DNI (Documento Nacional de Identidad)
- Pasaporte
- Licencia de conducir

## Consejos para una verificación exitosa

- Usa fotos claras y bien iluminadas
- Asegúrate de que todos los datos sean legibles
- Tu rostro debe ser visible en la selfie
- El documento debe estar vigente

## Estados de verificación

- **PENDING_SUBMISSION**: Aún no has enviado documentos
- **PENDING_REVIEW**: En revisión por nuestro equipo
- **APPROVED**: ¡Verificación completa! Ya tienes tu insignia
- **REJECTED**: Necesitas reenviar documentos

Si tu verificación es rechazada, revisa que las fotos sean claras y que la información coincida.`,
  },
  
  // Keep original articles for backward compatibility
  {
    id: 'como-empezar',
    slug: 'como-empezar',
    title: '¿Cómo empezar en Arreglame Ya?',
    excerpt: 'Guía completa para dar tus primeros pasos como profesional',
    categoryId: 'primeros-pasos',
    isFeatured: false,
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
    question: '¿Cómo empezar a recibir trabajos?',
    articleSlug: 'comenzar-como-profesional',
  },
  {
    id: 'faq-2',
    question: '¿Cómo configuro mi ubicación?',
    articleSlug: 'gestion-ubicacion',
  },
  {
    id: 'faq-3',
    question: '¿Cómo obtengo el sello de verificación?',
    articleSlug: 'verificacion-perfil',
  },
];
