
# Registro de Decisiones de Arquitectura (ADR) - Gamificación y Reglas de Negocio

Este documento detalla las decisiones tomadas respecto a la lógica de planes, reputación y comportamiento del sistema.

---

## 1. Estrategia de Descenso de Nivel (Downgrade)

### Contexto
Los usuarios (Clientes y Trabajadores) ganan y pierden puntos dinámicamente.
¿Qué sucede cuando un usuario "Elite" (Min: 1000 pts) baja a 995 pts?

### Opciones
1.  **Downgrade Inmediato:** En el momento que `puntos < min_puntos`, se baja de nivel.
    *   *Pros:* Lógica simple (`if points < limit`).
    *   *Contras:* **"Tier Flickering"**. Un usuario oscilando entre 995 y 1005 cambiaría de nivel constantemente, confundiendo al usuario y generando notificaciones spam.
2.  **Hysteresis (Recomendado):** Se requiere caer un **10% por debajo** del umbral para perder el nivel.
    *   *Pros:* Estabilidad emocional para el usuario. Evita el "flickering".
    *   *Contras:* Lógica condicional levemente más compleja.

### Decisión
**Implementar Hysteresis del 10%.**
*   Para subir a Elite: Necesitas 1000 pts.
*   Para bajar de Elite a Pro: Necesitas caer a **900 pts**.
*   *Implementación:* En `ReputationService`, al calcular el plan, si el usuario ya tiene un plan asignado, el `minPoints` de ese plan se considera `minPoints * 0.9` para validación de permanencia.

---

## 2. Impacto de los Planes (Matriz de Beneficios)

### Contexto
Además de la comisión, los planes deben incentivar el comportamiento a través de ventajas operativas tangibles.

### Decisión: Matriz de Variables

| Variable | Starter (Nivel 1) | Pro (Nivel 2) | Elite (Nivel 3) | Justificación |
| :--- | :--- | :--- | :--- | :--- |
| **Comisión (Worker)** | 5% | 5% | **3%** | Incentivo económico directo (Hard Money). |
| **Radio de Búsqueda** | 10 km | 15 km | **25 km** | Elite puede ver trabajos más lejanos y decidir si valen la pena (High Value Jobs). |
| **Multa Cancelación (Client)** | 100% | 85% | **50%** | Cliente fiel tiene más "perdonazos". |
| **Prioridad Matching** | 0 pts | +10 pts | **+25 pts** | El algoritmo favorece a los Elite en caso de empate por distancia. |
| **Retiro de Dinero** | 48hs | 24hs | **Instantáneo** | Beneficio de flujo de caja para trabajadores confiables. |

### Implicancia Técnica
*   **Backend:** `GeoService` debe aceptar un parámetro `radius` dinámico basado en el `currentPlan` del usuario.
*   **Billing:** `BillingService` ya implementa el descuento dinámico.

---

## 3. Visibilidad de los Planes (Público vs. Interno)

### Contexto
¿Debe un cliente ver que el trabajador es "Starter"? ¿Debe un trabajador ver que el cliente es "Básico"?

### Opciones
1.  **Transparencia Total:** Mostrar etiquetas "Starter", "Pro", "Elite".
    *   *Contras:* El problema del "Cold Start". Los clientes cancelarán a trabajadores "Starter" aunque sean buenos, solo porque son nuevos.
2.  **Oculto (Internal Score):** Solo el algoritmo lo sabe.
    *   *Contras:* Se pierde el status social y el incentivo de "presumir" la insignia.

### Decisión
**Modelo Híbrido: "Badges de Excelencia" (Solo Upside)**

1.  **Nivel Starter:** **Invisible**. No se muestra etiqueta negativa. Se ve como un usuario estándar.
2.  **Nivel Pro/Elite:** **Visible**. Se muestra una insignia "Pro" o "Elite" junto al nombre.
3.  **Para el propio usuario:** Siempre visible. La UI muestra "Estás en nivel Starter, te faltan 100 pts para Pro".

### Implicancia Técnica
*   **Frontend:** Lógica condicional en `IncomingJobScreen` y `ClientView`.
    *   `if (tier === 'STARTER') return null;`
    *   `else return <Badge tier={tier} />`

---

## 4. Recálculo de Deudas por Cancelación

### Contexto
Si un trabajador Elite cancela un trabajo, ¿le cobramos penalidad?

### Decisión
Implementar **"Perdón por Desempeño"**.
*   Si `WorkerStatus = ELITE` Y `CancellationRate < 5%`:
    *   La primera cancelación del mes es **Gratuita** (Sin penalidad monetaria, aunque afecta levemente métricas internas).
*   *Implementación:* Requiere una tabla `CancellationLog` para contar cancelaciones del mes actual. (Pospuesto para Fase 4).

