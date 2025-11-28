import { Injectable } from "@nestjs/common";
import type {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { SupabaseService } from "../../src/supabase.service";
import {
  CajaResponse,
  CajaSingleResponse,
  CajasListResponse,
  CajaTransaccionResponse,
  CloseCajaDto,
  CreateCajaDto,
  CreateTransaccionDto,
} from "./caja.dto";

interface CajaRow {
  id: number;
  supervisor_id: string | null;
  monto_inicial: string | number;
  monto_final: string | number | null;
  diferencia: string | number | null;
  abierto_en: string | null;
  cerrado_en: string | null;
  usuario?:
    | { id: string; nombre: string | null }
    | { id: string; nombre: string | null }[]
    | null;
}

interface TransaccionRow {
  id: number;
  tipo: string;
  monto: string | number;
  descripcion: string | null;
  creado_en: string | null;
}

@Injectable()
export class CajaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private readonly cajaSelect = `
    id,
    supervisor_id,
    monto_inicial,
    monto_final,
    diferencia,
    abierto_en,
    cerrado_en,
    usuario:usuarios!supervisor_id ( id, nombre )
  `;

  private toDecimal(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(num) ? num : 0;
  }

  private extractSingle<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] || null : value;
  }

  private getUnknownErrorMessage(error: unknown): string {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message?: string }).message ?? "Error desconocido";
    }

    return "Error desconocido";
  }

  private async fetchTransactions(
    cajaId: number,
    supabase: SupabaseClient,
  ): Promise<TransaccionRow[]> {
    const response = (await supabase
      .from("transacciones_caja")
      .select("id, tipo, monto, descripcion, creado_en")
      .eq("caja_id", cajaId)
      .order("creado_en", { ascending: true })) as PostgrestSingleResponse<
      TransaccionRow[]
    >;

    if (response.error) {
      console.error("Error fetching transactions:", response.error);
      return [];
    }

    return response.data ?? [];
  }

  private async getPreviousCajaMontoFinal(
    supabase: SupabaseClient,
  ): Promise<number> {
    try {
      const response: PostgrestSingleResponse<{
        monto_final: number | string | null;
      } | null> = await supabase
        .from("caja")
        .select("monto_final")
        .order("abierto_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (response.error) {
        console.warn(
          "No se pudo obtener el monto final anterior:",
          response.error,
        );
        return 0;
      }

      const lastCaja = response.data;
      if (!lastCaja || lastCaja.monto_final === null) {
        return 0;
      }

      return this.toDecimal(lastCaja.monto_final);
    } catch (error) {
      console.error("Error al consultar la última caja:", error);
      return 0;
    }
  }

  private mapCaja(
    record: CajaRow,
    transactions: TransaccionRow[],
  ): CajaResponse {
    const usuario = this.extractSingle(record.usuario);
    const montoInicial = this.toDecimal(record.monto_inicial);
    const montoFinal = this.toDecimal(record.monto_final);

    let totalIngresos = 0;
    let totalEgresos = 0;

    const mappedTransactions: CajaTransaccionResponse[] = transactions.map(
      (t) => {
        const monto = this.toDecimal(t.monto);
        if (t.tipo === "Ingreso") totalIngresos += monto;
        if (t.tipo === "Egreso") totalEgresos += monto;

        return {
          id: t.id,
          tipo: t.tipo,
          monto,
          descripcion: t.descripcion,
          creado_en: t.creado_en,
        };
      },
    );

    const saldoActual = montoInicial + totalIngresos - totalEgresos;

    // Usar diferencia de BD si existe (caja cerrada), sino calcularla (caja abierta)
    let diferencia: number | null = null;
    if (record.diferencia !== null && record.diferencia !== undefined) {
      // Usar el valor guardado en BD (registro histórico)
      diferencia = this.toDecimal(record.diferencia);
    } else if (
      record.monto_final !== null &&
      record.monto_final !== undefined
    ) {
      // Calcular si no está en BD pero tiene monto_final
      diferencia = montoFinal - saldoActual;
    }

    return {
      id: record.id,
      supervisorId: record.supervisor_id,
      supervisorNombre: usuario?.nombre || null,
      montoInicial,
      montoFinal,
      abiertoEn: record.abierto_en,
      cerradoEn: record.cerrado_en,
      totalIngresos,
      totalEgresos,
      saldoActual,
      diferencia,
      transacciones: mappedTransactions,
    };
  }

  async getCurrentCaja(): Promise<CajaSingleResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const response: PostgrestSingleResponse<CajaRow | null> = await supabase
        .from("caja")
        .select(this.cajaSelect)
        .is("cerrado_en", null)
        .order("abierto_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (response.error) {
        console.error("Error fetching current caja:", response.error);
        return { ok: false, message: response.error.message };
      }

      const record = response.data;

      if (!record) {
        return { ok: false, message: "No hay caja abierta actualmente" };
      }

      const transactions = await this.fetchTransactions(record.id, supabase);
      const caja = this.mapCaja(record, transactions);

      return { ok: true, caja };
    } catch (error: unknown) {
      console.error("Unexpected error in getCurrentCaja:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async getLastMontoFinal(): Promise<
    | { ok: true; monto: number }
    | { ok: false; message: string }
  > {
    try {
      const supabase = this.supabaseService.getClient();
      const monto = await this.getPreviousCajaMontoFinal(supabase);
      return { ok: true, monto };
    } catch (error: unknown) {
      console.error("Unexpected error in getLastMontoFinal:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async listCajas(): Promise<CajasListResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const response: PostgrestSingleResponse<CajaRow[]> = await supabase
        .from("caja")
        .select(this.cajaSelect)
        .order("abierto_en", { ascending: false });

      if (response.error) {
        console.error("Error listing cajas:", response.error);
        return { ok: false, message: response.error.message };
      }

      const data = response.data;

      if (!data || data.length === 0) {
        return { ok: true, cajas: [] };
      }

      const cajas: CajaResponse[] = [];
      for (const record of data) {
        const transactions = await this.fetchTransactions(record.id, supabase);
        cajas.push(this.mapCaja(record, transactions));
      }

      return { ok: true, cajas };
    } catch (error: unknown) {
      console.error("Unexpected error in listCajas:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async getCajaById(id: number): Promise<CajaSingleResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const response: PostgrestSingleResponse<CajaRow | null> = await supabase
        .from("caja")
        .select(this.cajaSelect)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        console.error("Error fetching caja by id:", response.error);
        return { ok: false, message: response.error.message };
      }

      const record = response.data;

      if (!record) {
        return { ok: false, message: "Caja no encontrada" };
      }

      const transactions = await this.fetchTransactions(record.id, supabase);
      const caja = this.mapCaja(record, transactions);

      return { ok: true, caja };
    } catch (error: unknown) {
      console.error("Unexpected error in getCajaById:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async openCaja(dto: CreateCajaDto): Promise<CajaSingleResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      // Validate only one caja can be open
      const openCajaResponse: PostgrestSingleResponse<{ id: number } | null> =
        await supabase
          .from("caja")
          .select("id")
          .is("cerrado_en", null)
          .maybeSingle();

      if (openCajaResponse.error) {
        console.error("Error validating open caja:", openCajaResponse.error);
        return {
          ok: false,
          message: openCajaResponse.error.message,
        };
      }

      if (openCajaResponse.data) {
        return {
          ok: false,
          message: "Ya existe una caja abierta. Ciérrala antes de abrir otra.",
        };
      }

      const montoInicial = await this.getPreviousCajaMontoFinal(supabase);

      // Create new caja
      const insertResponse: PostgrestSingleResponse<CajaRow> = await supabase
        .from("caja")
        .insert({
          supervisor_id: dto.supervisor_id,
          monto_inicial: montoInicial,
        })
        .select(this.cajaSelect)
        .single();

      if (insertResponse.error || !insertResponse.data) {
        console.error("Error creating caja:", insertResponse.error);
        return {
          ok: false,
          message: insertResponse.error?.message || "Error al crear caja",
        };
      }

      const caja = this.mapCaja(insertResponse.data, []);

      return { ok: true, caja };
    } catch (error: unknown) {
      console.error("Unexpected error in openCaja:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async closeCaja(id: number, dto: CloseCajaDto): Promise<CajaSingleResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      // Validate caja exists and is open
      const existingCajaResponse: PostgrestSingleResponse<CajaRow | null> =
        await supabase
          .from("caja")
          .select("id, cerrado_en, monto_inicial")
          .eq("id", id)
          .maybeSingle();

      if (existingCajaResponse.error || !existingCajaResponse.data) {
        return { ok: false, message: "Caja no encontrada" };
      }

      const existingCaja = existingCajaResponse.data;

      if (existingCaja.cerrado_en) {
        return { ok: false, message: "Esta caja ya está cerrada" };
      }

      // Validate amount
      if (!Number.isFinite(dto.monto_final) || dto.monto_final < 0) {
        return { ok: false, message: "Monto final inválido" };
      }

      // Calcular saldo actual para determinar diferencia
      const transactions = await this.fetchTransactions(id, supabase);
      let totalIngresos = 0;
      let totalEgresos = 0;

      for (const t of transactions) {
        const monto = this.toDecimal(t.monto);
        if (t.tipo === "Ingreso") totalIngresos += monto;
        if (t.tipo === "Egreso") totalEgresos += monto;
      }

      const montoInicial = this.toDecimal(existingCaja.monto_inicial);
      const saldoActual = montoInicial + totalIngresos - totalEgresos;
      const diferencia = dto.monto_final - saldoActual;

      // Close caja with calculated diferencia
      const updateResponse: PostgrestSingleResponse<CajaRow> = await supabase
        .from("caja")
        .update({
          monto_final: dto.monto_final,
          diferencia: diferencia,
          cerrado_en: new Date().toISOString(),
        })
        .eq("id", id)
        .select(this.cajaSelect)
        .single();

      if (updateResponse.error || !updateResponse.data) {
        console.error("Error closing caja:", updateResponse.error);
        return {
          ok: false,
          message: updateResponse.error?.message || "Error al cerrar caja",
        };
      }

      const updatedTransactions = await this.fetchTransactions(id, supabase);
      const caja = this.mapCaja(updateResponse.data, updatedTransactions);

      return { ok: true, caja };
    } catch (error: unknown) {
      console.error("Unexpected error in closeCaja:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }

  async addTransaction(
    cajaId: number,
    dto: CreateTransaccionDto,
  ): Promise<CajaSingleResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      // Validate caja exists and is open
      const existingCajaResponse: PostgrestSingleResponse<CajaRow | null> =
        await supabase
          .from("caja")
          .select("id, cerrado_en")
          .eq("id", cajaId)
          .maybeSingle();

      if (existingCajaResponse.error || !existingCajaResponse.data) {
        return { ok: false, message: "Caja no encontrada" };
      }

      const existingCaja = existingCajaResponse.data;

      if (existingCaja.cerrado_en) {
        return {
          ok: false,
          message: "No se pueden agregar transacciones a una caja cerrada",
        };
      }

      // Validate transaction data
      if (!["Ingreso", "Egreso"].includes(dto.tipo)) {
        return {
          ok: false,
          message:
            "Tipo de transacción inválido. Debe ser 'Ingreso' o 'Egreso'",
        };
      }

      if (!Number.isFinite(dto.monto) || dto.monto <= 0) {
        return { ok: false, message: "Monto inválido. Debe ser mayor a 0" };
      }

      // Insert transaction
      const insertResponse: PostgrestSingleResponse<unknown> = await supabase
        .from("transacciones_caja")
        .insert({
          caja_id: cajaId,
          tipo: dto.tipo,
          monto: dto.monto,
          descripcion: dto.descripcion || null,
        });

      if (insertResponse.error) {
        console.error("Error adding transaction:", insertResponse.error);
        return {
          ok: false,
          message:
            insertResponse.error.message || "Error al agregar transacción",
        };
      }

      // Return updated caja with all transactions
      return this.getCajaById(cajaId);
    } catch (error: unknown) {
      console.error("Unexpected error in addTransaction:", error);
      return { ok: false, message: this.getUnknownErrorMessage(error) };
    }
  }
}
