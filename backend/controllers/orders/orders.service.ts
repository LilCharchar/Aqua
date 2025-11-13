import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import {
  CreateOrderDto,
  OrderItemDto,
  RegisterPaymentDto,
  UpdateOrderStatusDto,
} from "./orders.dto";

const ORDER_STATUSES = [
  "Pendiente",
  "En_Proceso",
  "Confirmada",
  "Pagada",
  "Anulada",
] as const;

const PAYMENT_METHODS = ["Efectivo", "Tarjeta"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

interface MesaRow {
  id: number;
  numero: string | null;
}

interface UsuarioRow {
  id: number;
  nombre: string | null;
}

type SupabaseClient = ReturnType<SupabaseService["getClient"]>;

interface DetalleOrdenRow {
  id: number;
  platillo_id: number | null;
  cantidad: string | number;
  precio_unit: string | number | null;
  subtotal: string | number | null;
  platillo?:
    | {
        id: number;
        nombre: string;
      }
    | { id: number; nombre: string }[]
    | null;
}

interface PagoRow {
  id: number;
  metodo_pago: string;
  monto: string | number;
  cambio: string | number | null;
  fecha: string | null;
}

interface IngredientRow {
  platillo_id: number | null;
  producto_id: number | null;
  cantidad: string | number;
  producto?: { id: number; nombre: string | null } | null;
}

interface InventoryRow {
  id: number;
  producto_id: number;
  cantidad_disponible: string | number | null;
}

interface OrdenRow {
  id: number;
  mesa_id: number | null;
  mesero_id: number | null;
  fecha: string | null;
  estado: string;
  total: string | number | null;
  mesa?: MesaRow | MesaRow[] | null;
  mesero?: UsuarioRow | UsuarioRow[] | null;
  detalle_orden?: DetalleOrdenRow[] | null;
  pagos?: PagoRow[] | null;
}

interface PlatilloPrecioRow {
  id: number;
  precio: string | number;
  disponible: boolean;
}

interface NormalizedOrderItem {
  platilloId: number;
  cantidad: number;
}

interface ItemValidationSuccess {
  ok: true;
  items: NormalizedOrderItem[];
}

interface ItemValidationError {
  ok: false;
  message: string;
}

type ItemValidationResult = ItemValidationSuccess | ItemValidationError;

interface DetailInsertRow {
  platillo_id: number;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
}

interface InventoryUpdateRow {
  producto_id: number;
  cantidad_disponible: number;
}

export interface OrderItemResponse {
  id: number;
  platilloId: number | null;
  platilloNombre: string | null;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
}

export interface OrderPaymentResponse {
  id: number;
  metodoPago: string;
  monto: number;
  cambio: number | null;
  fecha: string | null;
}

export interface OrderResponse {
  id: number;
  mesaId: number | null;
  mesaNumero: string | null;
  meseroId: number | null;
  meseroNombre: string | null;
  estado: string;
  fecha: string | null;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  items: OrderItemResponse[];
  pagos: OrderPaymentResponse[];
}

export type OrdersListResponse =
  | { ok: true; orders: OrderResponse[] }
  | { ok: false; message: string };

export type OrderSingleResponse =
  | { ok: true; order: OrderResponse }
  | { ok: false; message: string };

@Injectable()
export class OrdersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private readonly orderSelect = `
    id,
    mesa_id,
    mesero_id,
    fecha,
    estado,
    total,
    mesa:mesas ( id, numero ),
    mesero:usuarios ( id, nombre ),
    detalle_orden (
      id,
      platillo_id,
      cantidad,
      precio_unit,
      subtotal,
      platillo:platillos ( id, nombre )
    ),
    pagos (
      id,
      metodo_pago,
      monto,
      cambio,
      fecha
    )
  `;

  async listOrders(status?: string): Promise<OrdersListResponse> {
    let normalizedStatus: OrderStatus | null = null;
    if (status !== undefined) {
      normalizedStatus = this.normalizeStatus(status);
      if (!normalizedStatus) {
        return { ok: false, message: "Estado de orden inválido" };
      }
    }

    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from("ordenes")
      .select(this.orderSelect)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false });

    if (normalizedStatus) {
      query = query.eq("estado", normalizedStatus);
    }

    const { data, error } = await query;

    if (error) {
      return { ok: false, message: "No se pudieron obtener las órdenes" };
    }

    const records = (data ?? []) as unknown as OrdenRow[];
    const orders = records.map((record) => this.mapOrder(record));

    return { ok: true, orders };
  }

  async getOrderById(orderId: number): Promise<OrderSingleResponse> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("ordenes")
      .select(this.orderSelect)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "Orden no encontrada" };
    }

    return { ok: true, order: this.mapOrder(data as unknown as OrdenRow) };
  }

  async createOrder(dto: CreateOrderDto): Promise<OrderSingleResponse> {
    const itemsValidation = this.validateItems(dto.items);
    if (!itemsValidation.ok) {
      return itemsValidation;
    }

    const requestedStatus = dto.estado ?? "Pendiente";
    const normalizedStatus = this.normalizeStatus(requestedStatus);
    if (!normalizedStatus) {
      return { ok: false, message: "Estado inválido" };
    }

    const mesaId = this.normalizeNumericId(dto.mesa_id);
    if (dto.mesa_id !== undefined && dto.mesa_id !== null && mesaId === null) {
      return { ok: false, message: "Mesa inválida" };
    }

    const meseroId = this.normalizeNumericId(dto.mesero_id);
    if (
      dto.mesero_id !== undefined &&
      dto.mesero_id !== null &&
      meseroId === null
    ) {
      return { ok: false, message: "Mesero inválido" };
    }

    const supabase = this.supabaseService.getClient();

    const platilloIds = itemsValidation.items.map((item) => item.platilloId);

    const { data: platillosData, error: platillosError } = await supabase
      .from("platillos")
      .select("id, precio, disponible")
      .in("id", platilloIds);

    if (platillosError) {
      return { ok: false, message: "No se pudieron validar los platillos" };
    }

    const priceMap = new Map<number, PlatilloPrecioRow>();
    for (const row of (platillosData ?? []) as unknown as PlatilloPrecioRow[]) {
      priceMap.set(row.id, row);
    }

    const detailPayload: DetailInsertRow[] = [];
    let total = 0;

    for (const item of itemsValidation.items) {
      const platillo = priceMap.get(item.platilloId);
      if (!platillo) {
        return { ok: false, message: `Platillo ${item.platilloId} no existe` };
      }

      if (!platillo.disponible) {
        return {
          ok: false,
          message: `El platillo ${item.platilloId} no está disponible`,
        };
      }

      const unitPrice = this.normalizeDecimal(platillo.precio) ?? 0;
      const precioUnit = this.toCurrency(unitPrice);
      const subtotal = this.toCurrency(precioUnit * item.cantidad);

      total += subtotal;

      detailPayload.push({
        platillo_id: item.platilloId,
        cantidad: item.cantidad,
        precio_unit: precioUnit,
        subtotal,
      });
    }

    const inventoryResult = await this.calculateInventoryAdjustments(
      itemsValidation.items,
      supabase,
    );

    if (!inventoryResult.ok) {
      return inventoryResult;
    }

    const { data: orderRow, error: orderError } = await supabase
      .from("ordenes")
      .insert([
        {
          mesa_id: mesaId,
          mesero_id: meseroId,
          estado: normalizedStatus,
          total: this.toCurrency(total),
        },
      ])
      .select("id")
      .single();

    if (orderError || !orderRow) {
      return { ok: false, message: "No se pudo crear la orden" };
    }

    const orderId = orderRow.id as number;

    const detailRows = detailPayload.map((item) => ({
      orden_id: orderId,
      ...item,
    }));

    const { error: detailError } = await supabase
      .from("detalle_orden")
      .insert(detailRows);

    if (detailError) {
      await this.rollbackOrder(orderId, supabase);
      return {
        ok: false,
        message: "No se pudo registrar el detalle de la orden",
      };
    }

    if (inventoryResult.updates.length > 0) {
      const { error: inventoryUpdateError } = await supabase
        .from("inventario")
        .upsert(inventoryResult.updates, { onConflict: "producto_id" });

      if (inventoryUpdateError) {
        await this.rollbackOrder(orderId, supabase);
        return {
          ok: false,
          message: "No se pudo actualizar el inventario",
        };
      }
    }

    return this.getOrderById(orderId);
  }

  async updateOrderStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderSingleResponse> {
    const normalizedStatus = this.normalizeStatus(dto.estado);
    if (!normalizedStatus) {
      return { ok: false, message: "Estado inválido" };
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from("ordenes")
      .update({ estado: normalizedStatus })
      .eq("id", orderId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "No se pudo actualizar la orden" };
    }

    return this.getOrderById(orderId);
  }

  async registerPayment(
    orderId: number,
    dto: RegisterPaymentDto,
  ): Promise<OrderSingleResponse> {
    const metodoPago = this.normalizePaymentMethod(dto.metodo_pago);
    if (!metodoPago) {
      return { ok: false, message: "Método de pago inválido" };
    }

    const monto = Number(dto.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return { ok: false, message: "El monto del pago debe ser mayor a 0" };
    }

    let cambio: number | null = null;
    if (dto.cambio !== undefined && dto.cambio !== null) {
      const parsed = Number(dto.cambio);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return {
          ok: false,
          message: "El cambio debe ser un número positivo",
        };
      }
      cambio = this.toCurrency(parsed);
    }

    const supabase = this.supabaseService.getClient();

    const { data: existing, error: findError } = await supabase
      .from("ordenes")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (findError || !existing) {
      return { ok: false, message: "Orden no encontrada" };
    }

    const { error } = await supabase.from("pagos").insert([
      {
        orden_id: orderId,
        metodo_pago: metodoPago,
        monto: this.toCurrency(monto),
        cambio,
      },
    ]);

    if (error) {
      return { ok: false, message: "No se pudo registrar el pago" };
    }

    return this.getOrderById(orderId);
  }

  private async calculateInventoryAdjustments(
    items: NormalizedOrderItem[],
    supabase: SupabaseClient,
  ): Promise<
    { ok: true; updates: InventoryUpdateRow[] } | { ok: false; message: string }
  > {
    if (items.length === 0) {
      return { ok: true, updates: [] };
    }

    const platilloIds = items.map((item) => item.platilloId);

    const { data, error } = await supabase
      .from("ingredientes_platillo")
      .select(
        `
        platillo_id,
        producto_id,
        cantidad,
        producto:productos ( id, nombre )
      `,
      )
      .in("platillo_id", platilloIds);

    if (error) {
      return {
        ok: false,
        message: "No se pudieron obtener los ingredientes",
      };
    }

    const quantityByPlatillo = new Map(
      items.map((item) => [item.platilloId, item.cantidad]),
    );

    const consumption = new Map<
      number,
      { required: number; nombre: string | null }
    >();

    for (const row of (data ?? []) as unknown as IngredientRow[]) {
      const platilloId = row.platillo_id ?? 0;
      const productoId = row.producto_id ?? 0;
      const platilloQty = quantityByPlatillo.get(platilloId) ?? 0;
      if (!productoId || platilloQty <= 0) continue;

      const ingredientQty = this.normalizeDecimal(row.cantidad);
      if (ingredientQty <= 0) continue;

      const required = ingredientQty * platilloQty;
      const productInfo = this.extractSingle(row.producto);
      const existing = consumption.get(productoId);
      if (existing) {
        existing.required += required;
      } else {
        consumption.set(productoId, {
          required,
          nombre: productInfo?.nombre ?? null,
        });
      }
    }

    if (consumption.size === 0) {
      return { ok: true, updates: [] };
    }

    const productIds = Array.from(consumption.keys());
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("inventario")
      .select("id, producto_id, cantidad_disponible")
      .in("producto_id", productIds);

    if (inventoryError) {
      return { ok: false, message: "No se pudo revisar el inventario" };
    }

    const inventoryMap = new Map<number, InventoryRow>();
    for (const row of (inventoryRows ?? []) as unknown as InventoryRow[]) {
      inventoryMap.set(row.producto_id, row);
    }

    const updates: InventoryUpdateRow[] = [];

    for (const [productId, info] of consumption.entries()) {
      const inventoryRow = inventoryMap.get(productId);
      if (!inventoryRow) {
        const nombre = info.nombre ?? `ID ${productId}`;
        return {
          ok: false,
          message: `El producto ${nombre} no tiene inventario registrado`,
        };
      }

      const disponible = this.normalizeDecimal(
        inventoryRow.cantidad_disponible,
      );
      const restante = disponible - info.required;
      if (restante < 0) {
        const nombre = info.nombre ?? `ID ${productId}`;
        return {
          ok: false,
          message: `No hay suficiente inventario para ${nombre}`,
        };
      }

      updates.push({
        producto_id: productId,
        cantidad_disponible: this.toQuantity(restante),
      });
    }

    return { ok: true, updates };
  }

  private mapOrder(record: OrdenRow): OrderResponse {
    const items = Array.isArray(record.detalle_orden)
      ? record.detalle_orden.map((row) => this.mapOrderItem(row))
      : [];

    const pagos = Array.isArray(record.pagos)
      ? record.pagos.map((row) => this.mapPayment(row))
      : [];

    const total = this.toCurrency(this.normalizeDecimal(record.total) ?? 0);
    const totalPagado = this.toCurrency(
      pagos.reduce((acc, pago) => acc + pago.monto, 0),
    );
    const saldoPendiente = this.toCurrency(total - totalPagado);

    return {
      id: record.id,
      mesaId: record.mesa_id ?? null,
      mesaNumero: this.extractSingle(record.mesa)?.numero ?? null,
      meseroId: record.mesero_id ?? null,
      meseroNombre: this.extractSingle(record.mesero)?.nombre ?? null,
      estado: record.estado,
      fecha: record.fecha ?? null,
      total,
      totalPagado,
      saldoPendiente: saldoPendiente < 0 ? 0 : saldoPendiente,
      items,
      pagos,
    };
  }

  private mapOrderItem(row: DetalleOrdenRow): OrderItemResponse {
    const platillo = this.extractSingle(row.platillo);
    return {
      id: row.id,
      platilloId: platillo?.id ?? row.platillo_id ?? null,
      platilloNombre: platillo?.nombre ?? null,
      cantidad: this.normalizeInteger(row.cantidad) ?? 0,
      precioUnit: this.toCurrency(this.normalizeDecimal(row.precio_unit) ?? 0),
      subtotal: this.toCurrency(this.normalizeDecimal(row.subtotal) ?? 0),
    };
  }

  private mapPayment(row: PagoRow): OrderPaymentResponse {
    return {
      id: row.id,
      metodoPago: row.metodo_pago,
      monto: this.toCurrency(this.normalizeDecimal(row.monto) ?? 0),
      cambio: row.cambio !== null ? this.toCurrency(row.cambio) : null,
      fecha: row.fecha ?? null,
    };
  }

  private validateItems(items?: OrderItemDto[]): ItemValidationResult {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        ok: false,
        message: "La orden debe contener al menos un platillo",
      };
    }

    const aggregated = new Map<number, number>();

    for (const item of items) {
      const platilloId = Number(item.platillo_id);
      if (!Number.isInteger(platilloId) || platilloId <= 0) {
        return { ok: false, message: "Platillo inválido en la orden" };
      }

      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return {
          ok: false,
          message: "La cantidad de cada platillo debe ser mayor a 0",
        };
      }

      aggregated.set(platilloId, (aggregated.get(platilloId) ?? 0) + cantidad);
    }

    const normalized: NormalizedOrderItem[] = [];
    aggregated.forEach((cantidad, platilloId) => {
      normalized.push({ platilloId, cantidad });
    });

    return { ok: true, items: normalized };
  }

  private normalizeStatus(input?: string | null): OrderStatus | null {
    if (!input) return null;
    const normalized = input.trim().toLowerCase();
    for (const status of ORDER_STATUSES) {
      if (status.toLowerCase() === normalized) {
        return status;
      }
    }
    return null;
  }

  private normalizePaymentMethod(input?: string | null): string | null {
    if (!input) return null;
    const normalized = input.trim().toLowerCase();
    for (const method of PAYMENT_METHODS) {
      if (method.toLowerCase() === normalized) {
        return method;
      }
    }
    return null;
  }

  private normalizeNumericId(
    input?: number | string | null,
  ): number | null | undefined {
    if (input === undefined) return undefined;
    if (input === null) return null;
    const parsed = Number(input);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  private normalizeDecimal(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeInteger(
    value: string | number | null | undefined,
  ): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.trunc(parsed);
  }

  private toCurrency(value: number | string | null | undefined): number {
    const numeric = this.normalizeDecimal(value ?? 0);
    return Math.round(numeric * 100) / 100;
  }

  private toQuantity(value: number | string | null | undefined): number {
    const numeric = this.normalizeDecimal(value ?? 0);
    return Math.round(numeric * 1000) / 1000;
  }

  private async rollbackOrder(
    orderId: number,
    supabase: SupabaseClient,
  ): Promise<void> {
    try {
      await supabase.from("ordenes").delete().eq("id", orderId);
    } catch {
      // no-op
    }
  }

  private extractSingle<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  }
}
