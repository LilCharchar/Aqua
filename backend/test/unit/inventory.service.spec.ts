import { InventoryService } from "../../controllers/inventory/inventory.service";
import { SupabaseService } from "../../src/supabase.service";

type ListResponse = { data: unknown[] | null; error: Error | null };
type SingleResponse = {
  data: Record<string, unknown> | null;
  error: Error | null;
};

function createListProductsBuilder(response: ListResponse) {
  const order = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ order });
  return { select };
}

function createGetProductBuilder(response: SingleResponse) {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

function createInsertProductBuilder(response: SingleResponse) {
  const single = jest.fn().mockResolvedValue(response);
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

function createInventoryInsertBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[] = [];
  const insert = jest
    .fn()
    .mockImplementation((rows: Record<string, unknown>[]) => {
      payloads.push(rows[0]);
      return Promise.resolve({ error });
    });
  return { insert, payloads };
}

function createUpdateProductBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[] = [];
  const eq = jest.fn().mockResolvedValue({ error });
  const update = jest
    .fn()
    .mockImplementation((payload: Record<string, unknown>) => {
      payloads.push(payload);
      return { eq };
    });
  return { update, payloads };
}

function createUpsertInventoryBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[] = [];
  const options: Record<string, unknown>[] = [];
  const upsert = jest
    .fn()
    .mockImplementation(
      (rows: Record<string, unknown>[], opts?: Record<string, unknown>) => {
        payloads.push(rows[0]);
        options.push(opts ?? {});
        return Promise.resolve({ error });
      },
    );
  return { upsert, payloads, options };
}

function createDeleteBuilder(error: Error | null = null) {
  const eq = jest.fn().mockResolvedValue({ error });
  const del = jest.fn().mockReturnValue({ eq });
  return { delete: del };
}

