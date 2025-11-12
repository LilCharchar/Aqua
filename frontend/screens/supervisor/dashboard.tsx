import type { User } from "../types";

type SupervisorDashboardProps = {
  user: User;
  logout: () => void;
};

export function Dashboard({ user, logout }: SupervisorDashboardProps) {
  return (
    <div>
      
      <h1>Mesero: {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
      <h1>Menu de dashboard</h1>
    </div>
  );
}
export default Dashboard;