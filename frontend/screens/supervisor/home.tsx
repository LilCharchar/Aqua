import type { User } from "../types";
import { useState, useEffect, useCallback } from "react";
import Button from "../../src/components/ui/button"; 
import Separator from "../../src/components/separator";

// --- TIPOS DE DATOS ---

type SupervisorHomeProps = {
  user: User;
  logout: () => void;
};

type CajaTransaccion = {
  id: number;
  tipo: "Ingreso" | "Egreso";
  monto: number;
  descripcion: string | null;
  creado_en: string | null;
}

type CajaResponse = {
  id: number;
  supervisorId: string | null;
  supervisorNombre: string | null;
  montoInicial: number;
  montoFinal: number | null;
  abiertoEn: string | null;
  cerradoEn: string | null;
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
  diferencia: number | null;
  transacciones: CajaTransaccion[];
}

type SuccessResponse = {
  ok: true;
  caja: CajaResponse;
};

type ErrorResponse = {
  ok: false;
  message: string;
}

type CajaSingleResponse = SuccessResponse | ErrorResponse;

type CreateCajaDto = {
  monto_inicial: number;
  supervisor_id?: string; 
}

type CloseCajaDto = {
  monto_final: number;
}

const API_URL = "/api/caja";

// --- UTILIDADES ---

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

// --- SUB-COMPONENTES ---

