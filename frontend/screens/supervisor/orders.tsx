import type { User } from "../types";

type SupervisorOrdersProps = {
  user: User;
  logout: () => void;
};

export function Orders({ user, logout }: SupervisorOrdersProps) {
  return (
    <div>
      
      <h1>Mesero: {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
      <h1>Menu de Ordenes</h1>
    </div>
  );
}
export default Orders;