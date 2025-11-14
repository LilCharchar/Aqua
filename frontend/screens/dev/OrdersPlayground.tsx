import { useEffect, useMemo, useState, useId } from "react";

interface Platillo {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string | null;
  disponible: boolean;
}

interface ProductOption {
  id: number;
  nombre: string;
  unidad: string;
}

interface OrderPayment {
  id: number;
  metodoPago: string;
  monto: number;
  cambio: number | null;
  fecha: string | null;
}

interface OrderItem {
  id: number;
  platilloNombre: string | null;
  cantidad: number;
  subtotal: number;
}

interface OrderDetails {
  id: number;
  mesaNumero: string | null;
  estado: string;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  pagos: OrderPayment[];
  items: OrderItem[];
}

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:5000/api";

interface OrderItemInput {
  key: string;
  platilloId: string;
  cantidad: string;
}

interface PlatilloIngredientInput {
  key: string;
  productoId: string;
  cantidad: string;
}

function toNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createItemRow(): OrderItemInput {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto;
  const key = random
    ? (crypto as Crypto).randomUUID()
    : `${Date.now()}-${Math.random()}`;
  return { key, platilloId: "", cantidad: "1" };
}

function createIngredientRow(): PlatilloIngredientInput {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto;
  const key = random
    ? (crypto as Crypto).randomUUID()
    : `${Date.now()}-${Math.random()}`;
  return { key, productoId: "", cantidad: "" };
}

interface ItemsEditorProps {
  items: OrderItemInput[];
  onChange: (next: OrderItemInput[]) => void;
  platillos: Platillo[];
  title: string;
}

