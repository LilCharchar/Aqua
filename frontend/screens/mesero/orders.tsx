import type { User } from "../types";
import Separator from "../../src/components/separator";
import { useEffect, useState } from "react";
import OrderCard from "../../src/components/ui/OrderCard";
import OrderModal from "../../src/components/ui/OrderModal";
import Modal from "../../src/components/ui/modal";
import { RotateCw } from "lucide-react";
import logo from "../../assets/logo.png";

type MeseroOrdersProps = {
  user: User;
  logout: () => void;
};

type OrderItem = {
  id?: number;
  platilloNombre?: string | null;
  cantidad?: number;
  subtotal?: number;
};
type OrderSummary = {
  id: number;
  mesaNumero?: string | null;
  items: OrderItem[];
  total?: number;
};

const API_URL = "/api";

export function Orders({ user, logout }: MeseroOrdersProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<OrderSummary | null>(null);
  const [editOrderId, setEditOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/orders`);
      const data = await res.json();
      if (!res.ok || data?.ok === false)
        throw new Error(data?.message ?? "No se pudieron cargar las órdenes");
      // backend might return { orders: [...] } or { data: [...] }
      const list = data.orders ?? data.data ?? [];
      // map to our summary shape conservatively
      const mapped: OrderSummary[] = (list ?? []).map((o: any) => ({
        id: o.id,
        mesaNumero:
          o.mesa_numero ??
          o.mesaNumero ??
          o.mesa?.numero ??
          String(o.mesa_id ?? ""),
        items: (o.items ?? o.items_order ?? []).map((it: any) => ({
          id: it.id,
          platilloNombre: it.platillo_nombre ?? it.platilloNombre ?? it.nombre,
          cantidad: it.cantidad,
          subtotal: it.subtotal ?? it.precio_subtotal,
        })),
        total: o.total ?? o.total_amount ?? 0,
      }));
      setOrders(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)] p-8">
      <div className="m-4">
        <div className="flex items-center gap-4 mb-2">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
          <h1 className="text-2xl manrope-bold">{user?.nombre ?? "—"}</h1>
          <span className="text-sm ml-auto">Mesero</span>
        </div>
        <Separator />
      </div>
      <div className="mx-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-3xl manrope-bold">Ordenes</span>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--text-primary)] text-sm hover:bg-[var(--text-primary)]/10 transition disabled:opacity-60"
        >
          <RotateCw size={18} className={loading ? "animate-spin" : ""} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="flex-1">
        {loading && (
          <p className="text-sm text-slate-400">Cargando órdenes...</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 && !loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] h-56"
                />
              ))
            : orders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onOpen={(order) => setEditOrderId(order.id)}
                />
              ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-full"
          >
            Crear orden
          </button>
        </div>
      </div>

      <div className="mt-auto flex justify-end items-center gap-4 mr-10">
        <button
          className="hover:scale-105 transition-transform duration-200 text-sm"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>

      <OrderModal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
        }}
        onSaved={() => fetchOrders()}
      />

      <OrderModal
        isOpen={!!editOrderId}
        orderId={editOrderId ?? undefined}
        onClose={() => setEditOrderId(null)}
        onSaved={() => {
          setEditOrderId(null);
          fetchOrders();
        }}
      />

      <Modal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={viewOrder ? `Orden #${viewOrder.id}` : undefined}
        width="max-w-3xl"
      >
        {viewOrder && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400">Mesa: {viewOrder.mesaNumero}</p>
              <div className="mt-4 space-y-2">
                {viewOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <div>{it.platilloNombre}</div>
                    <div className="text-slate-400">
                      ${(it.subtotal ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mt-4">
                <div className="flex justify-between text-slate-400">
                  Total:
                </div>
                <div className="text-xl font-semibold mt-2">
                  ${(viewOrder.total ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default Orders;
