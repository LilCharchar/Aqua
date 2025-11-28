import type { User } from "../types"
import Separator from "../../src/components/separator";
import {useState, useEffect, useCallback} from 'react';
import {Table, type Column} from "../../src/components/ui/table";

type VentasHomeProps = {
  user: User;
  logout: () => void;
};

type PaymentOrder = {
    id: number,
    estado: string;
    total: number;
    mesaNumero: number | null;
    meseroNombre: string | null;
};

type PaymentHistoryRow = {
    id: number,
    orden_id: number,
    metodoPago: string;
    monto: number;
    cambio: number;
    fecha: string;
    orden: PaymentOrder;
}

type PaymentsHistoryResponse = {
    ok: true;
    pagos: PaymentHistoryRow[];
}| {
  ok: false;
  message: string;
};

const API_PAYMENTS_URL = "/api/orders/payments";

function formatCurrency(amount: number){
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(amount);
}

const PAYMENT_COLUMNS: Column<PaymentHistoryRow>[] = [

    {
        header: "ID_PAGO",
        accessor: "id",
        width: "10%"
    },
    {
        header: "Metodo",
        accessor: "metodoPago",
        render: (value) =>(
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${value === 'Efectivo' ? 'bg-indigo-100 text-indigo-800' : 'bg-pink-100 text-pink-800'}`}>
                {value as string}
            </span>
        ),
        width: "10%"
    },
    {
        header: "Monto Recibido",
        accessor: "monto",
        render: (value) =>  formatCurrency(value as number),
        width: "10%"
    },
    {
        header: "Cambio",
        accessor: "cambio",
        render: (value) => formatCurrency(value as number),
        width: "10%"
    },
    {
        header: "Fecha",
        accessor: "fecha",
        render: (value) => new Date(value as string).toLocaleString(),
        width: "25%",
    },
];

const PaymentHistory: React.FC = () => {
    const [allPayments, setAllPayments] = useState<PaymentHistoryRow[]>([]);
    const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
    const [filterMethod, setFilterMethod] = useState<string>('all');

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
        filtered = filtered.filter(p =>
            p.fecha.startsWith(filterDate)
        );
    }

    // 🔵 FILTRO POR MÉTODO
    if (filterMethod !== "all") {
        filtered = filtered.filter(p =>
            p.metodoPago === filterMethod
        );
    }
    setPayments(filtered);
    }, [filterDate, filterMethod, allPayments]);


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
                        columns={PAYMENT_COLUMNS} 
                    />
                </div>

            )}
        </div>
    );
}


export function Ventas({ user, logout }: VentasHomeProps) {
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