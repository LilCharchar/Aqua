import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import {
  CreatePlatilloDto,
  PlatilloIngredientDto,
  UpdatePlatilloDto,
} from "./platillos.dto";

interface SupervisorRow {
  id: number;
  nombre: string | null;
}

interface PlatilloIngredientRow {
  id: number;
  cantidad: string | number;
  producto_id: number | null;
  producto?: {
    id: number;
    nombre: string;
    unidad: string | null;
    inventario?: {
      cantidad_disponible: number | string;
    } | null;
  } | null;
}

interface PlatilloRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  disponible: boolean;
  imagen_url: string | null;
  supervisor_id: number | null;
  creado_en: string | null;
  supervisor?: SupervisorRow | null;
  ingredientes?: PlatilloIngredientRow[] | null;
}

interface NormalizedIngredient {
  productoId: number;
  cantidad: number;
}

interface IngredientValidationSuccess {
  ok: true;
  provided: boolean;
  items: NormalizedIngredient[];
}

interface IngredientValidationError {
  ok: false;
  message: string;
}

interface SupervisorValidationSuccess {
  ok: true;
  value: number | null | undefined;
}

interface SupervisorValidationError {
  ok: false;
  message: string;
}

export interface PlatilloIngredientResponse {
  id: number;
  productoId: number | null;
  productoNombre: string | null;
  productoUnidad: string | null;
  cantidad: number;
}

export interface PlatilloResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagenUrl: string | null;
  supervisorId: number | null;
  supervisorNombre: string | null;
  creadoEn: string | null;
  ingredientes: PlatilloIngredientResponse[];
  cantidadPreparable: number;
}

export type PlatillosResponse =
  | { ok: true; platillos: PlatilloResponse[] }
  | { ok: false; message: string };

export type PlatilloSingleResponse =
  | { ok: true; platillo: PlatilloResponse }
  | { ok: false; message: string };

export type PlatilloBasicResponse =
  | { ok: true }
  | { ok: false; message: string };

type IngredientValidationResult =
  | IngredientValidationSuccess
  | IngredientValidationError;

type SupervisorValidationResult =
  | SupervisorValidationSuccess
  | SupervisorValidationError;

