import { jsPDF } from "jspdf";
import type { PaymentHistoryRow } from "../types/payments";

export type InvoicePayment = PaymentHistoryRow;

export type InvoiceOrderItem = {
  id: number;
  platilloNombre: string | null;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
};

export type InvoiceOrderDetail = {
  id: number;
  mesaNumero: string | null;
  meseroNombre: string | null;
  estado: string | null;
  total: number | null;
  totalPagado: number | null;
  saldoPendiente: number | null;
  items: InvoiceOrderItem[];
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
});

const formatCurrency = (amount?: number | null) =>
  currencyFormatter.format(amount ?? 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export function generateInvoicePdf(
  payment: InvoicePayment,
  order?: InvoiceOrderDetail | null,
) {
  const doc = new jsPDF();
  const leftMargin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - leftMargin * 2;
  let cursorY = 20;

  const ensureSpace = (height = 0) => {
    const limit = doc.internal.pageSize.getHeight() - 20;
    if (cursorY + height > limit) {
      doc.addPage();
      cursorY = 20;
    }
  };

  const addDetail = (label: string, value: string) => {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.text(label, leftMargin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.text(value, leftMargin + 45, cursorY, { maxWidth: contentWidth - 45 });
    cursorY += 6;
  };

  doc.setFontSize(18);
  doc.text("Aqua POS", pageWidth / 2, cursorY, { align: "center" });
  doc.setFontSize(12);
  cursorY += 6;
  doc.text("Factura sin validez fiscal", pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 4;
  doc.setDrawColor(160, 160, 160);
  doc.line(leftMargin, cursorY, pageWidth - leftMargin, cursorY);
  cursorY += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Datos del pago", leftMargin, cursorY);
  cursorY += 6;
  addDetail("Factura", `#${payment.id}`);
  addDetail("Orden", payment.orderId ? `#${payment.orderId}` : "Sin orden");
  addDetail("Fecha", formatDateTime(payment.fecha));
  addDetail("Método", payment.metodoPago);
  addDetail("Mesero", payment.meseroNombre ?? "No registrado");
  addDetail(
    "Mesa",
    payment.mesaNumero ? `Mesa ${payment.mesaNumero}` : "Para llevar",
  );
  addDetail("Estado de orden", payment.orderEstado ?? "Sin registro");

  if (order && order.items.length > 0) {
    cursorY += 4;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de platillos", leftMargin, cursorY);
    cursorY += 6;
    doc.text("Cant.", leftMargin, cursorY);
    doc.text("Platillo", leftMargin + 20, cursorY);
    doc.text("Precio", leftMargin + 110, cursorY);
    doc.text("Subtotal", leftMargin + 150, cursorY);
    cursorY += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, cursorY, pageWidth - leftMargin, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");

    order.items.forEach((item) => {
      const platilloText = doc.splitTextToSize(
        item.platilloNombre ?? "Platillo",
        85,
      );
      const linesUsed = Array.isArray(platilloText)
        ? platilloText.length || 1
        : 1;
      const rowHeight = 6 * linesUsed;
      ensureSpace(rowHeight);
      doc.text(String(item.cantidad), leftMargin, cursorY);
      doc.text(platilloText, leftMargin + 20, cursorY);
      doc.text(formatCurrency(item.precioUnit), leftMargin + 110, cursorY);
      doc.text(formatCurrency(item.subtotal), leftMargin + 150, cursorY);
      cursorY += rowHeight;
    });
  }

  cursorY += 4;
  doc.setFont("helvetica", "bold");
  ensureSpace(30);
  doc.text("Resumen de montos", leftMargin, cursorY);
  cursorY += 6;
  addDetail("Total de la orden", formatCurrency(payment.orderTotal));
  addDetail("Pago recibido", formatCurrency(payment.monto));
  addDetail("Cambio entregado", formatCurrency(payment.cambio));

  cursorY += 10;
  ensureSpace(20);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Documento generado automáticamente para impresión. No sustituye una factura fiscal.",
    leftMargin,
    cursorY,
    { maxWidth: contentWidth },
  );

  doc.save(`factura_pago_${payment.id}.pdf`);
}
