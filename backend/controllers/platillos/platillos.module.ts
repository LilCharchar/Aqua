import { Module } from "@nestjs/common";
import { PlatillosController } from "./platillos.controller";
import { PlatillosService } from "./platillos.service";
import { SupabaseService } from "../../src/supabase.service";

@Module({
  controllers: [PlatillosController],
  providers: [PlatillosService, SupabaseService],
})
export class PlatillosModule {}
