import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { SupabaseService } from "../../src/supabase.service";
import { CreateUserDto, LoginDto } from "./auth.dto";

interface UsuarioPOS {
  id: string;
  correo: string;
  contraseña: string;
  nombre: string | null;
  rol_id: number | null;
  activo: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private isHashedPassword(password: string | null): boolean {
    return Boolean(password?.startsWith("$2"));
  }

  async login(dto: LoginDto) {
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
      .eq("correo", dto.correo)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { ok: false, message: "Usuario no encontrado" };
    }

    const user = data[0] as unknown as UsuarioPOS;

    const storedPassword = user.contraseña ?? "";
    const shouldUseHash = this.isHashedPassword(storedPassword);
    const isValid = shouldUseHash
      ? await bcrypt.compare(dto.contraseña, storedPassword)
      : storedPassword === dto.contraseña;

    if (!isValid) {
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

  async register(dto: CreateUserDto) {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: findErr } = await supabase
      .from("usuarios")
      .select("id")
      .eq("correo", dto.correo)
      .maybeSingle();

    if (findErr) return { ok: false, message: "Error verificando correo" };
    if (existing) return { ok: false, message: "Correo ya registrado" };

    const activo = dto.activo ?? true;
    const hashedPassword = await bcrypt.hash(dto.contraseña, 10);

    const { data, error: insErr } = await supabase
      .from("usuarios")
      .insert([
        {
          nombre: dto.nombre,
          correo: dto.correo,
          contraseña: hashedPassword,
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
