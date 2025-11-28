import React, { useEffect, useState } from "react";

// Usamos un acceso seguro a import.meta para evitar errores en entornos ES2015
const getApiUrl = () => {
  try {
    // @ts-ignore
    return (import.meta as any)?.env?.VITE_API_URL ?? "/api";
  } catch {
    return "/api";
  }
};

const API_URL = getApiUrl();

type OrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  orderId?: number | null;
  userId?: string;
};

type Mesa = { id: number; numero: number | null };
type Platillo = { id: number; nombre: string; precio: number };
// Agregamos tipo para Usuarios
type Usuario = { id: string; nombre: string; rol?: string };

type ItemRow = {
  key: string;
  platilloId: string;
  cantidad: number;
  detailId?: number;
};

function makeKey() {
  return `${Date.now()}-${Math.random()}`;
}

function newItemRow(): ItemRow {
  return { key: makeKey(), platilloId: "", cantidad: 1 };
}

export default function OrderModal({
  isOpen,
  onClose,
  onSaved,
  orderId,
  userId,
}: OrderModalProps) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); // Estado para lista de usuarios

  const [mesaId, setMesaId] = useState<string>("");
  const [mesaNumeroDisplay, setMesaNumeroDisplay] = useState<string | null>(
    null
  );

  const [meseroId, setMeseroId] = useState<string>("");
  const [items, setItems] = useState<ItemRow[]>([newItemRow()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPaymentView, setIsPaymentView] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const total = items.reduce((acc, it) => {
    const p = platillos.find((x) => x.id === Number(it.platilloId));
    return acc + (p ? p.precio * it.cantidad : 0);
  }, 0);

  const change =
    paymentMethod === "Efectivo"
      ? Math.max(0, (Number(paymentAmount) || 0) - total)
      : 0;

  useEffect(() => {
    if (userId) {
      setMeseroId(userId);
    } else {
      // Intento de recuperar usuario de localStorage si no viene por props
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.id) setMeseroId(parsed.id);
        }
      } catch (e) {
        // Ignorar error de parsing
      }
    }
  }, [userId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsPaymentView(false);
    setPaymentAmount("");

    loadMesas();
    loadPlatillos();
    loadUsuarios(); // Cargamos usuarios para el selector

    if (orderId) {
      loadOrder(orderId);
    } else {
      resetForm();
    }
  }, [isOpen, orderId]);

  function resetForm() {
    setMesaId("");
    setMesaNumeroDisplay(null);
    setItems([newItemRow()]);
    setError(null);
    // Re-aplicar userId si existe
    if (userId) setMeseroId(userId);
  }

  async function loadMesas() {
    try {
      const res = await fetch(`${API_URL}/mesas`);
      const data = await res.json();
      setMesas(data.mesas ?? data.data ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPlatillos() {
    try {
      const res = await fetch(`${API_URL}/platillos`);
      const data = await res.json();
      setPlatillos(data.platillos ?? data.data ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  // Nueva función para cargar usuarios
  async function loadUsuarios() {
    try {
      // Intentamos endpoints comunes, ajusta según tu backend
      const res = await fetch(`${API_URL}/usuarios`);
      const data = await res.json();
      setUsuarios(data.usuarios ?? data.data ?? []);
    } catch (e) {
      console.warn("No se pudo cargar la lista de usuarios", e);
    }
  }

  async function loadOrder(id: number) {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`);
      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        setError(data?.message ?? "No se pudo cargar la orden");
        return;
      }

      const o = data.order ?? data.data;

      const foundMesaId = o.mesaId ?? o.mesa_id ?? o.mesa?.id;
      setMesaId(foundMesaId ? String(foundMesaId) : "");

      const foundMesaNum = o.mesaNumero ?? o.mesa_numero ?? o.mesa?.numero;
      if (foundMesaNum) {
        setMesaNumeroDisplay(String(foundMesaNum));
      }

      if (o.mesero_id || o.meseroId) {
        setMeseroId(String(o.mesero_id || o.meseroId));
      }

      const mapped: ItemRow[] =
        (o.items ?? []).map((it: any) => ({
          key: makeKey(),
          platilloId: String(it.platilloId ?? it.platillo_id ?? ""),
          cantidad: Number(it.cantidad ?? 1),
          detailId: it.id ?? undefined,
        })) ?? [];

      setItems(mapped.length ? mapped : [newItemRow()]);
      setPaymentAmount(String(o.total ?? o.total_amount ?? 0));
    } catch (e) {
      console.error(e);
      setError("Error cargando orden");
    }
  }

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, newItemRow()]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function buildItemsPayload(rows: ItemRow[]) {
    return rows
      .filter((r) => r.platilloId && Number(r.platilloId) > 0 && r.cantidad > 0)
      .map((r) => ({
        platillo_id: Number(r.platilloId),
        cantidad: Number(r.cantidad),
      }));
  }

  async function deleteOrder() {
    if (!orderId) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta orden?"))
      return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "DELETE",
      });

      // Intentamos parsear la respuesta
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Si no es JSON, probablemente sea un error HTML del servidor (ej: 404 standard)
        throw new Error(
          res.ok
            ? "Error desconocido"
            : `Error ${res.status}: ${res.statusText}`
        );
      }

      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.message ?? `Error ${res.status}: No se pudo eliminar la orden`
        );
      }

      onSaved();
      onClose();
    } catch (err) {
      // MOSTRAR EL ERROR REAL: Esto te dirá si es un 404 (Endpoint no existe) o un 500
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido eliminando la orden"
      );
    } finally {
      setLoading(false);
    }
  }

  async function processPayment() {
    if (!orderId) return;
    const monto = Number(paymentAmount);
    if (monto < total) {
      setError("El monto recibido no puede ser menor al total.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pago: paymentMethod, monto: monto }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false)
        throw new Error(data?.message ?? "Error procesando el pago");
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveOrder() {
    setError(null);
    setLoading(true);

    try {
      const toSend = buildItemsPayload(items);

      if (toSend.length === 0) {
        setError("Agrega al menos un platillo con cantidad válida");
        setLoading(false);
        return;
      }

      let url = `${API_URL}/orders`;
      let method = "POST";
      let payload: any = {};

      if (orderId) {
        url = `${API_URL}/orders/${orderId}/items`;
        payload = { items: toSend };
      } else {
        if (!mesaId) {
          setError("Debes seleccionar una mesa");
          setLoading(false);
          return;
        }

        // Validación relajada: Si no hay meseroId, intentamos enviar null o string vacío,
        // pero mostramos advertencia en consola.
        // El selector en la UI permitirá al usuario corregirlo si falla.
        if (!meseroId) {
          console.warn("Enviando orden sin ID de mesero explícito.");
        }

        payload = {
          mesa_id: Number(mesaId),
          mesero_id: meseroId || null, // Enviamos null si está vacío para evitar error de string vacío en UUID
          estado: "Pendiente",
          items: toSend,
        };
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        setError(data?.message ?? "Error al guardar orden");
        setLoading(false);
        return;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando orden");
    }

    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-[var(--secondary)] text-[var(--text-primary)] rounded-2xl shadow-xl w-full max-w-lg p-6 border border-[rgba(255,255,255,0.05)] max-h-[90vh] overflow-y-auto transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl manrope-bold">
            {isPaymentView
              ? `Pagar Orden #${orderId}`
              : orderId
              ? `Editar Orden #${orderId}`
              : "Nueva Orden"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--warning)] transition"
          >
            ✕
          </button>
        </div>

        {isPaymentView ? (
          <div className="space-y-6">
            <div className="text-center p-4 bg-[var(--background)] rounded-xl border border-[rgba(255,255,255,0.05)]">
              <span className="text-[var(--text-secondary)] text-sm">
                Total a Pagar
              </span>
              <div className="text-4xl font-bold text-[var(--confirmation)] mt-1">
                ${total.toLocaleString()}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Efectivo", "Tarjeta"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-lg border text-center transition ${
                        paymentMethod === m
                          ? "bg-[var(--secondary-accent)] border-[var(--secondary-accent)] text-white"
                          : "bg-[var(--options)] border-transparent text-[var(--text-secondary)]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Monto Recibido
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Mínimo ${total}`}
                  className="w-full p-3 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--secondary-accent)] outline-none text-lg"
                />
              </div>
              {paymentMethod === "Efectivo" && (
                <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                  <span className="text-[var(--text-secondary)]">
                    Cambio a devolver:
                  </span>
                  <span className="text-xl font-bold text-[var(--warning)]">
                    ${change.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center">
                {error}
              </div>
            )}
            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setIsPaymentView(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--options)] text-[var(--text-primary)] hover:brightness-110 transition"
              >
                Atrás
              </button>
              <button
                onClick={processPayment}
                disabled={loading}
                className="flex-[2] px-4 py-3 rounded-xl bg-[var(--confirmation)] text-white hover:brightness-110 transition disabled:opacity-50 font-semibold"
              >
                {loading ? "Procesando..." : "Confirmar Pago"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Mesa
                </label>
                {orderId ? (
                  <div className="p-2 mt-1 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] text-gray-400">
                    {mesaNumeroDisplay
                      ? `Mesa ${mesaNumeroDisplay}`
                      : mesas.find((m) => m.id === Number(mesaId))?.numero
                      ? `Mesa ${
                          mesas.find((m) => m.id === Number(mesaId))?.numero
                        }`
                      : `Mesa ${mesaId || "..."}`}
                  </div>
                ) : (
                  <select
                    value={mesaId}
                    onChange={(e) => setMesaId(e.target.value)}
                    className="w-full p-2 mt-1 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] outline-none"
                  >
                    <option value="">— Seleccionar —</option>
                    {mesas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.numero ? `Mesa ${m.numero}` : `Mesa ${m.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selector de Encargado/Mesero */}
              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Encargado
                </label>
                {usuarios.length > 0 ? (
                  <select
                    value={meseroId}
                    onChange={(e) => setMeseroId(e.target.value)}
                    className="w-full p-2 mt-1 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] outline-none"
                  >
                    <option value="">— Asignar a —</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre || u.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  // Fallback si no hay lista de usuarios: mostramos ID actual o input
                  <input
                    type="text"
                    placeholder="ID del Encargado"
                    value={meseroId}
                    onChange={(e) => setMeseroId(e.target.value)}
                    className="w-full p-2 mt-1 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] outline-none"
                  />
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm text-[var(--text-secondary)] mb-2">
                Platillos
              </h3>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {items.map((it) => {
                  const p = platillos.find(
                    (x) => x.id === Number(it.platilloId)
                  );
                  return (
                    <div
                      key={it.key}
                      className="p-3 bg-[var(--background)] rounded-xl border border-[rgba(255,255,255,0.05)]"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          value={it.platilloId}
                          disabled={!!it.detailId}
                          onChange={(e) =>
                            updateItem(it.key, { platilloId: e.target.value })
                          }
                          className={`col-span-2 p-2 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)] ${
                            !!it.detailId ? "opacity-70" : ""
                          }`}
                        >
                          <option value="">Seleccionar</option>
                          {platillos.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.nombre} — ${pl.precio}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          disabled={!!it.detailId}
                          value={it.cantidad}
                          onChange={(e) =>
                            updateItem(it.key, {
                              cantidad: Number(e.target.value) || 1,
                            })
                          }
                          className="p-2 rounded-lg bg-[var(--options)] border border-[rgba(255,255,255,0.1)]"
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-[var(--text-secondary)]">
                          Subtotal:{" "}
                          <span className="text-[var(--secondary-accent)] font-semibold">
                            ${(p ? p.precio * it.cantidad : 0).toLocaleString()}
                          </span>
                        </span>
                        {!it.detailId ? (
                          <button
                            onClick={() => removeItem(it.key)}
                            className="text-sm text-[var(--warning)] hover:underline"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <span className="text-xs text-green-500 italic flex items-center">
                            Guardado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={addItem}
                className="mt-3 w-full bg-[var(--secondary-accent)] text-white py-2 rounded-xl hover:brightness-110 transition"
              >
                + Agregar platillo
              </button>
            </div>

            <p className="text-lg font-semibold mt-4 text-right">
              Total:{" "}
              <span className="text-[var(--confirmation)]">
                ${total.toLocaleString()}
              </span>
            </p>
            {error && (
              <div className="mt-3 p-2 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[var(--options)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.1)] hover:brightness-110 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveOrder}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[var(--secondary-accent)] text-white hover:brightness-110 transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
              {orderId && (
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-[rgba(255,255,255,0.1)]">
                  <button
                    onClick={deleteOrder}
                    className="px-4 py-2 text-sm text-[var(--warning)] hover:bg-red-900/20 rounded-xl transition"
                  >
                    Eliminar Orden
                  </button>
                  <button
                    onClick={() => {
                      setPaymentAmount(String(total));
                      setIsPaymentView(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--confirmation)] text-white font-medium hover:brightness-110 transition shadow-lg shadow-green-900/20"
                  >
                    Procesar Pago
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
