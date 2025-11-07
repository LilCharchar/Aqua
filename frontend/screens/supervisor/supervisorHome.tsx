import type { User } from "../types";

type SupervisorHomeProps = {
  user: User;
  logout: () => void;
};

export function SupervisorHome({ user, logout }: SupervisorHomeProps) {
  return (
    <div>
      <h1>Bienvenido supervisor {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
