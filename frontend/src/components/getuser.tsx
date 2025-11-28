import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type FormEvent,
} from "react";
import { Table, type Column } from "./ui/table";
import SearchBar from "./ui/searchBar";
import { RotateCw, UserRoundCheck, UserRoundPen, UserRoundX } from "lucide-react";
import Modal from "./ui/modal";
import Button from "./ui/button";
import Input from "./ui/input";

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

type UsuariosActions = {
  refresh: () => Promise<void>;
};

type UsuariosProps = {
  onReady?: (actions: UsuariosActions) => void;
};

type FetchOptions = {
  silent?: boolean;
};

const roleLabels: Record<number, string> = {
  1: "Administrador",
  2: "Supervisor",
  3: "Mesero",
};

const initialEditForm = {
  nombre: "",
  correo: "",
  contraseña: "",
  rol: "",
};

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function Usuarios({ onReady }: UsuariosProps = {}) {
  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | null>(null);
  

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<boolean | "">("");

  const fetchUsuarios = useCallback(
    async ({ silent }: FetchOptions = {}) => {
      setError(null);
      if (!silent) setLoading(true);

      try {
        const res = await fetch("/api/auth/users");
        const body = (await parseResponse(res)) as UsersResponse | null;

        if (!res.ok) {
          throw new Error(body?.message ?? "No se pudo obtener los usuarios");
        }

        if (!body?.ok || !body.users) {
          throw new Error(body?.message ?? "Respuesta inválida del servidor");
        }

        setUsuarios(body.users);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    if (onReady) {
      onReady({ refresh: () => fetchUsuarios() });
    }
  }, [fetchUsuarios, onReady]);

  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        nombre: selectedUser.nombre ?? "",
        correo: selectedUser.correo,
        contraseña: "",
        rol: selectedUser.rol ? String(selectedUser.rol) : "",
      });
    } else {
      setEditForm(initialEditForm);
    }
  }, [selectedUser]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((user) => {
      const matchesSearch =
        user.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        user.correo.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter ? user.rol === roleFilter : true;
      const matchesStatus =
        statusFilter === "" ? true : user.activo === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usuarios, search, roleFilter, statusFilter]);

  const handleToggleActive = useCallback(
    async (user: UserRow) => {
      setRowActionId(user.userId);
      setError(null);

      try {
        const endpoint = user.activo
          ? `/api/auth/${user.userId}`
          : `/api/auth/${user.userId}/restore`;
        const method = user.activo ? "DELETE" : "PATCH";

        const res = await fetch(endpoint, { method });
        const body = await parseResponse(res);

        if (!res.ok || !body?.ok) {
          throw new Error(body?.message ?? "No se pudo actualizar el estado");
        }

        await fetchUsuarios({ silent: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
      } finally {
        setRowActionId(null);
      }
    },
    [fetchUsuarios],
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setEditError(null);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;

    const trimmedNombre = editForm.nombre.trim();
    const trimmedCorreo = editForm.correo.trim();
    const nextRol = editForm.rol ? Number(editForm.rol) : null;
    const hasChanges =
      trimmedNombre !== (selectedUser.nombre ?? "") ||
      trimmedCorreo !== selectedUser.correo ||
      nextRol !== (selectedUser.rol ?? null) ||
      Boolean(editForm.contraseña.trim());

    if (!trimmedNombre || !trimmedCorreo) {
      setEditError("Nombre y correo son obligatorios");
      return;
    }

    if (!hasChanges) {
      setEditError("No hay cambios para aplicar");
      return;
    }

    const payload: Record<string, unknown> = {
      nombre: trimmedNombre,
      correo: trimmedCorreo,
      rol_id: nextRol,
    };

    if (editForm.contraseña.trim()) {
      payload.contraseña = editForm.contraseña;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/auth/${selectedUser.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await parseResponse(res);

      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? "No se pudo actualizar el usuario");
      }

      await fetchUsuarios({ silent: true });
      handleModalClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const columns = useMemo<Column<UserRow>[]>(() => {
    return [
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
            className={`px-2 py-1 rounded-full text-xs manrope-regular ${
              value
                ? "bg-[var(--confirmation)] text-[var(--text-buttons)]"
                : "bg-[var(--warning)] text-[var(--text-buttons)]"
            }`}
          >
            {value ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        header: "",
        accessor: "userId" as const,
        render: (_value, row) => (
          <div className="flex items-center gap-5 justify-center">
            <button
              title="Editar usuario"
              className="text-[var(--text-primary)]"
              onClick={() => {
                setIsModalOpen(true);
                setSelectedUser(row);
              }}
              disabled={editLoading && selectedUser?.userId === row.userId}
            >
              <UserRoundPen className="w-5 h-5" />
            </button>
            <button
              title={row.activo ? "Desactivar usuario" : "Activar usuario"}
              className="text-[var(--text-primary)]"
              onClick={() => void handleToggleActive(row)}
              disabled={rowActionId === row.userId}
            >
              {rowActionId === row.userId ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : row.activo ? (
                <UserRoundX className="w-5 h-5" />
              ) : (
                <UserRoundCheck className="w-5 h-5" />
              )}
            </button>
          </div>
        ),
      },
    ];
  }, [editLoading, handleToggleActive, rowActionId, selectedUser]);

  if (loading) {
    return <div className="text-gray-400">Cargando usuarios...</div>;
  }

  return (
    <div className="bg-[var(--secondary)] pb-6 rounded-xl shadow-md flex flex-col h-full overflow-hidden">
      <div className="p-6 space-y-4 flex-shrink-0">
        {error && (
          <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-[var(--warning)]">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3 items-left justify-between">
          <SearchBar
            type="text"
            placeholder="Buscar por usuario o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto"
          />
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value ? Number(e.target.value) : "")
              }
              className="p-1 border border-gray-300 rounded-md text-xs bg-[var(--options)] text-[var(--text-primary)]"
            >
              <option value="">Todos los roles</option>
              <option value="1">Administrador</option>
              <option value="2">Supervisor</option>
              <option value="3">Mesero</option>
            </select>
            <select
              value={statusFilter === "" ? "" : statusFilter ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === "" ? "" : val === "true");
              }}
              className="p-1 border border-gray-300 rounded-md text-xs bg-[var(--options)]  text-[var(--text-primary)]"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            <button
              onClick={() => void fetchUsuarios()}
              disabled={loading}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCw className="w-4 h-4 text-[var(--text-primary)] hover:text-[var(--primary)]" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto table-scroll-area">
        <div className="min-w-full  border-t border-gray-200">
          <Table<UserRow> columns={columns} data={filteredUsuarios} tableClassName="w-full" />
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Editar Usuario">
        <form
          className="flex flex-col gap-4 justify-center items-center"
          onSubmit={handleEditSubmit}
        >
          <Input
            type="text"
            placeholder="Nombre"
            value={editForm.nombre}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            required
            className="p-2 border border-gray-300 rounded"
          />
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={editForm.correo}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, correo: e.target.value }))
            }
            required
            className="p-2 border border-gray-300 rounded"
          />
          <Input
            type="password"
            placeholder="Cambiar contraseña"
            value={editForm.contraseña}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, contraseña: e.target.value }))
            }
            className="p-2 border border-gray-300 rounded"
          />
          <select
            className="p-3 border border-gray-300 rounded-md text-xs bg-[var(--options)] text-[var(--text-primary)]"
            value={editForm.rol}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, rol: e.target.value }))
            }
          >
            <option value="">Selecciona un rol</option>
            <option value="1">Administrador</option>
            <option value="2">Supervisor</option>
            <option value="3">Mesero</option>
          </select>
          {editError && (
            <p className="text-sm text-[var(--warning)]">{editError}</p>
          )}
          <div className="flex gap-5">
            <Button type="submit" className="shadow-xl" disabled={editLoading}>
              {editLoading ? "Actualizando..." : "Actualizar"}
            </Button>
            <Button type="button" onClick={handleModalClose}>
              Volver
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
