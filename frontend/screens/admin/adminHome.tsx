import type { User } from "../types";
import Separator from "../../src/components/separator";
import logo from "../../assets/logo.png";
import {Usuarios} from "../../src/components/getuser";
type AdminHomeProps = {
  user: User;
  logout: () => void;
};







export function AdminHome({ user, logout }: AdminHomeProps) {
  return (
    <div className="h-screen w-full flex flex-col bg-[var(--background)] manrope-bold text-[var(--text-primary)]">
      <div className="m-14 ml-20">
        <div className=" flex items-center gap-4 mb-2">
          <img src={logo} alt="Logo"/>
            <h1 className="text-2xl">{user.nombre}</h1>
          <h2 className="text-s ml-auto">Administrador</h2> 
        </div>
        <Separator/>
      </div>
      <div className="flex-1 overflow-y-auto px-20">
        <Usuarios/>

      </div>



      <button onClick={logout}>Cerrar sesión</button>
      
    </div>
  );
}
