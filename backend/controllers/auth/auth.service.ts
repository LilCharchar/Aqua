import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { SupabaseService } from "../../src/supabase.service";
import { CreateUserDto, LoginDto, UpdateUserDto } from "./auth.dto";

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

  private buildUserResponse(user: UsuarioPOS) {
    return {
      userId: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol_id,
      activo: user.activo,
    };
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

    return { ok: true, ...this.buildUserResponse(user) };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const supabase = this.supabaseService.getClient();

    const payload: Partial<UsuarioPOS> = {};
    if (dto.nombre !== undefined) payload.nombre = dto.nombre;
    if (dto.correo !== undefined) payload.correo = dto.correo;
    if (dto.rol_id !== undefined) payload.rol_id = dto.rol_id ?? null;
    if (dto.activo !== undefined) payload.activo = dto.activo;
    if (dto.contraseña) {
      payload.contraseña = await bcrypt.hash(dto.contraseña, 10);
    }

    if (Object.keys(payload).length === 0) {
      return { ok: false, message: "No hay cambios para aplicar" };
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update(payload)
      .eq("id", id)
      .select("id, nombre, correo, rol_id, activo")
      .single();

    if (error || !data)
      return { ok: false, message: "No se pudo actualizar el usuario" };

    const user = data as unknown as UsuarioPOS;

    return { ok: true, ...this.buildUserResponse(user) };
  }

  private async setUserActiveState(id: string, activo: boolean) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("usuarios")
      .update({ activo })
      .eq("id", id)
      .select("id, nombre, correo, rol_id, activo")
      .single();

    if (error || !data)
      return { ok: false, message: "No se pudo actualizar el estado" };

    const user = data as unknown as UsuarioPOS;
    return { ok: true, ...this.buildUserResponse(user) };
  }

  async deactivateUser(id: string) {
    return this.setUserActiveState(id, false);
  }

  async restoreUser(id: string) {
    return this.setUserActiveState(id, true);
  }
}
