import { prisma } from "@/lib/prisma";

export type DetalleAuditoria = Record<string, unknown> | unknown[] | null;

/**
 * Registro append-only de auditoria (RF-10). No actualizar ni borrar desde la app.
 */
export async function registrarAuditoria(input: {
  usuarioId: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: DetalleAuditoria;
}): Promise<void> {
  try {
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: input.usuarioId ?? undefined,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId ?? undefined,
        detalle: input.detalle === undefined ? undefined : (input.detalle as object),
      },
    });
  } catch (e) {
    console.error("[auditoria]", e);
  }
}
