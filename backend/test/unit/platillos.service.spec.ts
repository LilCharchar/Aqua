import { PlatillosService } from "../../controllers/platillos/platillos.service";
import { SupabaseService } from "../../src/supabase.service";

type ListResponse = { data: unknown[] | null; error: Error | null };
type SingleResponse = {
  data: Record<string, unknown> | null;
  error: Error | null;
};

function createListBuilder(response: ListResponse) {
  const order = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ order });
  return { select };
}

function createGetBuilder(response: SingleResponse) {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

function createInsertPlatilloBuilder(response: SingleResponse) {
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

function createIngredientInsertBuilder(error: Error | null = null) {
  const payloads: Record<string, unknown>[] = [];
  const insert = jest
    .fn()
    .mockImplementation((rows: Record<string, unknown>[]) => {
      payloads.push(rows[0]);
      return Promise.resolve({ error });
    });
  return { insert, payloads };
}

function createUpdateBuilder(error: Error | null = null) {
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

describe("PlatillosService", () => {
  let platillosService: PlatillosService;
  let supabaseService: { getClient: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock }),
    };
    platillosService = new PlatillosService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("listPlatillos", () => {
    it("normaliza platillos e ingredientes", async () => {
      const rows = [
        {
          id: 1,
          nombre: "Ceviche",
          descripcion: null,
          precio: "150.50",
          disponible: true,
          supervisor_id: 3,
          creado_en: "2024-01-01",
          supervisor: { id: 3, nombre: "Ana" },
          ingredientes: [
            {
              id: 10,
              cantidad: "0.500",
              producto_id: 4,
              producto: { id: 4, nombre: "Camaron", unidad: "kg" },
            },
          ],
        },
      ];

      fromMock.mockImplementationOnce(() =>
        createListBuilder({ data: rows, error: null }),
      );

      const result = await platillosService.listPlatillos();
      expect(result).toEqual({
        ok: true,
        platillos: [
          {
            id: 1,
            nombre: "Ceviche",
            descripcion: null,
            precio: 150.5,
            disponible: true,
            supervisorId: 3,
            supervisorNombre: "Ana",
            creadoEn: "2024-01-01",
            ingredientes: [
              {
                id: 10,
                productoId: 4,
                productoNombre: "Camaron",
                productoUnidad: "kg",
                cantidad: 0.5,
              },
            ],
          },
        ],
      });
    });

    it("propaga el error de supabase", async () => {
      fromMock.mockImplementationOnce(() =>
        createListBuilder({ data: null, error: new Error("fail") }),
      );

      const result = await platillosService.listPlatillos();
      expect(result).toEqual({
        ok: false,
        message: "No se pudieron obtener los platillos",
      });
    });
  });

  describe("createPlatillo", () => {
    it("crea el platillo y sus ingredientes", async () => {
      const insertBuilder = createInsertPlatilloBuilder({
        data: { id: 9 },
        error: null,
      });
      const ingredientBuilder = createIngredientInsertBuilder();

      fromMock
        .mockImplementationOnce(() => insertBuilder)
        .mockImplementationOnce(() => ingredientBuilder);

      const snapshot = {
        ok: true as const,
        platillo: {
          id: 9,
          nombre: "Ceviche",
          descripcion: "Fresco",
          precio: 180,
          disponible: true,
          supervisorId: 2,
          supervisorNombre: "Lupita",
          creadoEn: "2024-02-01",
          ingredientes: [],
        },
      };

      const getSpy = jest
        .spyOn(platillosService, "getPlatilloById")
        .mockResolvedValue(snapshot);

      const result = await platillosService.createPlatillo({
        nombre: "  Ceviche ",
        descripcion: " Fresco ",
        precio: 180,
        supervisor_id: 2,
        disponible: true,
        ingredientes: [{ producto_id: 4, cantidad: 0.5 }],
      });

      expect(result).toEqual(snapshot);
      expect(insertBuilder.payloads[0]).toEqual({
        nombre: "Ceviche",
        descripcion: "Fresco",
        precio: 180,
        disponible: true,
        supervisor_id: 2,
      });
      expect(ingredientBuilder.payloads[0]).toEqual({
        platillo_id: 9,
        producto_id: 4,
        cantidad: 0.5,
      });

      getSpy.mockRestore();
    });

    it("revierte cuando falla al insertar ingredientes", async () => {
      const insertBuilder = createInsertPlatilloBuilder({
        data: { id: 11 },
        error: null,
      });
      const ingredientBuilder = createIngredientInsertBuilder(
        new Error("fail"),
      );
      const deleteBuilder = createDeleteBuilder(null);

      fromMock
        .mockImplementationOnce(() => insertBuilder)
        .mockImplementationOnce(() => ingredientBuilder)
        .mockImplementationOnce(() => deleteBuilder);

      const result = await platillosService.createPlatillo({
        nombre: "Tostada",
        precio: 120,
        ingredientes: [{ producto_id: 1, cantidad: 1 }],
      });

      expect(result).toEqual({
        ok: false,
        message:
          "El platillo se creó pero no se pudieron guardar los ingredientes",
      });
      expect(deleteBuilder.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("updatePlatillo", () => {
    it("actualiza el registro y sustituye ingredientes", async () => {
      const updateBuilder = createUpdateBuilder();
      const deleteBuilder = createDeleteBuilder(null);
      const ingredientBuilder = createIngredientInsertBuilder();

      fromMock
        .mockImplementationOnce(() => updateBuilder)
        .mockImplementationOnce(() => deleteBuilder)
        .mockImplementationOnce(() => ingredientBuilder);

      const snapshot = {
        ok: true as const,
        platillo: {
          id: 5,
          nombre: "Nuevo",
          descripcion: "Desc",
          precio: 99,
          disponible: false,
          supervisorId: null,
          supervisorNombre: null,
          creadoEn: null,
          ingredientes: [],
        },
      };

      const getSpy = jest
        .spyOn(platillosService, "getPlatilloById")
        .mockResolvedValue(snapshot);

      const result = await platillosService.updatePlatillo(5, {
        nombre: "  Nuevo ",
        descripcion: " Desc ",
        precio: 99,
        disponible: false,
        supervisor_id: null,
        ingredientes: [{ producto_id: 8, cantidad: 1.25 }],
      });

      expect(result).toEqual(snapshot);
      expect(updateBuilder.payloads[0]).toEqual({
        nombre: "Nuevo",
        descripcion: "Desc",
        precio: 99,
        disponible: false,
        supervisor_id: null,
      });
      expect(deleteBuilder.delete).toHaveBeenCalledTimes(1);
      expect(ingredientBuilder.payloads[0]).toEqual({
        platillo_id: 5,
        producto_id: 8,
        cantidad: 1.25,
      });

      getSpy.mockRestore();
    });

    it("rechaza solicitudes sin cambios", async () => {
      const result = await platillosService.updatePlatillo(1, {});
      expect(result).toEqual({
        ok: false,
        message: "No hay cambios para aplicar",
      });
    });
  });

  describe("deletePlatillo", () => {
    it("elimina un platillo existente", async () => {
      const selectBuilder = createSelectIdBuilder({
        data: { id: 7 },
        error: null,
      });
      const deleteBuilder = createDeleteBuilder(null);

      fromMock
        .mockImplementationOnce(() => selectBuilder)
        .mockImplementationOnce(() => deleteBuilder);

      const result = await platillosService.deletePlatillo(7);
      expect(result).toEqual({ ok: true });
      expect(deleteBuilder.delete).toHaveBeenCalledTimes(1);
    });

    it("avisa cuando no encuentra el registro", async () => {
      const selectBuilder = createSelectIdBuilder({
        data: null,
        error: null,
      });

      fromMock.mockImplementationOnce(() => selectBuilder);

      const result = await platillosService.deletePlatillo(99);
      expect(result).toEqual({
        ok: false,
        message: "Platillo no encontrado",
      });
    });
  });
});
