import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthModule } from "controllers/auth/auth.module";
import { InventoryModule } from "controllers/inventory/inventory.module";
import { PlatillosModule } from "controllers/platillos/platillos.module";
import { OrdersModule } from "controllers/orders/orders.module";
import { MesasModule } from "controllers/mesas/mesas.module";
import { CajaModule } from "controllers/caja/caja.module";

@Module({
  imports: [AuthModule, InventoryModule, PlatillosModule, OrdersModule, MesasModule, CajaModule],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule { }
