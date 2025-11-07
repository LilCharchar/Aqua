import type { User } from "../types";

type AdminHomeProps = {
  user: User;
  logout: () => void;
};

export function AdminHome({ user, logout }: AdminHomeProps) {
  return (
    <div>
      <h1>Bienvenido {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
