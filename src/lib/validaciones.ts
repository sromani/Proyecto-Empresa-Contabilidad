const SOLO_DIGITOS = /\D/g;

/** Valores alineados con enum Prisma `TipoDocumento`. */
export const TIPOS_DOCUMENTO_CLIENTE = ["RUT", "CI", "DNI", "PASAPORTE", "OTROS"] as const;
export type TipoDocumentoCliente = (typeof TIPOS_DOCUMENTO_CLIENTE)[number];

export function esTipoDocumentoCliente(v: string): v is TipoDocumentoCliente {
  return (TIPOS_DOCUMENTO_CLIENTE as readonly string[]).includes(v);
}

export function limpiarDocumento(valor: string): string {
  return valor.replace(SOLO_DIGITOS, "");
}

/** Pasaporte: letras y digitos, sin espacios ni signos (mayusculas). */
export function limpiarPasaporteAlfanumerico(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizarDocumentoCliente(tipo: string, valor: string): string {
  const t = tipo.toUpperCase();
  if (t === "PASAPORTE") {
    return limpiarPasaporteAlfanumerico(valor);
  }
  if (t === "OTROS") {
    return valor.trim().toUpperCase().replace(/\s+/g, " ");
  }
  return limpiarDocumento(valor);
}

export function esRutValido(rut: string): boolean {
  const limpio = limpiarDocumento(rut);
  return limpio.length === 12;
}

export function esCiUruguayValida(ci: string): boolean {
  const limpio = limpiarDocumento(ci).padStart(8, "0");

  if (!/^\d{8}$/.test(limpio)) {
    return false;
  }

  const coeficientes = [2, 9, 8, 7, 6, 3, 4];
  const base = limpio.slice(0, 7).split("").map(Number);
  const digitoVerificador = Number(limpio[7]);

  const suma = base.reduce((acc, digito, indice) => acc + digito * coeficientes[indice], 0);
  const esperado = (10 - (suma % 10)) % 10;

  return esperado === digitoVerificador;
}

/** DNI (varios paises): solo digitos, longitud razonable. */
export function esDniValido(dni: string): boolean {
  const limpio = limpiarDocumento(dni);
  return limpio.length >= 6 && limpio.length <= 10 && /^\d+$/.test(limpio);
}

/** Pasaporte internacional: alfanumerico normalizado, longitud razonable. */
export function esPasaporteValido(pasaporte: string): boolean {
  const limpio = limpiarPasaporteAlfanumerico(pasaporte);
  return limpio.length >= 5 && limpio.length <= 20;
}

/** OTROS: texto libre acotado para documentos no estandar. */
export function esOtroDocumentoValido(otro: string): boolean {
  const limpio = normalizarDocumentoCliente("OTROS", otro);
  return limpio.length >= 3 && limpio.length <= 40;
}

/** Mensaje de error de validacion o null si es valido (tras normalizar). */
export function mensajeValidacionDocumentoCliente(
  tipo: string,
  valorBruto: string,
): string | null {
  const tipoU = tipo.toUpperCase();
  if (!esTipoDocumentoCliente(tipoU)) {
    return "Tipo de documento invalido.";
  }
  const doc = normalizarDocumentoCliente(tipoU, valorBruto);
  if (!doc) {
    return "El documento es obligatorio.";
  }
  if (tipoU === "RUT") {
    return esRutValido(doc) ? null : "El RUT debe tener exactamente 12 digitos.";
  }
  if (tipoU === "CI") {
    return esCiUruguayValida(doc) ? null : "La CI ingresada no es valida para Uruguay.";
  }
  if (tipoU === "DNI") {
    return esDniValido(doc) ? null : "El DNI debe tener entre 6 y 10 digitos.";
  }
  if (tipoU === "PASAPORTE") {
    return esPasaporteValido(doc) ? null : "El pasaporte debe tener entre 5 y 20 letras o numeros.";
  }
  return esOtroDocumentoValido(doc) ? null : "OTROS debe tener entre 3 y 40 caracteres.";
}

/** Normaliza nombre/razon social para evitar mezclas raras de mayus/minus. */
export function normalizarNombrePersona(valor: string): string {
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  return limpio
    .toLocaleLowerCase("es-UY")
    .replace(/\b\p{L}/gu, (c) => c.toLocaleUpperCase("es-UY"));
}
