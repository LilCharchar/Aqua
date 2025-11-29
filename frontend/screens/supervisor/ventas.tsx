import type { User } from "../types";
import Separator from "../../src/components/separator";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Table, type Column } from "../../src/components/ui/table";
import type { PaymentHistoryRow, PaymentsHistoryResponse } from "../../src/types/payments";
import { generateInvoicePdf, type InvoiceOrderDetail } from "../../src/utils/invoice";

type VentasHomeProps = {
  user: User;
};

type OrderSingleResponse =
  | {
      ok: true;
      order: {
        id: number;
        mesaNumero: string | null;
        meseroNombre: string | null;
        estado: string;
        total: number;
        totalPagado: number;
        saldoPendiente: number;
        items: InvoiceOrderDetail["items"];
      };
    }
  | { ok: false; message: string };

const API_PAYMENTS_URL = "/api/orders/payments";

function formatCurrency(amount?: number | null) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const PaymentHistory: React.FC = () => {
    const [allPayments, setAllPayments] = useState<PaymentHistoryRow[]>([]);
    const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const orderCache = useRef<Map<number, InvoiceOrderDetail | null>>(new Map());

    const METHOD_OPTIONS = ['Efectivo', 'Tarjeta', 'Otro'];

    const fetchPayments = useCallback(async () =>{
        setIsLoading(true);
        setError(null);
        try{
            const res = await fetch(API_PAYMENTS_URL);
            const data: PaymentsHistoryResponse = await res.json();    
            if (data.ok) {
                console.log("📌 PAGOS RECIBIDOS:", data.pagos);
                setAllPayments(data.pagos);
            }else {
                setError(data.message);
                setAllPayments([]);
            }
        }catch (err){
            console.error("Error fetching payments:", err);
            setError("Error de conexión al listar los pagos.");
            setAllPayments([]);
        }finally{
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
    fetchPayments();
}, []); 

    useEffect(() => {
            if (!allPayments.length) return;

    let filtered = [...allPayments];

    // 🔵 FILTRO POR FECHA
    if (filterDate) {
        filtered = filtered.filter(p => {
            if (!p.fecha) return false;
            return p.fecha.startsWith(filterDate);
        });
    }

    // 🔵 FILTRO POR MÉTODO
    if (filterMethod !== "all") {
        filtered = filtered.filter(p =>
            p.metodoPago === filterMethod
        );
    }
    setPayments(filtered);
    }, [filterDate, filterMethod, allPayments]);

    const fetchOrderDetail = useCallback(
      async (orderId: number): Promise<InvoiceOrderDetail | null> => {
        if (orderCache.current.has(orderId)) {
          return orderCache.current.get(orderId) ?? null;
        }
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) {
            throw new Error("Respuesta inválida del servidor");
          }
          const data: OrderSingleResponse = await res.json();
          if (data.ok && data.order) {
            const detail: InvoiceOrderDetail = {
              id: data.order.id,
              mesaNumero: data.order.mesaNumero,
              meseroNombre: data.order.meseroNombre,
              estado: data.order.estado,
              total: data.order.total,
              totalPagado: data.order.totalPagado,
              saldoPendiente: data.order.saldoPendiente,
              items: data.order.items,
            };
            orderCache.current.set(orderId, detail);
            return detail;
          }
          orderCache.current.set(orderId, null);
          return null;
        } catch (error) {
          console.error("No se pudo obtener la orden para la factura:", error);
          orderCache.current.set(orderId, null);
          return null;
        }
      },
      [],
    );

    const handleInvoice = useCallback(
      async (payment: PaymentHistoryRow) => {
        let orderDetail: InvoiceOrderDetail | null = null;
        if (payment.orderId) {
          orderDetail = await fetchOrderDetail(payment.orderId);
          if (!orderDetail) {
            window.alert(
              "No se pudo cargar el detalle de la orden. La factura mostrará solo los totales.",
            );
          }
        }
        generateInvoicePdf(payment, orderDetail);
      },
      [fetchOrderDetail],
    );

    const columns = useMemo<Column<PaymentHistoryRow>[]>(() => [
      { header: "ID_PAGO", accessor: "id", width: "10%" },
      {
        header: "Metodo",
        accessor: "metodoPago",
        render: (value) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${value === "Efectivo" ? "bg-indigo-100 text-indigo-800" : "bg-pink-100 text-pink-800"}`}
          >
            {value as string}
          </span>
        ),
        width: "10%",
      },
      {
        header: "Monto Recibido",
        accessor: "monto",
        render: (value) => formatCurrency(value as number),
        width: "10%",
      },
      {
        header: "Cambio",
        accessor: "cambio",
        render: (value) => formatCurrency(value as number | null),
        width: "10%",
      },
      {
        header: "Fecha",
        accessor: "fecha",
        render: (value) => formatDateTime(value as string | null),
        width: "20%",
      },
      {
        header: "Factura",
        accessor: "id",
        render: (_, row) => (
          <button
            type="button"
            onClick={() => handleInvoice(row)}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition"
          >
            Generar
          </button>
        ),
        width: "15%",
      },
    ], [handleInvoice]);

    return(
        <div className="mt-5">
            <div className="flex flex-wrap justify-end gap-4 p-2">
                <div className="flex flex-col">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="p-2 border rounded-xl text-sm bg-white"
                    />
                </div>
                <div>
                    <select
                        value={filterMethod}
                        onChange={(e) => setFilterMethod(e.target.value)}
                        className="p-2 border  text-sm rounded-xl bg-white"
                    >
                        <option value="all">Metodo de pago</option>
                        {METHOD_OPTIONS.map(method => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>
            </div>
            {isLoading ? (
                <p className="text-center py-10">Cargando historial de pagos...</p>
            ) : error ? (
                <p className="text-center py-10 text-red-500">Error: {error}</p>
            ) : (
                <div className="rounded-xl overflow-hidden border">
                    <Table<PaymentHistoryRow> 
                        data={payments} 
                        columns={columns} 
                    />
                </div>

            )}
        </div>
    );
}


export function Ventas({ user }: VentasHomeProps) {
  return (
        <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <div className="m-10">
          <div className="flex items-center gap-4">
            <span className="text-xl manrope-bold">{user.nombre}</span>
            <div className="ml-auto">
              <span className="text-s text-[var(--text-primary)]">Supervisor</span>
            </div>
          </div>
            <div className="flex items-center justify-center">
              <span className=" text-3xl manrope-bold">Ventas</span>
            </div>
          <Separator />

          <PaymentHistory />
        </div>
    </div>
  );
}

export default Ventas;
