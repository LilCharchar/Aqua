import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import { MesaResponse, MesasListResponse } from "./mesas.dto";

interface MesaRow {
    id: number;
    numero: string | null;
    activa: boolean;
}

@Injectable()
export class MesasService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async listMesas(includeInactive = false): Promise<MesasListResponse> {
        const supabase = this.supabaseService.getClient();

        let query = supabase
            .from("mesas")
            .select("id, numero, activa")
            .order("numero", { ascending: true });

        // Por defecto, solo mesas activas
        if (!includeInactive) {
            query = query.eq("activa", true);
        }

        const { data, error } = await query;

        if (error) {
            return { ok: false, message: "No se pudieron obtener las mesas" };
        }

        const records = (data ?? []) as unknown as MesaRow[];
        const mesas: MesaResponse[] = records.map((row) => ({
            id: row.id,
            numero: row.numero,
            activa: row.activa,
        }));

        return { ok: true, mesas };
    }
}
