
import { UserRole } from "../../types";

export const LEGAL_VERSIONS = {
  CLIENT: "v1.1-2024-CLIENT-AR",
  WORKER: "v1.1-2024-WORKER-AR"
};

export const getLegalText = (role: UserRole): string => {
  if (role === UserRole.WORKER) {
    return `
# CONTRATO DE LOCACIÃƒâ€œN DE SERVICIOS - TÃƒâ€°RMINOS PARA PRESTADORES
VersiÃƒÂ³n: ${LEGAL_VERSIONS.WORKER}

1. INEXISTENCIA DE RELACIÃƒâ€œN LABORAL
El Prestador reconoce que el presente contrato se rige por las normas de LocaciÃƒÂ³n de Servicios (Art. 1251 y ss. del CCCN). No existe relaciÃƒÂ³n de dependencia, ni subordinaciÃƒÂ³n, ni exclusividad. El Prestador provee sus propias herramientas, insumos y movilidad.

2. SEGUROS Y RIESGOS DEL TRABAJO
Usted declara bajo juramento poseer una PÃƒÂ³liza de Accidentes Personales (AP) con clÃƒÂ¡usula de no repeticiÃƒÂ³n a favor de "Arreglame Ya". Usted asume total responsabilidad por su integridad fÃƒÂ­sica y la de sus dependientes, liberando de toda responsabilidad a la Plataforma y al Cliente final por cualquier siniestro ocurrido en ocasiÃƒÂ³n del servicio.

3. OBLIGACIONES AFIP
Es condiciÃƒÂ³n sine-qua-non estar inscripto en el Monotributo o RÃƒÂ©gimen General. Usted es responsable de la emisiÃƒÂ³n de facturas al cliente. La Plataforma solo factura el cargo por uso de software.

4. PIN DE SEGURIDAD Y AUDITORÃƒÂA
Usted acepta que el ingreso del PIN provisto por el cliente constituye su declaraciÃƒÂ³n jurada de haber ingresado al domicilio con autorizaciÃƒÂ³n y marca el inicio de su responsabilidad civil sobre el ÃƒÂ¡rea de trabajo.

5. PROHIBICIÃƒâ€œN DE DESVÃƒÂO (BYPASS)
Cualquier intento de acordar pagos fuera de la plataforma o compartir datos de contacto previos a la asignaciÃƒÂ³n resultarÃƒÂ¡ en la clausura inmediata de la cuenta y pÃƒÂ©rdida de saldos pendientes en concepto de clÃƒÂ¡usula penal.
    `;
  }

  return `
# TÃƒâ€°RMINOS Y CONDICIONES PARA USUARIOS CLIENTES
VersiÃƒÂ³n: ${LEGAL_VERSIONS.CLIENT}

1. INTERMEDIACIÃƒâ€œN TECNOLÃƒâ€œGICA
"Arreglame Ya" es un mercado electrÃƒÂ³nico. La responsabilidad por la calidad tÃƒÂ©cnica, puntualidad y conducta del Prestador recae exclusivamente en este ÃƒÂºltimo.

2. AUTORIZACIÃƒâ€œN DE INGRESO
Al proveer el PIN de 4 dÃƒÂ­gitos al Prestador, usted otorga una licencia de ingreso temporal a su propiedad. Usted es responsable de asegurar objetos de valor y mascotas. La Plataforma no responde por daÃƒÂ±os o hurtos.

3. CANCELACIÃƒâ€œN Y CALL-OUT FEE
Usted acepta que si el Prestador ha iniciado el trayecto y se encuentra a menos de 50% de distancia del destino, la cancelaciÃƒÂ³n generarÃƒÂ¡ un cargo automÃƒÂ¡tico compensatorio por lucro cesante y gastos de traslado.

4. RESOLUCIÃƒâ€œN DE DISPUTAS
Usted acepta el arbitraje tÃƒÂ©cnico de la Plataforma basado en el anÃƒÂ¡lisis de IA de las fotos de "Antes" y "DespuÃƒÂ©s". El veredicto de la Plataforma es vinculante para la liberaciÃƒÂ³n o reembolso de fondos.
    `;
};
