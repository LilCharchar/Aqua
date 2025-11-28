import { Module } from "@nestjs/common";
import { MesasController } from "./mesas.controller";
import { MesasService } from "./mesas.service";
import { SupabaseService } from "../../src/supabase.service";

@Module({
    controllers: [MesasController],
    providers: [MesasService, SupabaseService],
    exports: [MesasService],
})
export class MesasModule { }
