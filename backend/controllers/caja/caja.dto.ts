export class CreateCajaDto {
  supervisor_id!: string; // uuid
  monto_inicial!: number;
}

export class CloseCajaDto {
  monto_final!: number;
}

export class CreateTransaccionDto {
  tipo!: "Ingreso" | "Egreso";
  monto!: number;
  descripcion?: string;
}

export interface CajaTransaccionResponse {
  id: number;
  tipo: string;
  monto: number;
  descripcion: string | null;
  creado_en: string | null;
}

export interface CajaResponse {
  id: number;
  supervisorId: string | null;
  supervisorNombre: string | null;
  montoInicial: number;
  montoFinal: number | null;
  abiertoEn: string | null;
  cerradoEn: string | null;
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
  diferencia: number | null; // monto_final - saldo_actual (positivo = sobrante, negativo = faltante)
  transacciones: CajaTransaccionResponse[];
}

export type CajaSingleResponse =
  | { ok: true; caja: CajaResponse }
  | { ok: false; message: string };

export type CajasListResponse =
  | { ok: true; cajas: CajaResponse[] }
  | { ok: false; message: string };

export type BasicResponse = { ok: true } | { ok: false; message: string };