function createSelectIdBuilder(response: SingleResponse) {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

describe("InventoryService", () => {
  let inventoryService: InventoryService;
  let supabaseService: { getClient: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock }),
    };
    inventoryService = new InventoryService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("listProducts", () => {
    it("normaliza los campos de inventario y categoría", async () => {
      const rows = [
        {
          id: 1,
          nombre: "Camarón",
          descripcion: null,
          precio: "120.50",
          unidad: "kg",
          categoria_id: 2,
          categoria: { id: 2, nombre: "Mariscos" },
          inventario: [
            { id: 1, cantidad_disponible: "4.500", nivel_minimo: "2.000" },
          ],
        },
      ];

      fromMock.mockImplementationOnce(() =>
        createListProductsBuilder({ data: rows, error: null }),
      );

      const result = await inventoryService.listProducts();
      expect(result).toEqual({
        ok: true,
        products: [
          {
            id: 1,
            nombre: "Camarón",
            descripcion: null,
            precio: 120.5,
            unidad: "kg",
            categoriaId: 2,
            categoriaNombre: "Mariscos",
            inventario: {
              cantidadDisponible: 4.5,
              nivelMinimo: 2,
            },
          },
        ],
      });
    });

    it("propaga errores al consultar productos", async () => {
      fromMock.mockImplementationOnce(() =>
        createListProductsBuilder({
          data: null,
          error: new Error("db fail"),
        }),
      );

      const result = await inventoryService.listProducts();
      expect(result).toEqual({
        ok: false,
        message: "No se pudieron obtener los productos",
      });
    });
  });

  describe("listCategories", () => {
    it("devuelve las categorías disponibles", async () => {
      const rows = [
        { id: 1, nombre: "Pescados" },
        { id: 2, nombre: "Bebidas" },
      ];

      fromMock.mockImplementationOnce(() =>
        createListProductsBuilder({ data: rows, error: null }),
      );

      const result = await inventoryService.listCategories();
      expect(result).toEqual({
        ok: true,
        categories: rows,
      });
    });

    it("retorna error cuando supabase falla", async () => {
      fromMock.mockImplementationOnce(() =>
        createListProductsBuilder({
          data: null,
          error: new Error("down"),
        }),
      );

      const result = await inventoryService.listCategories();
      expect(result).toEqual({
        ok: false,
        message: "No se pudieron obtener las categorías",
      });
    });
  });

  describe("getProductById", () => {
    it("retorna el producto formateado", async () => {
      const row = {
        id: 10,
        nombre: "Pulpo",
        descripcion: "Fresco",
        precio: "99.99",
        unidad: "kg",
        categoria_id: null,
        categoria: null,
        inventario: [
          { id: 3, cantidad_disponible: "1.250", nivel_minimo: null },
        ],
      };

      fromMock.mockImplementationOnce(() =>
        createGetProductBuilder({ data: row, error: null }),
      );

      const result = await inventoryService.getProductById(10);
      expect(result).toEqual({
        ok: true,
        product: {
          id: 10,
          nombre: "Pulpo",
          descripcion: "Fresco",
          precio: 99.99,
          unidad: "kg",
          categoriaId: null,
          categoriaNombre: null,
          inventario: {
            cantidadDisponible: 1.25,
            nivelMinimo: null,
          },
        },
      });
    });

    it("regresa error cuando no existe", async () => {
      fromMock.mockImplementationOnce(() =>
        createGetProductBuilder({ data: null, error: new Error("missing") }),
      );

      const result = await inventoryService.getProductById(99);
      expect(result).toEqual({
        ok: false,
        message: "Producto no encontrado",
      });
    });
  });

  describe("createProduct", () => {
    it("crea el producto e inicializa inventario", async () => {
      const insertBuilder = createInsertProductBuilder({
        data: { id: 5 },
        error: null,
      });
      const inventoryBuilder = createInventoryInsertBuilder();

      fromMock
        .mockImplementationOnce(() => insertBuilder)
        .mockImplementationOnce(() => inventoryBuilder);

      const productSnapshot = {
        ok: true as const,
        product: {
          id: 5,
          nombre: "Nuevo",
          descripcion: "Producto",
          precio: 55.5,
          unidad: "pza",
          categoriaId: 3,
          categoriaNombre: "Categoria",
          inventario: { cantidadDisponible: 10, nivelMinimo: 2 },
        },
      };

      const getProductSpy = jest
        .spyOn(inventoryService, "getProductById")
        .mockResolvedValue(productSnapshot);

      const result = await inventoryService.createProduct({
        nombre: "  Nuevo ",
        descripcion: " Producto ",
        precio: 55.5,
        categoria_id: 3,
        unidad: "pza",
        cantidad_inicial: 10,
        nivel_minimo: 2,
      });

      expect(result).toEqual(productSnapshot);
      expect(insertBuilder.payloads[0]).toEqual({
        nombre: "Nuevo",
        descripcion: "Producto",
        precio: 55.5,
        categoria_id: 3,
        unidad: "pza",
      });
      expect(inventoryBuilder.payloads[0]).toEqual({
        producto_id: 5,
        cantidad_disponible: 10,
        nivel_minimo: 2,
      });

      getProductSpy.mockRestore();
    });

    it("hace rollback si falla al crear inventario", async () => {
      const insertBuilder = createInsertProductBuilder({
        data: { id: 7 },
        error: null,
      });
      const inventoryBuilder = createInventoryInsertBuilder(new Error("fail"));
      const deleteBuilder = createDeleteBuilder(null);

      fromMock
        .mockImplementationOnce(() => insertBuilder)
        .mockImplementationOnce(() => inventoryBuilder)
        .mockImplementationOnce(() => deleteBuilder);

      const result = await inventoryService.createProduct({
        nombre: "Test",
        precio: 10,
        cantidad_inicial: 1,
      });

      expect(result).toEqual({
        ok: false,
        message:
          "El producto se creó pero no se pudo inicializar el inventario",
      });

      expect(deleteBuilder.delete).toHaveBeenCalledTimes(1);
    });

    it("valida campos obligatorios", async () => {
      const result = await inventoryService.createProduct({
        nombre: " ",
      });
      expect(result).toEqual({
        ok: false,
        message: "El nombre es obligatorio",
      });
    });
  });

  describe("updateProduct", () => {
    it("actualiza datos y existencias", async () => {
      const updateBuilder = createUpdateProductBuilder();
      const upsertBuilder = createUpsertInventoryBuilder();

      fromMock
        .mockImplementationOnce(() => updateBuilder)
        .mockImplementationOnce(() => upsertBuilder);

      const snapshot = {
        ok: true as const,
        product: {
          id: 9,
          nombre: "Actualizado",
          descripcion: null,
          precio: 10,
          unidad: "pza",
          categoriaId: null,
          categoriaNombre: null,
          inventario: { cantidadDisponible: 5, nivelMinimo: null },
        },
      };

      const getProductSpy = jest
        .spyOn(inventoryService, "getProductById")
        .mockResolvedValue(snapshot);

      const result = await inventoryService.updateProduct(9, {
        nombre: " Actualizado ",
        cantidad_disponible: 5,
      });

      expect(result).toEqual(snapshot);
      expect(updateBuilder.payloads[0]).toEqual({ nombre: "Actualizado" });
      expect(upsertBuilder.payloads[0]).toEqual({
        producto_id: 9,
        cantidad_disponible: 5,
      });
      expect(upsertBuilder.options[0]).toEqual({ onConflict: "producto_id" });

      getProductSpy.mockRestore();
    });

    it("rechaza solicitudes sin cambios", async () => {
      const result = await inventoryService.updateProduct(1, {});
      expect(result).toEqual({
        ok: false,
        message: "No hay cambios para aplicar",
      });
    });
  });

  describe("deleteProduct", () => {
    it("elimina un producto existente", async () => {
      const selectBuilder = createSelectIdBuilder({
        data: { id: 3 },
        error: null,
      });
      const deleteBuilder = createDeleteBuilder(null);

      fromMock
        .mockImplementationOnce(() => selectBuilder)
        .mockImplementationOnce(() => deleteBuilder);

      const result = await inventoryService.deleteProduct(3);
      expect(result).toEqual({ ok: true });
      expect(deleteBuilder.delete).toHaveBeenCalledTimes(1);
    });

    it("avisa cuando no encuentra el registro", async () => {
      const selectBuilder = createSelectIdBuilder({
        data: null,
        error: null,
      });
      fromMock.mockImplementationOnce(() => selectBuilder);

      const result = await inventoryService.deleteProduct(99);
      expect(result).toEqual({
        ok: false,
        message: "Producto no encontrado",
      });
    });
  });
});
