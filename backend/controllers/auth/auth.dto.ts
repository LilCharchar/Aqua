export class LoginDto {
  correo: string;
  contraseña: string;
}

export class CreateUserDto {
  nombre!: string;
  correo!: string;
  contraseña!: string;
  rol_id?: number | null;
  activo?: boolean;
}