@Injectable()
export class PlatillosService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private readonly platilloSelect = `
    id,
    nombre,
    descripcion,
    precio,
    disponible,
    imagen_url,
    supervisor_id,
    creado_en,
    supervisor:usuarios ( id, nombre ),
    ingredientes:ingredientes_platillo (
      id,
      cantidad,
      producto_id,
      producto:productos (
        id,
        nombre,
        unidad,
        inventario ( cantidad_disponible )
      )
    )
  `;

  private normalizeDecimal(
    value: string | number | null | undefined,
  ): number | null {
    if (value === null || value === undefined) return null;
    const numericValue =
      typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private mapIngredient(
    row: PlatilloIngredientRow,
  ): PlatilloIngredientResponse {
    return {
      id: row.id,
      productoId: row.producto?.id ?? row.producto_id ?? null,
      productoNombre: row.producto?.nombre ?? null,
      productoUnidad: row.producto?.unidad ?? null,
      cantidad: this.normalizeDecimal(row.cantidad) ?? 0,
    };
  }

  private mapPlatillo(record: PlatilloRow): PlatilloResponse {
    const ingredientes = Array.isArray(record.ingredientes)
      ? record.ingredientes.map((ing) => this.mapIngredient(ing))
      : [];

    let maxPreparable = Infinity;
    let hasIngredients = false;

    if (ingredientes.length > 0) {
      hasIngredients = true;
      for (const ing of record.ingredientes || []) {
        const required = this.normalizeDecimal(ing.cantidad) ?? 0;
        const available = this.normalizeDecimal(ing.producto?.inventario?.cantidad_disponible) ?? 0;

        if (required > 0) {
          const possible = Math.floor(available / required);
          if (possible < maxPreparable) {
            maxPreparable = possible;
          }
        }
      }
    } else {
      maxPreparable = 0;
    }

    if (maxPreparable === Infinity) maxPreparable = 0;

    return {
      id: record.id,
      nombre: record.nombre,
      descripcion: record.descripcion ?? null,
      precio: this.normalizeDecimal(record.precio) ?? 0,
      disponible: maxPreparable > 0,
      imagenUrl: record.imagen_url ?? null,
      supervisorId: record.supervisor_id ?? null,
      supervisorNombre: record.supervisor?.nombre ?? null,
      creadoEn: record.creado_en ?? null,
      ingredientes,
      cantidadPreparable: maxPreparable,
    };
  }

  private validateIngredients(
    input?: PlatilloIngredientDto[],
  ): IngredientValidationResult {
    if (input === undefined) {
      return { ok: true, provided: false, items: [] };
    }

    if (!Array.isArray(input)) {
      return { ok: false, message: "Los ingredientes deben ser una lista" };
    }

    const normalized: NormalizedIngredient[] = [];

    for (const ingredient of input) {
      const productoId = Number(ingredient.producto_id);
      if (!Number.isInteger(productoId) || productoId <= 0) {
        return {
          ok: false,
          message: "Cada ingrediente debe tener un producto válido",
        };
      }

      const cantidad = Number(ingredient.cantidad);
      if (Number.isNaN(cantidad) || cantidad <= 0) {
        return {
          ok: false,
          message: "La cantidad del ingrediente debe ser mayor a 0",
        };
      }

      normalized.push({ productoId, cantidad });
    }

    return { ok: true, provided: true, items: normalized };
  }

  private validateSupervisorId(
    input: number | null | undefined,
  ): SupervisorValidationResult {
    if (input === undefined) {
      return { ok: true, value: undefined };
    }

    if (input === null) {
      return { ok: true, value: null };
    }

    const parsed = Number(input);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { ok: false, message: "El supervisor es inválido" };
    }

    return { ok: true, value: parsed };
  }

  async listPlatillos(): Promise<PlatillosResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("platillos")
      .select(this.platilloSelect)
      .order("nombre", { ascending: true });

    if (error) {
      return { ok: false, message: "No se pudieron obtener los platillos" };
    }

    const rows = (data ?? []) as unknown as PlatilloRow[];
    return { ok: true, platillos: rows.map((row) => this.mapPlatillo(row)) };
  }

  async getPlatilloById(id: number): Promise<PlatilloSingleResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("platillos")
      .select(this.platilloSelect)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "Platillo no encontrado" };
    }

    return {
      ok: true,
      platillo: this.mapPlatillo(data as unknown as PlatilloRow),
    };
  }

  async createPlatillo(
    dto: CreatePlatilloDto,
  ): Promise<PlatilloSingleResponse> {
    const nombre = typeof dto.nombre === "string" ? dto.nombre.trim() : "";
    if (!nombre) {
      return { ok: false, message: "El nombre es obligatorio" };
    }

    const precio = Number(dto.precio);
    if (Number.isNaN(precio) || precio < 0) {
      return { ok: false, message: "El precio debe ser mayor o igual a 0" };
    }

    const supervisorValidation = this.validateSupervisorId(dto.supervisor_id);
    if (!supervisorValidation.ok) {
      return supervisorValidation;
    }

    let disponible = true;
    if (dto.disponible !== undefined) {
      if (typeof dto.disponible !== "boolean") {
        return {
          ok: false,
          message: "El campo disponible debe ser booleano",
        };
      }
      disponible = dto.disponible;
    }

    const ingredientesValidation = this.validateIngredients(dto.ingredientes);
    if (!ingredientesValidation.ok) {
      return ingredientesValidation;
    }

    const descripcionInput =
      typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
    const descripcion = descripcionInput || null;

    const imagenUrlInput =
      typeof dto.imagen_url === "string" ? dto.imagen_url.trim() : "";
    const imagen_url = imagenUrlInput || null;

    const payload: Record<string, unknown> = {
      nombre,
      descripcion,
      precio,
      disponible,
      imagen_url,
    };

    if (supervisorValidation.value !== undefined) {
      payload.supervisor_id = supervisorValidation.value;
    }

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("platillos")
      .insert([payload])
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, message: "No se pudo crear el platillo" };
    }

    const platilloId = Number((data as { id?: number }).id);
    if (!Number.isFinite(platilloId)) {
      return { ok: false, message: "No se pudo crear el platillo" };
    }

    if (
      ingredientesValidation.provided &&
      ingredientesValidation.items.length
    ) {
      const ingredientRows = ingredientesValidation.items.map((item) => ({
        platillo_id: platilloId,
        producto_id: item.productoId,
        cantidad: item.cantidad,
      }));

      const { error: ingredientsError } = await supabase
        .from("ingredientes_platillo")
        .insert(ingredientRows);

      if (ingredientsError) {
        await supabase.from("platillos").delete().eq("id", platilloId);
        return {
          ok: false,
          message:
            "El platillo se creó pero no se pudieron guardar los ingredientes",
        };
      }
    }

    return this.getPlatilloById(platilloId);
  }

  async updatePlatillo(
    id: number,
    dto: UpdatePlatilloDto,
  ): Promise<PlatilloSingleResponse> {
    if (!dto || typeof dto !== "object") {
      return { ok: false, message: "Datos de actualización inválidos" };
    }

    const payload: Record<string, unknown> = {};

    if (dto.nombre !== undefined) {
      if (typeof dto.nombre !== "string") {
        return { ok: false, message: "El nombre debe ser un texto" };
      }
      const nombre = dto.nombre.trim();
      if (!nombre) {
        return { ok: false, message: "El nombre no puede estar vacío" };
      }
      payload.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      const descripcion =
        typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
      payload.descripcion = descripcion || null;
    }

    if (dto.imagen_url !== undefined) {
      const imagenUrl =
        typeof dto.imagen_url === "string" ? dto.imagen_url.trim() : "";
      payload.imagen_url = imagenUrl || null;
    }

    if (dto.precio !== undefined) {
      const precio = Number(dto.precio);
      if (Number.isNaN(precio) || precio < 0) {
        return { ok: false, message: "El precio debe ser mayor o igual a 0" };
      }
      payload.precio = precio;
    }

    if (dto.disponible !== undefined) {
      if (typeof dto.disponible !== "boolean") {
        return {
          ok: false,
          message: "El campo disponible debe ser booleano",
        };
      }
      payload.disponible = dto.disponible;
    }

    const supervisorValidation = this.validateSupervisorId(dto.supervisor_id);
    if (!supervisorValidation.ok) {
      return supervisorValidation;
    }
    if (supervisorValidation.value !== undefined) {
      payload.supervisor_id = supervisorValidation.value;
    }

    const ingredientesValidation = this.validateIngredients(dto.ingredientes);
    if (!ingredientesValidation.ok) {
      return ingredientesValidation;
    }

    const shouldUpdateIngredients = ingredientesValidation.provided;

    if (!shouldUpdateIngredients && Object.keys(payload).length === 0) {
      return { ok: false, message: "No hay cambios para aplicar" };
    }

    const supabase = this.supabaseService.getClient();

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from("platillos")
        .update(payload)
        .eq("id", id);

      if (error) {
        return { ok: false, message: "No se pudo actualizar el platillo" };
      }
    }

    if (shouldUpdateIngredients) {
      const { error: deleteError } = await supabase
        .from("ingredientes_platillo")
        .delete()
        .eq("platillo_id", id);

      if (deleteError) {
        return {
          ok: false,
          message: "No se pudieron limpiar los ingredientes del platillo",
        };
      }

      if (ingredientesValidation.items.length) {
        const ingredientRows = ingredientesValidation.items.map((item) => ({
          platillo_id: id,
          producto_id: item.productoId,
          cantidad: item.cantidad,
        }));

        const { error: insertError } = await supabase
          .from("ingredientes_platillo")
          .insert(ingredientRows);

        if (insertError) {
          return {
            ok: false,
            message: "No se pudieron actualizar los ingredientes",
          };
        }
      }
    }

    return this.getPlatilloById(id);
  }

  async deletePlatillo(id: number): Promise<PlatilloBasicResponse> {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: findError } = await supabase
      .from("platillos")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      return { ok: false, message: "No se pudo validar el platillo" };
    }

    if (!existing) {
      return { ok: false, message: "Platillo no encontrado" };
    }

    const { error } = await supabase.from("platillos").delete().eq("id", id);

    if (error) {
      return { ok: false, message: "No se pudo eliminar el platillo" };
    }

    return { ok: true };
  }
}
