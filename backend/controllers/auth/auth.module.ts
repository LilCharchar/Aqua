// auth.module.ts
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "../../src/supabase.service";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
})
export class AuthModule {}
