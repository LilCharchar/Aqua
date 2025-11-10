import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthModule } from "controllers/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule {}
