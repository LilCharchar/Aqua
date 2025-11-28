import React from "react";

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

const OrderCard: React.FC<{
  order: OrderSummary;
  onOpen: (order: OrderSummary) => void;
}> = ({ order, onOpen }) => {
  return (
    <div
      onClick={() => onOpen(order)}
      className="cursor-pointer p-5 rounded-2xl bg-[var(--card-bg,#eef3f6)] border border-slate-300 shadow-sm hover:shadow-md transition flex flex-col justify-between h-60"
      style={{ minHeight: 220 }}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-700 font-semibold">
            Orden #{order.id}
          </div>
          <div className="text-xs text-slate-500">
            Mesa: {order.mesaNumero ?? "—"}
          </div>
        </div>

        <hr className="border-slate-200 mb-3" />

        <div className="text-sm text-slate-700 space-y-2 max-h-36 overflow-auto">
          {order.items && order.items.length > 0 ? (
            order.items.map((it) => (
              <div
                key={it.id ?? `${order.id}-${it.platilloNombre}`}
                className="flex justify-between"
              >
                <div className="truncate pr-2 text-slate-700">
                  {it.platilloNombre ?? "Item"}
                </div>
                <div className="text-slate-500">
                  ${(it.subtotal ?? 0).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-500">Sin ítems</div>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-slate-500 font-medium">Total:</div>
          <div className="font-semibold">
            ${(order.total ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
