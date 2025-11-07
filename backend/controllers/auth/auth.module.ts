// auth.module.ts
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "../../src/supabase.service";

@Module({ controllers: [AuthController], providers: [SupabaseService] })
export class AuthModule {}
