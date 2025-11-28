import type { User } from "../types";
import Separator from "../../src/components/separator";
import { useEffect, useState } from "react";
import OrderCard from "../../src/components/ui/OrderCard";
import OrderModal from "../../src/components/ui/OrderModal";
import Modal from "../../src/components/ui/modal";

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

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function Orders({ user }: MeseroOrdersProps) {
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
        <div className="flex items-center gap-4">
          <span className="text-xl manrope-bold">{user?.nombre}</span>
          <div className="ml-auto">
            <span className="text-s text-[var(--text-primary)]">Mesero</span>
          </div>
        </div>
        <div className="flex items-center justify-center mt-4">
          <span className=" text-3xl manrope-bold">Ordenes</span>
        </div>
        <Separator />
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
