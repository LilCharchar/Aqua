import type { User } from "../types";
import { toast } from "sonner";
import Button from "../../src/components/ui/button"

type MeseroHomeProps = {
  user: User;
  logout: () => void;
};

export function MeseroHome({ user, logout }: MeseroHomeProps) {
  return (
    <div >
      
      <h1>Mesero: {user.nombre}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