// 1. Formulario para Abrir Caja
const OpenCajaForm = ({ onOpen, isLoading }: { onOpen: (monto: number) => void, isLoading: boolean }) => {
  const [monto, setMonto] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(monto);
    if (!isNaN(valor) && valor >= 0) {
      onOpen(valor);
    } else {
      alert("El monto debe ser un número válido.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8">
      <div className="text-center mb-6">
        <h3 className="text-xl manrope-bold text-[var(--text-primary)] ">Abrir Caja (Efectivo)</h3>
        <p className="text-sm text-[var(--text-secondary)] manrope-light mt-1">
          Ingresa la base de efectivo inicial para este turno.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">$</span>
            <input 
              type="number" 
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:[var(--warning)] transition-all"
              required
              min="0"
            />
          </div>
        </div>
        <Button 
          disabled={isLoading} 
          className="w-full py-3  transition-transform active:scale-95"
        >
          {isLoading ? "Abriendo..." : "Abrir Caja"}
        </Button>
      </form>
    </div>
  );
};

// 2. Vista de Caja Abierta (Dashboard)
const ActiveCajaView = ({ caja, onClose, isLoading }: { caja: CajaResponse, onClose: (montoFinal: number) => void, isLoading: boolean }) => {

  const [conteoFisico, setConteoFisico] = useState("");
  const diferencia = caja.saldoActual - (parseFloat(conteoFisico) || 0);

  const handleCloseClick = () => {
    
    const montoFinal = parseFloat(conteoFisico);
    
    if (isNaN(montoFinal) || montoFinal < 0) {
      alert("El Contar Efectivo debe ser un número válido y positivo.");
      return;
  }

if(window.confirm(`¿Confirmar cierre con ${formatCurrency(montoFinal)} en EFECTIVO? Diferencia: ${formatCurrency(diferencia)}`)){
    onClose(montoFinal);
  }
  };

  return (
   <div className="mt-6 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

      
      

      {/* SECCIÓN 1: INGRESOS Y EGRESOS EN EFECTIVO */}
      <div>
        <h3 className="text-xl manrope-bold text-[var(--text-primary)] ml-2">Ingresos de Caja</h3>
          <div className="bg-[var(--secondary)] p-6 rounded-xl shadow-lg border border-gray-100">
          {/* Tarjeta de Base Inicial (Ventas en efectivo) */}
          <div className="p-4 pt-0 rounded-lg  flex justify-between items-center">
            <div>
              <span className="block text-[var(--text-primary)] manrope-medium">Base Inicial</span>
              <span className="text-xs manrope-light text-[var(--text-secondary)]">Monto de apertura del turno</span>
            </div>
            <span className="text-lg manrope-bold text-[var(--text-primary)]">
              {formatCurrency(caja.montoInicial)}
            </span>
          </div>

          <div className="h-0.5 w-full bg-[var(--text-secondary)]/20"></div>

          {/* Tarjeta de Ingresos (Aparte de la base) */}
          <div className="p-4 rounded-lg flex justify-between items-center">
            <div>
              <span className="block text-[var(--text-primary)] manrope-medium">Ingresos</span>
              <span className="text-xs manrope-light text-[var(--text-secondary)]">Total de entradas de efectivo</span>
            </div>
            <span className="text-lg manrope-bold text-green-600">
              +{formatCurrency(caja.totalIngresos)}
            </span>
          </div>

          <div className="h-0.5 w-full bg-[var(--text-secondary)]/20"></div>

          {/* Tarjeta de Egresos */}
          <div className="p-4  flex justify-between items-center">
            <div>
              <span className="block text-[var(--text-primary)] manrope-medium">Egresos / Retiros</span>
              <span className="text-xs manrope-light text-[var(--text-secondary)]">Total de salidas de efectivo</span>
            </div>
            <span className="text-lg manrope-bold text-red-600">
              -{formatCurrency(caja.totalEgresos)}
            </span>
          </div>

        </div>
      </div>
      
      {/* SECCIÓN 2: RESUMEN DE EFECTIVO (Cuadre) */}
      <div>
        <h3 className="text-xl manrope-bold text-[var(--text-primary)] ml-2">Resumen de Efectivo</h3>
        <div className="bg-[var(--secondary)] p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="space-y-4">
          
          {/* EFECTIVO ESPERADO (TEÓRICO) */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="block text-[var(--text-primary)] manrope-medium">Efectivo esperado</span>
              <span className="text-xs manrope-light text-[var(--text-secondary)]">Total de efectivo esperado en caja</span>
            </div>
            <span className="text-2xl manrope-bold text-[var(--warning)]">
              {formatCurrency(caja.saldoActual)}
            </span>
          </div>

          <div className="h-0.5 w-full bg-[var(--text-secondary)]/20"></div>

          <div className="flex flex-col">
              <label className="block text-[var(--text-primary)] manrope-medium mb-2">Conteo físico</label>
              <input 
                type="number" 
                value={conteoFisico}
                onChange={(e) => setConteoFisico(e.target.value)}
                placeholder="0.00"
                className="w-full shadow-2xl px-4 py-3 border border-black/30 rounded-lg text-lg outline-none focus:ring-2 focus:ring-[var(--warning)]"
                required
                min="0"
                />
      </div>
        <div className="h-0.5 w-full bg-[var(--text-secondary)]/20"></div>

          {/* DIFERENCIA (Calculada solo al cerrar, aquí mostramos el botón de cierre) */}
    <div className="flex justify-between items-center pt-2">
              <div>
                <span className="block text-[var(--text-primary)] manrope-medium">Diferencia</span>
                <span className="text-xs manrope-light text-[var(--text-secondary)]">Diferencia entre el efectivo esperado y el conteo físico</span>
              </div>
              <span className={`text-2xl manrope-bold ${diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(diferencia)}
              </span>
              </div>

          </div>

          
          
        </div>
      </div>
      <div className="flex items-center justify-center">

                              <button 
                onClick={handleCloseClick}
                disabled={isLoading || conteoFisico === ""}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center gap-2"
            >
                <span>🔒</span>
                {isLoading ? "Cerrando..." : "confirmar cierre"}
            </button>
      </div>

    </div> 

  );
};
// --- COMPONENTE PRINCIPAL (CONTAINER) ---

export function Home({ user, logout }: SupervisorHomeProps) {
  const [caja, setCaja] = useState<CajaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar estado inicial
  const fetchCurrentCaja = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const res = await fetch(`${API_URL}/current`);
        const data: CajaSingleResponse = await res.json();

        if (data.ok) {
            setCaja(data.caja);
        } else {
            if (data.message && data.message.includes("No hay caja abierta")) {
                setCaja(null);
            } else {
                setError(data.message);
            }
        }
    } catch (err) {
        console.error(err);
        setError("Error de conexión al cargar la caja.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentCaja();
  }, [fetchCurrentCaja]);

  // 2. Manejar Apertura
  const handleOpenCaja = async (montoInicial: number) => {
    setIsLoading(true);
    try {
        const payload: CreateCajaDto = {
            monto_inicial: montoInicial,
        };

        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data: CajaSingleResponse = await res.json();

        if (data.ok) {
            setCaja(data.caja);
        } else {
            alert(`No se pudo abrir la caja: ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("Error de red al abrir la caja");
    } finally {
        setIsLoading(false);
    }
  };

  // 3. Manejar Cierre
  const handleCloseCaja = async (montoFinal: number) => {
    if (!caja) return;
    setIsLoading(true);

    try {
        const payload: CloseCajaDto = {
            monto_final: montoFinal
        };

        const res = await fetch(`${API_URL}/${caja.id}/close`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data: CajaSingleResponse = await res.json();

        if (data.ok) {
            const dif = data.caja.diferencia || 0;
            let mensaje = `✅ Turno cerrado correctamente.\n\n`;
            mensaje += `Diferencia en Efectivo: ${formatCurrency(dif)}\n`;
            
            if (dif === 0) mensaje += "Estado: PERFECTO";
            else if (dif > 0) mensaje += "Estado: SOBRANTE DE EFECTIVO";
            else mensaje += "Estado: FALTANTE DE EFECTIVO";

            alert(mensaje);
            setCaja(null); 
        } else {
            alert(`Error al cerrar: ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("Error de red al cerrar la caja");
    } finally {
        setIsLoading(false);
    }
  };


  return (
   <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="m-10 max-w-7xl mx-auto w-full">
        
        {/* Header con Info del Usuario (Ajustado al estilo del mockup) */}
          <div className="flex items-center gap-4">
            <span className="text-xl manrope-bold">{user.nombre}</span>
            <div className="ml-auto">
              <span className="text-s text-[var(--text-primary)]">Supervisor</span>
            </div>
          </div>
            <div className="flex items-center justify-center">
              <span className=" text-3xl manrope-bold">Arqueo de caja</span>
            </div>
          <Separator />

        {/* Cuerpo Principal */}
        <div className="mt-8">
            {/* ... (Lógica de loading y error) */}
            {isLoading && !caja ? (
                <div className="flex justify-center items-center py-20 text-gray-400">
                    <span className="animate-pulse">Cargando estado de la caja...</span>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center border border-red-100">
                    {error}
                </div>
            ) : caja ? (
                // VISTA: CAJA ABIERTA
                <ActiveCajaView 
                    caja={caja} 
                    onClose={handleCloseCaja} 
                    isLoading={isLoading} 
                />
            ) : (
                // VISTA: CAJA CERRADA (FORMULARIO)
                <OpenCajaForm 
                    onOpen={handleOpenCaja} 
                    isLoading={isLoading} 
                />
            )}
        </div>
      </div>
    </div>
  );
}
export default Home;