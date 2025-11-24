import { MesasService } from "../../controllers/mesas/mesas.service";
import { SupabaseService } from "../../src/supabase.service";

type ListResponse = { data: unknown[] | null; error: Error | null };

function createMesasBuilderWithFilter(response: ListResponse) {
    const thenable = {
        then: (resolve: any) => resolve(response),
    };
    const eq = jest.fn().mockReturnValue(thenable);
    const order = jest.fn().mockReturnValue({ eq });
    const select = jest.fn().mockReturnValue({ order });
    return { select, order, eq };
}

function createMesasBuilderWithoutFilter(response: ListResponse) {
    const thenable = {
        then: (resolve: any) => resolve(response),
    };
    const order = jest.fn().mockReturnValue(thenable);
    const select = jest.fn().mockReturnValue({ order });
    return { select, order };
}

describe("MesasService", () => {
    let mesasService: MesasService;
    let supabaseService: { getClient: jest.Mock };
    let fromMock: jest.Mock;

    beforeEach(() => {
        fromMock = jest.fn();
        supabaseService = {
            getClient: jest.fn().mockReturnValue({ from: fromMock }),
        };
        mesasService = new MesasService(
            supabaseService as unknown as SupabaseService,
        );
    });

    describe("listMesas", () => {
        it("retorna solo mesas activas por defecto", async () => {
            const rows = [
                { id: 1, numero: "A1", activa: true },
                { id: 2, numero: "A2", activa: true },
            ];

            const builder = createMesasBuilderWithFilter({ data: rows, error: null });
            fromMock.mockImplementationOnce(() => builder);

            const result = await mesasService.listMesas();

            expect(result).toEqual({
                ok: true,
                mesas: [
                    { id: 1, numero: "A1", activa: true },
                    { id: 2, numero: "A2", activa: true },
                ],
            });
            expect(builder.select).toHaveBeenCalledWith("id, numero, activa");
            expect(builder.order).toHaveBeenCalledWith("numero", { ascending: true });
            expect(builder.eq).toHaveBeenCalledWith("activa", true);
        });

        it("retorna todas las mesas cuando includeInactive es true", async () => {
            const rows = [
                { id: 1, numero: "A1", activa: true },
                { id: 2, numero: "A2", activa: false },
                { id: 3, numero: "A3", activa: true },
            ];

            const builder = createMesasBuilderWithoutFilter({ data: rows, error: null });
            fromMock.mockImplementationOnce(() => builder);

            const result = await mesasService.listMesas(true);

            expect(result).toEqual({
                ok: true,
                mesas: [
                    { id: 1, numero: "A1", activa: true },
                    { id: 2, numero: "A2", activa: false },
                    { id: 3, numero: "A3", activa: true },
                ],
            });
            expect(builder.select).toHaveBeenCalledWith("id, numero, activa");
            expect(builder.order).toHaveBeenCalledWith("numero", { ascending: true });
        });

        it("maneja error de BD correctamente", async () => {
            const builder = createMesasBuilderWithFilter({
                data: null,
                error: new Error("DB Error")
            });
            fromMock.mockImplementationOnce(() => builder);

            const result = await mesasService.listMesas();

            expect(result).toEqual({
                ok: false,
                message: "No se pudieron obtener las mesas",
            });
        });
    });
});
