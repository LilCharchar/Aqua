import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import { CreateProductDto, UpdateProductDto } from "./inventory.dto";

interface CategoriaRow {
  id: number;
  nombre: string;
}

interface InventarioRow {
  id: number;
  cantidad_disponible: string | number | null;
  nivel_minimo: string | number | null;
}

interface ProductoRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  categoria_id: number | null;
  categoria?: CategoriaRow | null;
  inventario?: InventarioRow | InventarioRow[] | null;
}

export type ProductsResponse =
  | { ok: true; products: ProductInventoryResponse[] }
  | { ok: false; message: string };

export type ProductResponse =
  | { ok: true; product: ProductInventoryResponse }
  | { ok: false; message: string };

export type BasicResponse = { ok: true } | { ok: false; message: string };

export interface InventoryCategory {
  id: number;
  nombre: string;
}

export type CategoriesResponse =
  | { ok: true; categories: InventoryCategory[] }
  | { ok: false; message: string };

export interface ProductInventoryResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  categoriaId: number | null;
  categoriaNombre: string | null;
  inventario: {
    cantidadDisponible: number;
    nivelMinimo: number | null;
  };
}

@Injectable()
export class InventoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private readonly productSelect = `
    id,
    nombre,
    descripcion,
    unidad,
    categoria_id,
    categoria:categorias ( id, nombre ),
    inventario ( id, cantidad_disponible, nivel_minimo )
  `;

  private normalizeDecimal(
    value: string | number | null | undefined,
  ): number | null {
    if (value === null || value === undefined) return null;
    const numericValue =
      typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private mapProduct(record: ProductoRow): ProductInventoryResponse {
    const inventoryRaw = Array.isArray(record.inventario)
      ? (record.inventario[0] ?? null)
      : (record.inventario ?? null);

    const cantidadDisponible =
      this.normalizeDecimal(inventoryRaw?.cantidad_disponible) ?? 0;
    const nivelMinimo = this.normalizeDecimal(inventoryRaw?.nivel_minimo);

    return {
      id: record.id,
      nombre: record.nombre,
      descripcion: record.descripcion ?? null,
      unidad: record.unidad ?? "pza",
      categoriaId: record.categoria_id ?? null,
      categoriaNombre: record.categoria?.nombre ?? null,
      inventario: {
        cantidadDisponible,
        nivelMinimo,
      },
    };
  }

  async listProducts(): Promise<ProductsResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("productos")
      .select(this.productSelect)
      .order("nombre", { ascending: true });

    if (error) {
      return { ok: false, message: "No se pudieron obtener los productos" };
    }

    const productRecords = (data ?? []) as unknown as ProductoRow[];
    const products = productRecords.map((record) => this.mapProduct(record));

    return { ok: true, products };
  }

  async listCategories(): Promise<CategoriesResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    if (error) {
      return { ok: false, message: "No se pudieron obtener las categorías" };
    }

    const categories = (data ?? []) as InventoryCategory[];
    return { ok: true, categories };
  }

  async getProductById(id: number): Promise<ProductResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("productos")
      .select(this.productSelect)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "Producto no encontrado" };
    }

    const productRecord = data as unknown as ProductoRow;
    return { ok: true, product: this.mapProduct(productRecord) };
  }

  async createProduct(dto: CreateProductDto): Promise<ProductResponse> {
    const nombre = typeof dto.nombre === "string" ? dto.nombre.trim() : "";
    if (!nombre) {
      return { ok: false, message: "El nombre es obligatorio" };
    }

    const cantidadInicial =
      dto.cantidad_inicial !== undefined ? Number(dto.cantidad_inicial) : 0;
    if (Number.isNaN(cantidadInicial) || cantidadInicial < 0) {
      return {
        ok: false,
        message: "La cantidad inicial debe ser mayor o igual a 0",
      };
    }

    const nivelMinimo =
      dto.nivel_minimo !== undefined ? Number(dto.nivel_minimo) : null;
    if (
      nivelMinimo !== null &&
      (Number.isNaN(nivelMinimo) || nivelMinimo < 0)
    ) {
      return {
        ok: false,
        message: "El nivel mínimo debe ser mayor o igual a 0",
      };
    }

    const descripcionInput =
      typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
    const descripcion = descripcionInput || null;
    const unidadInput = typeof dto.unidad === "string" ? dto.unidad.trim() : "";
    const unidad = unidadInput || "pza";

    let categoriaId: number | null = null;
    if (dto.categoria_id !== undefined && dto.categoria_id !== null) {
      const parsed = Number(dto.categoria_id);
      if (Number.isNaN(parsed)) {
        return { ok: false, message: "El ID de categoría es inválido" };
      }
      categoriaId = parsed;
    }

    const supabase = this.supabaseService.getClient();

    const { data: productRow, error: insertError } = await supabase
      .from("productos")
      .insert([
        {
          nombre,
          descripcion,
          categoria_id: categoriaId,
          unidad,
        },
      ])
      .select("id")
      .single();

    if (insertError || !productRow) {
      return { ok: false, message: "No se pudo crear el producto" };
    }

    const productId = Number((productRow as { id?: number }).id);
    if (!Number.isFinite(productId)) {
      return { ok: false, message: "No se pudo crear el producto" };
    }
    const inventoryPayload: Record<string, unknown> = {
      producto_id: productId,
      cantidad_disponible: cantidadInicial,
    };

    if (nivelMinimo !== null && dto.nivel_minimo !== undefined) {
      inventoryPayload.nivel_minimo = nivelMinimo;
    }

    const { error: inventoryError } = await supabase
      .from("inventario")
      .insert([inventoryPayload]);

    if (inventoryError) {
      await supabase.from("productos").delete().eq("id", productId);
      return {
        ok: false,
        message:
          "El producto se creó pero no se pudo inicializar el inventario",
      };
    }

    return this.getProductById(productId);
  }

  async updateProduct(
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    const productPayload: Record<string, unknown> = {};

    if (dto.nombre !== undefined) {
      if (typeof dto.nombre !== "string") {
        return { ok: false, message: "El nombre debe ser un texto" };
      }
      const nombre = dto.nombre.trim();
      if (!nombre) {
        return { ok: false, message: "El nombre no puede estar vacío" };
      }
      productPayload.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      const descripcion =
        typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
      productPayload.descripcion = descripcion || null;
    }

    if (dto.categoria_id !== undefined) {
      if (dto.categoria_id === null) {
        productPayload.categoria_id = null;
      } else {
        const categoriaId = Number(dto.categoria_id);
        if (Number.isNaN(categoriaId)) {
          return { ok: false, message: "El ID de categoría es inválido" };
        }
        productPayload.categoria_id = categoriaId;
      }
    }

    if (dto.unidad !== undefined) {
      if (typeof dto.unidad !== "string") {
        return { ok: false, message: "La unidad debe ser un texto" };
      }
      const unidad = dto.unidad.trim();
      if (!unidad) {
        return { ok: false, message: "La unidad no puede estar vacía" };
      }
      productPayload.unidad = unidad.slice(0, 16);
    }

    const inventoryPayload: Record<string, unknown> = {
      producto_id: id,
    };
    let shouldUpsertInventory = false;

    if (dto.cantidad_disponible !== undefined) {
      const cantidad = Number(dto.cantidad_disponible);
      if (Number.isNaN(cantidad) || cantidad < 0) {
        return {
          ok: false,
          message: "La cantidad disponible debe ser mayor o igual a 0",
        };
      }
      inventoryPayload.cantidad_disponible = cantidad;
      shouldUpsertInventory = true;
    }

    if (dto.nivel_minimo !== undefined) {
      const nivel = Number(dto.nivel_minimo);
      if (Number.isNaN(nivel) || nivel < 0) {
        return {
          ok: false,
          message: "El nivel mínimo debe ser mayor o igual a 0",
        };
      }
      inventoryPayload.nivel_minimo = nivel;
      shouldUpsertInventory = true;
    }

    if (Object.keys(productPayload).length === 0 && !shouldUpsertInventory) {
      return { ok: false, message: "No hay cambios para aplicar" };
    }

    const supabase = this.supabaseService.getClient();

    if (Object.keys(productPayload).length > 0) {
      const { error: updateError } = await supabase
        .from("productos")
        .update(productPayload)
        .eq("id", id);

      if (updateError) {
        return { ok: false, message: "No se pudo actualizar el producto" };
      }
    }

    if (shouldUpsertInventory) {
      const { error: inventoryError } = await supabase
        .from("inventario")
        .upsert([inventoryPayload], { onConflict: "producto_id" });

      if (inventoryError) {
        return { ok: false, message: "No se pudo actualizar el inventario" };
      }
    }

    return this.getProductById(id);
  }

  async deleteProduct(id: number): Promise<BasicResponse> {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: findError } = await supabase
      .from("productos")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      return { ok: false, message: "No se pudo validar el producto" };
    }

    if (!existing) {
      return { ok: false, message: "Producto no encontrado" };
    }

    const { error } = await supabase.from("productos").delete().eq("id", id);

    if (error) {
      return { ok: false, message: "No se pudo eliminar el producto" };
    }

    return { ok: true };
  }
}
