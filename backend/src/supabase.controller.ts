import { Controller, Get } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

@Controller("supabase")
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get("health")
  async check() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .limit(1);

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      sample: data,
    };
  }
}
