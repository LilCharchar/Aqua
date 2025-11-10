import { useState } from "react";
import type { User } from "../types";
import Separator from "../../src/components/separator";
import logo from "../../assets/logo.png";
import {Usuarios} from "../../src/components/getuser";
import Modal from "../../src/components/ui/modal";
import Button from "../../src/components/ui/button";
import Input from "../../src/components/ui/input";

type AdminHomeProps = {
  user: User;
  logout: () => void;
};


export function AdminHome({ user, logout }: AdminHomeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        
      <div className="flex justify-center m-10">
        <Button onClick={() => setIsModalOpen(true)}>
          Crear Usuario
        </Button>
      </div>


      </div>

      <div className="flex justify-end items-center gap-4 mb-5 mr-14">
        <button className="hover:scale-105 hover:cursor-pointer tansition-transform duration-200" onClick={logout}>Cerrar sesión</button>
      </div>
      
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Usuario">
        <div className="flex flex-col gap-4 justify-center items-center">
          <Input 
            type="text" 
            placeholder="Nombre"
            className="p-2 border border-gray-300 rounded" />
          <Input 
          type="email" 
          placeholder="Correo electrónico"
          className="p-2 border border-gray-300 rounded" />
          <Input 
          type="password" 
          placeholder="Contraseña"
          className="p-2 border border-gray-300 rounded" />
          <select className="p-3 border border-gray-300 rounded-md text-xs bg-[var(--options)] text-[var(--text-primary)]">
            <option value="0">Selecciona un rol</option>
            <option value="1">Administrador</option>
            <option value="2">Supervisor</option>
            <option value="3">Mesero</option>
          </select>
          <div className="flex gap-5 ">
            <Button className="shadow-xl" onClick={() => {/* Lógica para crear usuario */}}>Crear</Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Volver
            </Button>

          </div>
          
        </div>
      </Modal>

    </div>
  );
}
