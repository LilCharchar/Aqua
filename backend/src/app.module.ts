import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthModule } from "controllers/auth/auth.module";
import { InventoryModule } from "controllers/inventory/inventory.module";
import { PlatillosModule } from "controllers/platillos/platillos.module";
import { OrdersModule } from "controllers/orders/orders.module";

@Module({
  imports: [AuthModule, InventoryModule, PlatillosModule, OrdersModule],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule {}
