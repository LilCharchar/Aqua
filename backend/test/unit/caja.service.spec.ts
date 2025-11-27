import { CreateTransaccionDto } from "../../controllers/caja/caja.dto";
import { CajaService } from "../../controllers/caja/caja.service";
import { SupabaseService } from "../../src/supabase.service";

type BuilderResult<T> = { data: T; error: unknown };

const createMaybeSingleBuilder = <T>(
  result: BuilderResult<T>,
): {
  select: jest.Mock;
  is: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
} => {
  const builder = {
    select: jest.fn(),
    is: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };

  builder.select.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);

  return builder;
};

const createSelectListBuilder = <T>(
  result: BuilderResult<T>,
): {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
} => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn().mockResolvedValue(result),
  };

  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);

  return builder;
};

describe("CajaService", () => {
  let cajaService: CajaService;
  let supabaseService: { getClient: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock }),
    };
    cajaService = new CajaService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("openCaja", () => {
    it("debería abrir una nueva caja exitosamente", async () => {
      const dto = {
        supervisor_id: "uuid-supervisor-123",
        monto_inicial: 500,
      };

      // Mock para validar que no hay caja abierta
      const checkOpenBuilder = createMaybeSingleBuilder<{ id: number } | null>({
        data: null,
        error: null,
      });

      // Mock para insertar nueva caja
      const insertBuilder = {
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            supervisor_id: dto.supervisor_id,
            monto_inicial: dto.monto_inicial,
            monto_final: null,
            diferencia: null,
            abierto_en: "2025-01-01T10:00:00Z",
            cerrado_en: null,
            usuario: { id: dto.supervisor_id, nombre: "Test Supervisor" },
          },
          error: null,
        }),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
      };
      insertBuilder.insert.mockReturnValue(insertBuilder);
      insertBuilder.select.mockReturnValue(insertBuilder);

      fromMock
        .mockImplementationOnce(() => checkOpenBuilder)
        .mockImplementationOnce(() => insertBuilder);

      const result = await cajaService.openCaja(dto);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caja.id).toBe(1);
        expect(result.caja.montoInicial).toBe(500);
        expect(result.caja.saldoActual).toBe(500);
        expect(result.caja.cerradoEn).toBeNull();
      }
    });

    it("debería fallar si ya hay una caja abierta", async () => {
      const dto = {
        supervisor_id: "uuid-supervisor-123",
        monto_inicial: 500,
      };

      const checkOpenBuilder = createMaybeSingleBuilder<{ id: number } | null>({
        data: { id: 1 },
        error: null,
      });

      fromMock.mockImplementationOnce(() => checkOpenBuilder);

      const result = await cajaService.openCaja(dto);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("Ya existe una caja abierta");
      }
    });

    it("debería rechazar monto inicial negativo", async () => {
      const dto = {
        supervisor_id: "uuid-supervisor-123",
        monto_inicial: -100,
      };

      const checkOpenBuilder = createMaybeSingleBuilder<{ id: number } | null>({
        data: null,
        error: null,
      });

      fromMock.mockImplementationOnce(() => checkOpenBuilder);

      const result = await cajaService.openCaja(dto);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("Monto inicial inválido");
      }
    });
  });

  describe("getCurrentCaja", () => {
    it("debería obtener la caja actualmente abierta", async () => {
      const cajaRow = {
        id: 1,
        supervisor_id: "uuid-123",
        monto_inicial: 500,
        monto_final: null,
        diferencia: null,
        abierto_en: "2025-01-01T10:00:00Z",
        cerrado_en: null,
        usuario: { id: "uuid-123", nombre: "Test Supervisor" },
      };

      const getCajaBuilder = createMaybeSingleBuilder<typeof cajaRow>({
        data: cajaRow,
        error: null,
      });
      const transactionsBuilder = createSelectListBuilder({
        data: [
          {
            id: 1,
            tipo: "Ingreso",
            monto: 500,
            descripcion: "Apertura",
            creado_en: "2025-01-01T10:05:00Z",
          },
        ],
        error: null,
      });

      fromMock
        .mockImplementationOnce(() => getCajaBuilder)
        .mockImplementationOnce(() => transactionsBuilder);
      const result = await cajaService.getCurrentCaja();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caja.id).toBe(1);
        expect(result.caja.cerradoEn).toBeNull();
      }
    });

    it("debería retornar error si no hay caja abierta", async () => {
      const builder = createMaybeSingleBuilder<null>({
        data: null,
        error: null,
      });

      fromMock.mockImplementationOnce(() => builder);

      const result = await cajaService.getCurrentCaja();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("No hay caja abierta");
      }
    });
  });

  describe("addTransaction", () => {
    it("debería agregar un ingreso a la caja abierta", async () => {
      const cajaId = 1;
      const dto = {
        tipo: "Ingreso" as const,
        monto: 150,
        descripcion: "Venta de producto",
      };

      // Mock para validar caja existe y está abierta
      const checkCajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          cerrado_en: null,
        },
        error: null,
      });

      // Mock para insertar transacción
      const insertBuilder = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      // Mock para getCajaById final
      const finalCajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          monto_inicial: 500,
          monto_final: null,
          diferencia: null,
          abierto_en: "2025-01-01T10:00:00Z",
          cerrado_en: null,
          supervisor_id: "uuid-123",
          usuario: { id: "uuid-123", nombre: "Test" },
        },
        error: null,
      });

      const transactionsBuilder = createSelectListBuilder({
        data: [
          {
            id: 1,
            tipo: "Ingreso",
            monto: 150,
            descripcion: "Venta de producto",
            creado_en: "2025-01-01T11:00:00Z",
          },
        ],
        error: null,
      });

      fromMock
        .mockImplementationOnce(() => checkCajaBuilder)
        .mockImplementationOnce(() => insertBuilder)
        .mockImplementationOnce(() => finalCajaBuilder)
        .mockImplementationOnce(() => transactionsBuilder);

      const result = await cajaService.addTransaction(cajaId, dto);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caja.totalIngresos).toBe(150);
      }
    });

    it("debería rechazar transacción en caja cerrada", async () => {
      const cajaId = 1;
      const dto = {
        tipo: "Ingreso" as const,
        monto: 100,
        descripcion: "Test",
      };

      const checkCajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          cerrado_en: "2025-01-01T18:00:00Z",
        },
        error: null,
      });

      fromMock.mockImplementationOnce(() => checkCajaBuilder);

      const result = await cajaService.addTransaction(cajaId, dto);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("caja cerrada");
      }
    });

    it("debería rechazar tipo de transacción inválido", async () => {
      const cajaId = 1;
      const dto = {
        tipo: "Invalido",
        monto: 100,
        descripcion: "Test",
      };

      const checkCajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          cerrado_en: null,
        },
        error: null,
      });

      fromMock.mockImplementationOnce(() => checkCajaBuilder);

      const result = await cajaService.addTransaction(
        cajaId,
        dto as unknown as CreateTransaccionDto,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("Tipo de transacción inválido");
      }
    });

    it("debería rechazar monto inválido", async () => {
      const cajaId = 1;
      const dto = {
        tipo: "Ingreso" as const,
        monto: -50,
        descripcion: "Test",
      };

      const checkCajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          cerrado_en: null,
        },
        error: null,
      });

      fromMock.mockImplementationOnce(() => checkCajaBuilder);

      const result = await cajaService.addTransaction(cajaId, dto);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("Monto inválido");
      }
    });
  });

  describe("getCajaById", () => {
    it("debería obtener una caja específica por ID", async () => {
      const cajaId = 1;

      const cajaBuilder = createMaybeSingleBuilder({
        data: {
          id: cajaId,
          monto_inicial: 500,
          monto_final: 1200,
          diferencia: 0,
          abierto_en: "2025-01-01T10:00:00Z",
          cerrado_en: "2025-01-01T18:00:00Z",
          supervisor_id: "uuid-123",
          usuario: { id: "uuid-123", nombre: "Test Supervisor" },
        },
        error: null,
      });

      const transactionsBuilder = createSelectListBuilder({
        data: [],
        error: null,
      });

      fromMock
        .mockImplementationOnce(() => cajaBuilder)
        .mockImplementationOnce(() => transactionsBuilder);

      const result = await cajaService.getCajaById(cajaId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caja.id).toBe(cajaId);
      }
    });

    it("debería retornar error si la caja no existe", async () => {
      const builder = createMaybeSingleBuilder<null>({
        data: null,
        error: null,
      });

      fromMock.mockImplementationOnce(() => builder);

      const result = await cajaService.getCajaById(999);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("no encontrada");
      }
    });
  });
});
