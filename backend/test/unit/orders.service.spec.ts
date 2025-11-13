import { OrdersService } from "../../controllers/orders/orders.service";
import { SupabaseService } from "../../src/supabase.service";
import { CreateOrderDto } from "../../controllers/orders/orders.dto";

type ListResponse = { data: unknown[] | null; error: Error | null };
type SingleResponse = {
  data: Record<string, unknown> | null;
  error: Error | null;
};

function createListOrdersBuilder(response: ListResponse) {
  const secondOrder = jest.fn().mockResolvedValue(response);
  const firstOrder = jest.fn().mockReturnValue({ order: secondOrder });
  const select = jest.fn().mockReturnValue({ order: firstOrder });
  return { select };
}

function createListOrdersFilteredBuilder(response: ListResponse) {
  const eq = jest.fn().mockResolvedValue(response);
  const secondOrder = jest.fn().mockReturnValue({ eq });
  const firstOrder = jest.fn().mockReturnValue({ order: secondOrder });
  const select = jest.fn().mockReturnValue({ order: firstOrder });
  return { select, eq };
}

function createPlatillosBuilder(response: ListResponse) {
  const inMock = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ in: inMock });
  return { select };
}

function createIngredientsBuilder(response: ListResponse) {
  const inMock = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ in: inMock });
  return { select };
}

function createInventorySelectBuilder(response: ListResponse) {
  const inMock = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ in: inMock });
  return { select };
}

function createOrderInsertBuilder(orderId: number) {
  const single = jest.fn().mockResolvedValue({
    data: { id: orderId },
    error: null,
  });
  const select = jest.fn().mockReturnValue({ single });
  const payloads: Record<string, unknown>[] = [];
  const insert = jest
    .fn()
    .mockImplementation((rows: Record<string, unknown>[]) => {
      payloads.push(rows[0]);
      return { select };
    });
  return { insert, payloads };
}

function createDetailInsertBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[][] = [];
  const insert = jest
    .fn()
    .mockImplementation((rows: Record<string, unknown>[]) => {
      payloads.push(rows.map((row) => ({ ...row })));
      return Promise.resolve({ error });
    });
  return { insert, payloads };
}

function createInventoryUpsertBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[][] = [];
  const options: Record<string, unknown>[] = [];
  const upsert = jest
    .fn()
    .mockImplementation(
      (rows: Record<string, unknown>[], opts?: Record<string, unknown>) => {
        payloads.push(rows.map((row) => ({ ...row })));
        options.push(opts ?? {});
        return Promise.resolve({ error });
      },
    );
  return { upsert, payloads, options };
}

