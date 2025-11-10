import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase.service";
import { LoginDto } from "./auth.dto";

interface UsuarioPOS {
  id: string;
  correo: string;
  contraseña: string;
  nombre: string | null;
  rol_id: string | null;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post("login")
  async login(@Body() body: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `
        id,
        correo,
        contraseña,
        nombre,
        rol_id`,
      )
      .eq("correo", body.correo)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { ok: false, message: "Usuario no encontrado" };
    }

    const user = data[0] as unknown as UsuarioPOS;

    if (user.contraseña !== body.contraseña) {
      return { ok: false, message: "Credenciales inválidas" };
    }

    return {
      ok: true,
      userId: user.id,
      correo: user.correo,
      nombre: user.nombre,
      rol: user.rol_id,
    };
  }
}
