import type { User } from "../types";

type SupervisorDishesProps = {
  user: User;
  logout: () => void;
};

export function Dishes({ user, logout }: SupervisorDishesProps) {
  return (
    <div>
      
      <h1>Mesero: {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
      <h1>Menu de platos</h1>
    </div>
  );
}
export default Dishes;