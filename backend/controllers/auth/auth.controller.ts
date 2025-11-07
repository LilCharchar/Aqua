import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../../src/supabase.service";
import { LoginDto, CreateUserDto } from "./auth.dto";

interface UsuarioPOS {
  id: string;
  correo: string;
  contraseña: string;
  nombre: string | null;
  rol_id: string | null;
  activo: boolean;
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

  @Post("register")
  async register(@Body() dto: CreateUserDto) {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: findErr } = await supabase
      .from("usuarios")
      .select("id")
      .eq("correo", dto.correo)
      .maybeSingle();

    if (findErr) return { ok: false, message: "Error verificando correo" };
    if (existing) return { ok: false, message: "Correo ya registrado" };

    const activo = dto.activo ?? true;

    const { data, error: insErr } = await supabase
      .from("usuarios")
      .insert([
        {
          nombre: dto.nombre,
          correo: dto.correo,
          contraseña: dto.contraseña,
          rol_id: dto.rol_id ?? null,
          activo,
        },
      ])
      .select("id, nombre, correo, rol_id, activo")
      .single();

    const user = data as unknown as UsuarioPOS;

    if (insErr || !user)
      return { ok: false, message: "No se pudo crear el usuario" };

    return {
      ok: true,
      userId: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol_id,
      activo: user.activo,
    };
  }
}
