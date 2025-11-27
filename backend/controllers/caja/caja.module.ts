import { Module } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import { CajaController } from "./caja.controller";
import { CajaService } from "./caja.service";

@Module({
    controllers: [CajaController],
    providers: [CajaService, SupabaseService],
})
export class CajaModule { }
