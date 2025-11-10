import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthController } from "./auth/auth.controller";

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [SupabaseService],
})
export class AppModule {}
