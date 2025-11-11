import { useCallback, useState } from "react";
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
  const [createForm, setCreateForm] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    rol: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [usuariosActions, setUsuariosActions] = useState<{
    refresh: () => Promise<void>;
  } | null>(null);

  const handleUsuariosReady = useCallback((actions: { refresh: () => Promise<void> }) => {
    setUsuariosActions(actions);
  }, []);

  const resetCreateForm = () => {
    setCreateForm({
      nombre: "",
      correo: "",
      contraseña: "",
      rol: "",
    });
    setCreateError(null);
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const payload = {
      nombre: createForm.nombre.trim(),
      correo: createForm.correo.trim(),
      contraseña: createForm.contraseña,
      rol_id: createForm.rol ? Number(createForm.rol) : undefined,
    };

    if (!payload.nombre || !payload.correo || !payload.contraseña) {
      setCreateError("Todos los campos son obligatorios");
      return;
    }

    setCreateLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res
        .clone()
        .json()
        .catch(() => null);

      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? "No se pudo crear el usuario");
      }

      await usuariosActions?.refresh();
      resetCreateForm();
      setIsModalOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear el usuario";
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseModal = () => {
    resetCreateForm();
    setIsModalOpen(false);
  };

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
        <Usuarios onReady={handleUsuariosReady}/>
        
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
        onClose={handleCloseModal} 
        title="Crear Usuario">
        <form className="flex flex-col gap-4 justify-center items-center" onSubmit={handleCreateSubmit}>
          <Input 
            type="text" 
            placeholder="Nombre"
            value={createForm.nombre}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            required
            className="p-2 border border-gray-300 rounded" />
          <Input 
          type="email" 
          placeholder="Correo electrónico"
          value={createForm.correo}
          onChange={(e) =>
            setCreateForm((prev) => ({ ...prev, correo: e.target.value }))
          }
          required
          className="p-2 border border-gray-300 rounded" />
          <Input 
          type="password" 
          placeholder="Contraseña"
          value={createForm.contraseña}
          onChange={(e) =>
            setCreateForm((prev) => ({ ...prev, contraseña: e.target.value }))
          }
          required
          className="p-2 border border-gray-300 rounded" />
          <select
            className="p-3 border border-gray-300 rounded-md text-xs bg-[var(--options)] text-[var(--text-primary)]"
            value={createForm.rol}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, rol: e.target.value }))
            }
          >
            <option value="">Selecciona un rol</option>
            <option value="1">Administrador</option>
            <option value="2">Supervisor</option>
            <option value="3">Mesero</option>
          </select>
          {createError && (
            <p className="text-sm text-[var(--warning)]">{createError}</p>
          )}
          <div className="flex gap-5 ">
            <Button type="submit" className="shadow-xl" disabled={createLoading}>
              {createLoading ? "Creando..." : "Crear"}
            </Button>
            <Button type="button" onClick={handleCloseModal}>
              Volver
            </Button>

          </div>
          
        </form>
      </Modal>

    </div>
  );
}
