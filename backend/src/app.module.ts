import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthModule } from "controllers/auth/auth.module";
import { InventoryModule } from "controllers/inventory/inventory.module";
import { PlatillosModule } from "controllers/platillo/platillos.module";

@Module({
  imports: [AuthModule, InventoryModule, PlatillosModule],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule {}
