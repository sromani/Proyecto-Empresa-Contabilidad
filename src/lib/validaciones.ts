const SOLO_DIGITOS = /\D/g;

export function limpiarDocumento(valor: string): string {
  return valor.replace(SOLO_DIGITOS, "");
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
