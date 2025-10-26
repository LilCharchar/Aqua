import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SupabaseService } from "./supabase.service";
import { SupabaseController } from "./supabase.controller";

@Module({
  imports: [],
  controllers: [AppController, SupabaseController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
