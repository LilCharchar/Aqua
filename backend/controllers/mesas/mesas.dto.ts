export interface MesaResponse {
    id: number;
    numero: string | null;
    activa: boolean;
}

export type MesasListResponse =
    | { ok: true; mesas: MesaResponse[] }
    | { ok: false; message: string };