function ItemsEditor({ items, onChange, platillos, title }: ItemsEditorProps) {
  const updateItem = (key: string, patch: Partial<OrderItemInput>) => {
    onChange(
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (key: string) => {
    if (items.length === 1) return;
    onChange(items.filter((item) => item.key !== key));
  };

  const addItem = () => {
    onChange([...items, createItemRow()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <button
          type="button"
          onClick={addItem}
          className="text-xs px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
        >
          Agregar línea
        </button>
      </div>
      {items.map((item) => (
        <div key={item.key} className="flex flex-wrap gap-2">
          <select
            className="flex-1 min-w-[160px] rounded border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            value={item.platilloId}
            onChange={(e) => updateItem(item.key, { platilloId: e.target.value })}
          >
            <option value="">Platillo</option>
            {platillos.map((platillo) => (
              <option key={platillo.id} value={platillo.id}>
                {platillo.nombre} (${platillo.precio})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="w-24 rounded border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            value={item.cantidad}
            onChange={(e) => updateItem(item.key, { cantidad: e.target.value })}
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="px-3 py-1 rounded border border-slate-500 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

interface IngredientsEditorProps {
  items: PlatilloIngredientInput[];
  onChange: (next: PlatilloIngredientInput[]) => void;
  products: ProductOption[];
}

function IngredientsEditor({ items, onChange, products }: IngredientsEditorProps) {
  const datalistId = useId();
  const updateItem = (key: string, patch: Partial<PlatilloIngredientInput>) => {
    onChange(
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (key: string) => {
    if (items.length === 1) {
      onChange([createIngredientRow()]);
      return;
    }
    onChange(items.filter((item) => item.key !== key));
  };

  const addItem = () => {
    onChange([...items, createIngredientRow()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">
          Ingredientes (opcional)
        </h4>
        <button
          type="button"
          onClick={addItem}
          className="text-xs px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
        >
          Agregar ingrediente
        </button>
      </div>
      {items.map((item) => (
        <div key={item.key} className="flex flex-wrap gap-2">
          <input
            list={datalistId}
            className="flex-1 min-w-[120px] rounded border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            placeholder="ID producto"
            value={item.productoId}
            onChange={(e) =>
              updateItem(item.key, { productoId: e.target.value })
            }
          />
          <input
            className="w-32 rounded border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            placeholder="Cantidad"
            value={item.cantidad}
            onChange={(e) =>
              updateItem(item.key, { cantidad: e.target.value })
            }
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="px-3 py-1 rounded border border-slate-500 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            Quitar
          </button>
        </div>
      ))}
      <datalist id={datalistId}>
        {products.map((product) => (
          <option
            key={product.id}
            value={product.id}
          >{`${product.nombre} (${product.unidad})`}</option>
        ))}
      </datalist>
    </div>
  );
}

function OrdersPlayground() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [platillosError, setPlatillosError] = useState<string>("");
  const [loadingPlatillos, setLoadingPlatillos] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsError, setProductsError] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [createForm, setCreateForm] = useState({
    mesaId: "1",
    meseroId: "14",
    estado: "Pendiente",
    items: [createItemRow()],
  });
  const [createResult, setCreateResult] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");

  const [addForm, setAddForm] = useState({
    orderId: "",
    items: [createItemRow()],
  });
  const [addResult, setAddResult] = useState<string>("");
  const [addError, setAddError] = useState<string>("");

  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<string>("");
  const [lookupError, setLookupError] = useState<string>("");
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);

  const [dishForm, setDishForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    supervisorId: "",
    disponible: true,
    ingredientes: [createIngredientRow()],
  });
  const [dishResult, setDishResult] = useState<string>("");
  const [dishError, setDishError] = useState<string>("");

  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    metodo: "Efectivo",
    monto: "",
    cambio: "",
  });
  const [paymentResult, setPaymentResult] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  const [statusForm, setStatusForm] = useState({
    orderId: "",
    estado: "Pagada",
  });
  const [statusResult, setStatusResult] = useState<string>("");
  const [statusError, setStatusError] = useState<string>("");

  const orderedPlatillos = useMemo(
    () =>
      [...platillos].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      ),
    [platillos],
  );

  useEffect(() => {
    fetchPlatillos();
    fetchProducts();
  }, []);

  async function fetchPlatillos() {
    setPlatillosError("");
    setLoadingPlatillos(true);
    try {
      const res = await fetch(`${API_URL}/platillos`);
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message ?? "No se pudieron obtener los platillos");
      }
      setPlatillos(data.platillos ?? []);
    } catch (err) {
      setPlatillosError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingPlatillos(false);
    }
  }

  async function fetchProducts() {
    setProductsError("");
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/inventory/products`);
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message ?? "No se pudieron obtener los productos");
      }
      const mapped: ProductOption[] = (data.products ?? []).map(
        (product: { id: number; nombre: string; unidad: string }) => ({
          id: product.id,
          nombre: product.nombre,
          unidad: product.unidad,
        }),
      );
      setProducts(mapped);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleCreateOrder() {
    setCreateError("");
    setCreateResult("");
    const itemsPayload = buildItemsPayload(createForm.items);
    if (!itemsPayload.length) {
      setCreateError("Agrega al menos un platillo con cantidad válida");
      return;
    }

    const payload = {
      mesa_id: toNumber(createForm.mesaId),
      mesero_id: toNumber(createForm.meseroId),
      estado: createForm.estado || undefined,
      items: itemsPayload,
    };

    try {
      const data = await requestJson("/orders", payload);
      setCreateResult(JSON.stringify(data, null, 2));
      if (data?.order) setLastOrder(data.order as OrderDetails);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleAddItems() {
    setAddError("");
    setAddResult("");
    const orderId = Number(addForm.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setAddError("Ingresa un ID de orden válido");
      return;
    }
    const itemsPayload = buildItemsPayload(addForm.items);
    if (!itemsPayload.length) {
      setAddError("Agrega al menos un platillo con cantidad válida");
      return;
    }

    try {
      const data = await requestJson(`/orders/${orderId}/items`, {
        items: itemsPayload,
      });
      setAddResult(JSON.stringify(data, null, 2));
      if (data?.order) setLastOrder(data.order as OrderDetails);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateDish() {
    setDishError("");
    setDishResult("");

    const nombre = dishForm.nombre.trim();
    if (!nombre) {
      setDishError("El nombre es obligatorio");
      return;
    }

    const precio = Number(dishForm.precio);
    if (!Number.isFinite(precio) || precio <= 0) {
      setDishError("El precio debe ser mayor a 0");
      return;
    }

    const ingredientesPayload = buildIngredientPayload(dishForm.ingredientes);
    const payload = {
      nombre,
      descripcion: dishForm.descripcion.trim() || undefined,
      precio,
      supervisor_id: toNumber(dishForm.supervisorId),
      disponible: dishForm.disponible,
      ingredientes: ingredientesPayload.length ? ingredientesPayload : undefined,
    };

    try {
      const data = await requestJson("/platillos", payload);
      setDishResult(JSON.stringify(data, null, 2));
      setLastOrder(null);
      setDishForm({
        nombre: "",
        descripcion: "",
        precio: "",
        supervisorId: "",
        disponible: true,
        ingredientes: [createIngredientRow()],
      });
      fetchPlatillos();
      fetchProducts();
    } catch (err) {
      setDishError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleLookupOrder() {
    setLookupError("");
    setLookupResult("");
    const orderId = Number(lookupId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setLookupError("Ingresa un ID de orden válido");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message ?? "No se encontró la orden");
      }
      setLookupResult(JSON.stringify(data, null, 2));
      setLastOrder(data.order as OrderDetails);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRegisterPayment() {
    setPaymentError("");
    setPaymentResult("");
    const orderId = Number(paymentForm.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setPaymentError("Ingresa un ID de orden válido");
      return;
    }
    const monto = Number(paymentForm.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setPaymentError("El monto debe ser mayor a 0");
      return;
    }
    const cambio = paymentForm.cambio
      ? Number(paymentForm.cambio)
      : undefined;
    if (
      cambio !== undefined &&
      (!Number.isFinite(cambio) || Number(cambio) < 0)
    ) {
      setPaymentError("El cambio debe ser un número positivo");
      return;
    }
    try {
      const data = await requestJson(`/orders/${orderId}/payments`, {
        metodo_pago: paymentForm.metodo,
        monto,
        cambio,
      });
      setPaymentResult(JSON.stringify(data, null, 2));
      if (data?.order) setLastOrder(data.order as OrderDetails);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleUpdateStatus() {
    setStatusError("");
    setStatusResult("");
    const orderId = Number(statusForm.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setStatusError("Ingresa un ID de orden válido");
      return;
    }
    if (!statusForm.estado.trim()) {
      setStatusError("Selecciona un estado válido");
      return;
    }
    try {
      const data = await requestJson(
        `/orders/${orderId}/status`,
        { estado: statusForm.estado },
        "PATCH",
      );
      setStatusResult(JSON.stringify(data, null, 2));
      if (data?.order) setLastOrder(data.order as OrderDetails);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : String(err));
    }
  }

  function buildItemsPayload(items: OrderItemInput[]) {
    return items
      .map((item) => ({
        platillo_id: Number(item.platilloId),
        cantidad: Number(item.cantidad),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.platillo_id) &&
          item.platillo_id > 0 &&
          Number.isFinite(item.cantidad) &&
          item.cantidad > 0,
      );
  }

  function buildIngredientPayload(items: PlatilloIngredientInput[]) {
    return items
      .map((item) => ({
        producto_id: Number(item.productoId),
        cantidad: Number(item.cantidad),
      }))
      .filter(
        (ingredient) =>
          Number.isInteger(ingredient.producto_id) &&
          ingredient.producto_id > 0 &&
          Number.isFinite(ingredient.cantidad) &&
          ingredient.cantidad > 0,
      );
  }

  async function requestJson(
    path: string,
    body: unknown,
    method: "POST" | "PATCH" = "POST",
  ) {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.message ?? "Operación fallida");
    }
    return data;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Playground
        </p>
        <h1 className="text-3xl font-bold">Platillos & Órdenes</h1>
        <p className="text-sm text-slate-400">
          Usa esta pantalla para probar rápidamente la API del backend sin pasar
          por el flujo completo del POS.
        </p>
      </header>

      <section className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Platillos disponibles</h2>
          <button
            type="button"
            onClick={fetchPlatillos}
            className="px-3 py-1 rounded border border-slate-500 text-xs hover:bg-slate-700 transition"
          >
            Recargar
          </button>
        </div>
        {platillosError && (
          <p className="text-sm text-red-400 mt-2">{platillosError}</p>
        )}
        <div className="overflow-auto mt-4 max-h-64 border border-slate-700 rounded">
          {loadingPlatillos ? (
            <p className="p-4 text-sm text-slate-400">Cargando...</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Precio</th>
                  <th className="px-3 py-2 text-left">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {orderedPlatillos.map((platillo) => (
                  <tr
                    key={platillo.id}
                    className="even:bg-slate-800/40 text-slate-200"
                  >
                    <td className="px-3 py-2">{platillo.id}</td>
                    <td className="px-3 py-2">{platillo.nombre}</td>
                    <td className="px-3 py-2">${platillo.precio}</td>
                    <td className="px-3 py-2">
                      {platillo.disponible ? "Sí" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold">Crear nuevo platillo</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Nombre
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={dishForm.nombre}
              onChange={(e) =>
                setDishForm((prev) => ({ ...prev, nombre: e.target.value }))
              }
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Precio
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={dishForm.precio}
              onChange={(e) =>
                setDishForm((prev) => ({ ...prev, precio: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Supervisor (opcional)
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={dishForm.supervisorId}
              onChange={(e) =>
                setDishForm((prev) => ({
                  ...prev,
                  supervisorId: e.target.value,
                }))
              }
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Disponible
            <select
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={dishForm.disponible ? "true" : "false"}
              onChange={(e) =>
                setDishForm((prev) => ({
                  ...prev,
                  disponible: e.target.value === "true",
                }))
              }
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>

        <label className="text-xs uppercase tracking-wide text-slate-400 block">
          Descripción
          <textarea
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
            rows={2}
            value={dishForm.descripcion}
            onChange={(e) =>
              setDishForm((prev) => ({ ...prev, descripcion: e.target.value }))
            }
          />
        </label>

        <IngredientsEditor
          items={dishForm.ingredientes}
          products={products}
          onChange={(ingredientes) =>
            setDishForm((prev) => ({ ...prev, ingredientes }))
          }
        />

        {productsError && (
          <p className="text-sm text-amber-400 whitespace-pre-wrap">
            {productsError}
          </p>
        )}
        {loadingProducts && (
          <p className="text-xs text-slate-400">Cargando productos...</p>
        )}

        <button
          type="button"
          onClick={handleCreateDish}
          className="w-full rounded bg-teal-500 py-2 font-semibold text-white hover:bg-teal-600 transition"
        >
          Registrar platillo
        </button>

        {dishError && (
          <p className="text-sm text-red-400 whitespace-pre-wrap">{dishError}</p>
        )}
        {dishResult && (
          <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-slate-800">
            {dishResult}
          </pre>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Crear orden</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Mesa
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={createForm.mesaId}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, mesaId: e.target.value }))
                }
              />
            </label>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Mesero
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={createForm.meseroId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    meseroId: e.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="text-xs uppercase tracking-wide text-slate-400 block">
            Estado inicial
            <select
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={createForm.estado}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, estado: e.target.value }))
              }
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En_Proceso">En Proceso</option>
              <option value="Confirmada">Confirmada</option>
            </select>
          </label>

          <ItemsEditor
            title="Ítems de la orden"
            items={createForm.items}
            platillos={orderedPlatillos}
            onChange={(items) =>
              setCreateForm((prev) => ({ ...prev, items }))
            }
          />

          <button
            type="button"
            onClick={handleCreateOrder}
            className="w-full rounded bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-600 transition"
          >
            Crear orden
          </button>
          {createError && (
            <p className="text-sm text-red-400 whitespace-pre-wrap">
              {createError}
            </p>
          )}
          {createResult && (
            <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-slate-800">
              {createResult}
            </pre>
          )}
        </div>

        <div className="space-y-4 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Agregar platillos a una orden</h3>
          <label className="text-xs uppercase tracking-wide text-slate-400 block">
            ID de orden
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
              value={addForm.orderId}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, orderId: e.target.value }))
              }
            />
          </label>

          <ItemsEditor
            title="Nuevos ítems"
            items={addForm.items}
            platillos={orderedPlatillos}
            onChange={(items) => setAddForm((prev) => ({ ...prev, items }))}
          />

          <button
            type="button"
            onClick={handleAddItems}
            className="w-full rounded bg-indigo-500 py-2 font-semibold text-white hover:bg-indigo-600 transition"
          >
            Agregar a la orden
          </button>
          {addError && (
            <p className="text-sm text-red-400 whitespace-pre-wrap">
              {addError}
            </p>
          )}
          {addResult && (
            <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-slate-800">
              {addResult}
            </pre>
          )}
        </div>
      </section>

      <section className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold">Consultar orden</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
            placeholder="ID de orden"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
          />
          <button
            type="button"
            onClick={handleLookupOrder}
            className="px-4 py-2 rounded bg-slate-200 text-slate-900 font-semibold hover:bg-white transition"
          >
            Buscar
          </button>
        </div>
        {lookupError && (
          <p className="text-sm text-red-400 whitespace-pre-wrap">
            {lookupError}
          </p>
        )}
        {lookupResult && (
          <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-64 border border-slate-800">
            {lookupResult}
          </pre>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Registrar pago</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              ID de orden
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={paymentForm.orderId}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, orderId: e.target.value }))
                }
              />
            </label>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Método de pago
              <select
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={paymentForm.metodo}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, metodo: e.target.value }))
                }
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Monto
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={paymentForm.monto}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, monto: e.target.value }))
                }
              />
            </label>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Cambio (opcional)
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={paymentForm.cambio}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, cambio: e.target.value }))
                }
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleRegisterPayment}
            className="w-full rounded bg-yellow-500 py-2 font-semibold text-slate-900 hover:bg-yellow-400 transition"
          >
            Registrar pago
          </button>
          {paymentError && (
            <p className="text-sm text-red-400 whitespace-pre-wrap">
              {paymentError}
            </p>
          )}
          {paymentResult && (
            <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-slate-800">
              {paymentResult}
            </pre>
          )}
        </div>

        <div className="space-y-4 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Actualizar estado</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              ID de orden
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={statusForm.orderId}
                onChange={(e) =>
                  setStatusForm((prev) => ({ ...prev, orderId: e.target.value }))
                }
              />
            </label>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Estado
              <select
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-slate-100"
                value={statusForm.estado}
                onChange={(e) =>
                  setStatusForm((prev) => ({ ...prev, estado: e.target.value }))
                }
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En_Proceso">En Proceso</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Pagada">Pagada</option>
                <option value="Anulada">Anulada</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleUpdateStatus}
            className="w-full rounded bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 transition"
          >
            Actualizar estado
          </button>
          {statusError && (
            <p className="text-sm text-red-400 whitespace-pre-wrap">
              {statusError}
            </p>
          )}
          {statusResult && (
            <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-slate-800">
              {statusResult}
            </pre>
          )}
        </div>
      </section>

      <section className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resumen de la última orden cargada</h3>
          {lastOrder && (
            <span className="text-xs uppercase text-slate-400">
              ID #{lastOrder.id}
            </span>
          )}
        </div>
        {!lastOrder ? (
          <p className="text-sm text-slate-400">
            Consulta una orden o crea/actualiza una para ver sus pagos e ítems.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-200">
              <p>
                <span className="text-slate-400">Mesa:</span>{" "}
                {lastOrder.mesaNumero ?? "—"}
              </p>
              <p>
                <span className="text-slate-400">Estado:</span>{" "}
                {lastOrder.estado}
              </p>
              <p>
                <span className="text-slate-400">Total:</span> $
                {lastOrder.total.toFixed(2)}
              </p>
              <p>
                <span className="text-slate-400">Pagado:</span> $
                {lastOrder.totalPagado.toFixed(2)}
              </p>
              <p>
                <span className="text-slate-400">Saldo:</span> $
                {lastOrder.saldoPendiente.toFixed(2)}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">
                Ítems
              </h4>
              <div className="overflow-auto max-h-48 border border-slate-700 rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-3 py-1 text-left">Platillo</th>
                      <th className="px-3 py-1 text-right">Cantidad</th>
                      <th className="px-3 py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastOrder.items.map((item) => (
                      <tr key={item.id} className="even:bg-slate-800/40">
                        <td className="px-3 py-1">
                          {item.platilloNombre ?? `ID ${item.id}`}
                        </td>
                        <td className="px-3 py-1 text-right">{item.cantidad}</td>
                        <td className="px-3 py-1 text-right">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">
                Pagos
              </h4>
              {lastOrder.pagos.length === 0 ? (
                <p className="text-xs text-slate-400">Sin pagos registrados.</p>
              ) : (
                <div className="overflow-auto max-h-48 border border-slate-700 rounded">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="px-3 py-1 text-left">Método</th>
                        <th className="px-3 py-1 text-right">Monto</th>
                        <th className="px-3 py-1 text-right">Cambio</th>
                        <th className="px-3 py-1 text-left">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastOrder.pagos.map((pago) => (
                        <tr key={pago.id} className="even:bg-slate-800/40">
                          <td className="px-3 py-1">{pago.metodoPago}</td>
                          <td className="px-3 py-1 text-right">
                            ${pago.monto.toFixed(2)}
                          </td>
                          <td className="px-3 py-1 text-right">
                            {pago.cambio !== null
                              ? `$${pago.cambio.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-3 py-1">
                            {pago.fecha
                              ? new Date(pago.fecha).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default OrdersPlayground;
