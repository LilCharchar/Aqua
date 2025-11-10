import { useEffect, useState } from "react";
import { Table, type Column } from "./ui/table";

type UserRow = {
  userId: string;
  nombre: string | null;
  correo: string;
  rol: number | null;
  activo: boolean;
};

type UsersResponse = {
  ok: boolean;
  users?: UserRow[];
  message?: string;
};

const roleLabels: Record<number, string> = {
  1: "Administrador",
  2: "Supervisor",
  3: "Mesero",
};

const columns: Column<UserRow>[] = [
  { header: "ID", accessor: "userId" },
  {
    header: "Usuario",
    accessor: "nombre",
    render: (value) => value ?? "Sin nombre",
  },
  { header: "Correo", accessor: "correo" },
  {
    header: "Rol",
    accessor: "rol",
    render: (value) =>
      typeof value === "number" ? roleLabels[value] ?? "Sin rol" : "Sin rol",
  },
  {
    header: "Estado",
    accessor: "activo",
    render: (value) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          value ? "bg-green-700 text-white" : "bg-red-200 text-red-800"
        }`}
      >
        {value ? "Activo" : "Inactivo"}
      </span>
    ),
  },
];

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsuarios = async () => {
      setError(null);

      try {
        const res = await fetch("/api/auth/users");

        if (!res.ok) {
          throw new Error("No se pudo obtener los usuarios");
        }

        const body = (await res.json()) as UsersResponse;

        if (!body.ok || !body.users) {
          throw new Error(body.message ?? "Respuesta inválida del servidor");
        }

        if (isMounted) {
          setUsuarios(body.users);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Error inesperado";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchUsuarios();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="text-gray-400">Cargando usuarios...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl">Usuarios</h1>
      {error && (
        <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <Table<UserRow> columns={columns} data={usuarios} />
    </div>
  );
}
