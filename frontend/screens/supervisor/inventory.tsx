import type { User } from "../types";

type SupervisorInventaryProps = {
  user: User;
  logout: () => void;
};

export function Inventary({ user, logout }: SupervisorInventaryProps) {
  return (
    <div>
      
      <h1>Mesero: {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
      <h1>Menu de inventario</h1>
    </div>
  );
}
export default Inventary;