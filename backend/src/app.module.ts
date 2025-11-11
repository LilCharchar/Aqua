import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthModule } from "controllers/auth/auth.module";
import { InventoryModule } from "controllers/inventory/inventory.module";

@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule {}
