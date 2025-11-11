import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { SupabaseService } from "../../src/supabase.service";

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, SupabaseService],
})
export class InventoryModule {}
