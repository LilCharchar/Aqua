import { useState, useEffect} from "react";
import type { User } from "../../screens/types";
import {Table} from "./ui/table";

export function Usuarios(){
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("/api");
                if (!res.ok) throw new Error("Error al obtener los usuarios");
                const data:User[] = await res.json();
                setUsuarios(data);
                }catch (error) {
                    console.error(error);
                }finally{
                setLoading(false);
                }
        };

        fetchUsuarios();
    }, []);

    const columns = [
        { header: "Usuario", accessor: "nombre" },
        { header: "Correo", accessor: "correo" },
        { header: "Rol", accessor: "rol", render: (value: number) => value === 1 ? "Administrador" : value === 2 ? "Supervisor" : "Mesero" },
        { header: "Contraseña", accessor: "contrasena" },
        { header: "Estado", 
          accessor: "activo", 
          render: (value: boolean | undefined) => (
            <span
                className={`px-2 py-1 rounded-full text-xs ${
                    value ? "bg-green-700" : "bg-red-200"
                }`}
            >
                {value ? "Activo" : "Inactivo"}
            </span>
         ),
        },
        
    ];

    if (loading) return <div className="text-gray-400">Cargando usuarios...</div>;
    return(
        <div className="p-6">
            <h1 className="text-xl mb-4"> Usuarios</h1>
            <Table<User> columns={columns} data={usuarios}/>
        </div>
    );
}
    