function createGetOrderBuilder(response: SingleResponse) {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

describe("OrdersService", () => {
  let ordersService: OrdersService;
  let supabaseService: { getClient: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock }),
    };
    ordersService = new OrdersService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("listOrders", () => {
    it("regresa las órdenes con totales y pagos normalizados", async () => {
      const rows = [
        {
          id: 15,
          mesa_id: 2,
          mesero_id: 9,
          fecha: "2025-01-01T12:00:00Z",
          estado: "Pagada",
          total: "150.00",
          mesa: [{ id: 2, numero: "A1" }],
          mesero: [{ id: 9, nombre: "Laura" }],
          detalle_orden: [
            {
              id: 1,
              platillo_id: 7,
              cantidad: "2",
              precio_unit: "40",
              subtotal: "80",
              platillo: [{ id: 7, nombre: "Ceviche" }],
            },
          ],
          pagos: [
            {
              id: 3,
              metodo_pago: "Tarjeta",
              monto: "150",
              cambio: null,
              fecha: "2025-01-01T12:30:00Z",
            },
          ],
        },
      ];

      fromMock.mockImplementationOnce(() =>
        createListOrdersBuilder({ data: rows, error: null }),
      );

      const result = await ordersService.listOrders();
      expect(result).toEqual({
        ok: true,
        orders: [
          {
            id: 15,
            mesaId: 2,
            mesaNumero: "A1",
            meseroId: 9,
            meseroNombre: "Laura",
            estado: "Pagada",
            fecha: "2025-01-01T12:00:00Z",
            total: 150,
            totalPagado: 150,
            saldoPendiente: 0,
            items: [
              {
                id: 1,
                platilloId: 7,
                platilloNombre: "Ceviche",
                cantidad: 2,
                precioUnit: 40,
                subtotal: 80,
              },
            ],
            pagos: [
              {
                id: 3,
                metodoPago: "Tarjeta",
                monto: 150,
                cambio: null,
                fecha: "2025-01-01T12:30:00Z",
              },
            ],
          },
        ],
      });
    });

    it("normaliza el filtro por estado", async () => {
      const builder = createListOrdersFilteredBuilder({
        data: [],
        error: null,
      });
      fromMock.mockImplementationOnce(() => builder);

      const result = await ordersService.listOrders("pagada");
      expect(result).toEqual({ ok: true, orders: [] });
      expect(builder.eq).toHaveBeenCalledWith("estado", "Pagada");
    });

    it("rechaza estados inválidos", async () => {
      const result = await ordersService.listOrders("cerrada");
      expect(result).toEqual({
        ok: false,
        message: "Estado de orden inválido",
      });
      expect(fromMock).not.toHaveBeenCalled();
    });
  });

  describe("createOrder", () => {
    it("valida que exista al menos un platillo", async () => {
      const dto: CreateOrderDto = {
        items: [],
      };

      const result = await ordersService.createOrder(dto);
      expect(result).toEqual({
        ok: false,
        message: "La orden debe contener al menos un platillo",
      });
    });

    it("crea la orden y registra el detalle agregado", async () => {
      const platillosRows = [
        { id: 10, precio: "15.5", disponible: true },
        { id: 20, precio: "40", disponible: true },
      ];

      const ingredientesRows = [
        {
          platillo_id: 10,
          producto_id: 100,
          cantidad: "2",
          producto: [{ id: 100, nombre: "Camarón" }],
        },
        {
          platillo_id: 20,
          producto_id: 200,
          cantidad: "1",
          producto: [{ id: 200, nombre: "Pulpo" }],
        },
      ];

      const inventarioRows = [
        { id: 1, producto_id: 100, cantidad_disponible: "10" },
        { id: 2, producto_id: 200, cantidad_disponible: "5" },
      ];

      const orderRow = {
        id: 99,
        mesa_id: 3,
        mesero_id: 7,
        fecha: "2025-01-02T10:00:00Z",
        estado: "Pendiente",
        total: "86.5",
        mesa: [{ id: 3, numero: "B4" }],
        mesero: [{ id: 7, nombre: "Ana" }],
        detalle_orden: [
          {
            id: 501,
            platillo_id: 10,
            cantidad: "3",
            precio_unit: "15.5",
            subtotal: "46.5",
            platillo: [{ id: 10, nombre: "Ceviche" }],
          },
          {
            id: 502,
            platillo_id: 20,
            cantidad: "1",
            precio_unit: "40",
            subtotal: "40",
            platillo: [{ id: 20, nombre: "Pulpo" }],
          },
        ],
        pagos: [
          {
            id: 90,
            metodo_pago: "Efectivo",
            monto: "50",
            cambio: null,
            fecha: "2025-01-02T12:00:00Z",
          },
        ],
      };

      const platillosBuilder = createPlatillosBuilder({
        data: platillosRows,
        error: null,
      });
      const ingredientesBuilder = createIngredientsBuilder({
        data: ingredientesRows,
        error: null,
      });
      const inventarioBuilder = createInventorySelectBuilder({
        data: inventarioRows,
        error: null,
      });
      const orderInsertBuilder = createOrderInsertBuilder(99);
      const detailBuilder = createDetailInsertBuilder();
      const inventoryUpsertBuilder = createInventoryUpsertBuilder();
      const getOrderBuilder = createGetOrderBuilder({
        data: orderRow,
        error: null,
      });

      fromMock
        .mockImplementationOnce(() => platillosBuilder)
        .mockImplementationOnce(() => ingredientesBuilder)
        .mockImplementationOnce(() => inventarioBuilder)
        .mockImplementationOnce(() => orderInsertBuilder)
        .mockImplementationOnce(() => detailBuilder)
        .mockImplementationOnce(() => inventoryUpsertBuilder)
        .mockImplementationOnce(() => getOrderBuilder);

      const dto: CreateOrderDto = {
        mesa_id: 3,
        mesero_id: 7,
        estado: "Pendiente",
        items: [
          { platillo_id: 10, cantidad: 1 },
          { platillo_id: 10, cantidad: 2 },
          { platillo_id: 20, cantidad: 1 },
        ],
      };

      const result = await ordersService.createOrder(dto);
      expect(result).toEqual({
        ok: true,
        order: {
          id: 99,
          mesaId: 3,
          mesaNumero: "B4",
          meseroId: 7,
          meseroNombre: "Ana",
          estado: "Pendiente",
          fecha: "2025-01-02T10:00:00Z",
          total: 86.5,
          totalPagado: 50,
          saldoPendiente: 36.5,
          items: [
            {
              id: 501,
              platilloId: 10,
              platilloNombre: "Ceviche",
              cantidad: 3,
              precioUnit: 15.5,
              subtotal: 46.5,
            },
            {
              id: 502,
              platilloId: 20,
              platilloNombre: "Pulpo",
              cantidad: 1,
              precioUnit: 40,
              subtotal: 40,
            },
          ],
          pagos: [
            {
              id: 90,
              metodoPago: "Efectivo",
              monto: 50,
              cambio: null,
              fecha: "2025-01-02T12:00:00Z",
            },
          ],
        },
      });

      expect(orderInsertBuilder.payloads[0]).toEqual({
        mesa_id: 3,
        mesero_id: 7,
        estado: "Pendiente",
        total: 86.5,
      });

      expect(detailBuilder.payloads[0]).toEqual([
        {
          orden_id: 99,
          platillo_id: 10,
          cantidad: 3,
          precio_unit: 15.5,
          subtotal: 46.5,
        },
        {
          orden_id: 99,
          platillo_id: 20,
          cantidad: 1,
          precio_unit: 40,
          subtotal: 40,
        },
      ]);

      expect(inventoryUpsertBuilder.payloads[0]).toEqual([
        { producto_id: 100, cantidad_disponible: 4 },
        { producto_id: 200, cantidad_disponible: 4 },
      ]);
      expect(inventoryUpsertBuilder.options[0]).toEqual({
        onConflict: "producto_id",
      });
    });

    it("falla cuando no hay inventario suficiente", async () => {
      const platillosBuilder = createPlatillosBuilder({
        data: [{ id: 10, precio: "12", disponible: true }],
        error: null,
      });
      const ingredientesBuilder = createIngredientsBuilder({
        data: [
          {
            platillo_id: 10,
            producto_id: 100,
            cantidad: "5",
            producto: [{ id: 100, nombre: "Camarón" }],
          },
        ],
        error: null,
      });
      const inventarioBuilder = createInventorySelectBuilder({
        data: [{ id: 1, producto_id: 100, cantidad_disponible: "4" }],
        error: null,
      });

      fromMock
        .mockImplementationOnce(() => platillosBuilder)
        .mockImplementationOnce(() => ingredientesBuilder)
        .mockImplementationOnce(() => inventarioBuilder);

      const dto: CreateOrderDto = {
        items: [{ platillo_id: 10, cantidad: 1 }],
      };

      const result = await ordersService.createOrder(dto);
      expect(result).toEqual({
        ok: false,
        message: "No hay suficiente inventario para Camarón",
      });
      expect(fromMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("updateOrderStatus", () => {
    it("valida el estado solicitado", async () => {
      const result = await ordersService.updateOrderStatus(1, {
        estado: "cerrada",
      });
      expect(result).toEqual({ ok: false, message: "Estado inválido" });
      expect(fromMock).not.toHaveBeenCalled();
    });
  });

  describe("registerPayment", () => {
    it("rechaza métodos de pago no soportados", async () => {
      const result = await ordersService.registerPayment(10, {
        metodo_pago: "Cheque",
        monto: 100,
      });
      expect(result).toEqual({ ok: false, message: "Método de pago inválido" });
      expect(fromMock).not.toHaveBeenCalled();
    });
  });
});
