export type PaymentHistoryRow = {
  id: number;
  orderId: number | null;
  metodoPago: string;
  monto: number;
  cambio: number | null;
  fecha: string | null;
  orderEstado: string | null;
  orderTotal: number | null;
  mesaNumero: string | null;
  meseroNombre: string | null;
};

export type PaymentsHistoryResponse =
  | { ok: true; pagos: PaymentHistoryRow[] }
  | { ok: false; message: string };
