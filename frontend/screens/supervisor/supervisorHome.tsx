import { useCallback, useEffect, useState } from "react";
import type { InventoryCategory, InventoryProduct, User } from "../types";
import Separator from "../../src/components/separator";
import logo from "../../assets/logo.png";
import Modal from "../../src/components/ui/modal";
import Button from "../../src/components/ui/button";
import Input from "../../src/components/ui/input";

type SupervisorHomeProps = {
  user: User;
  logout: () => void;
};

type AdjustMode = "add" | "remove";

type AdjustState = {
  product: InventoryProduct | null;
  mode: AdjustMode;
};

type InventoryResponse =
  | { ok: true; products: InventoryProduct[] }
  | { ok: false; message?: string };

type ProductResponse =
  | { ok: true; product: InventoryProduct }
  | { ok: false; message?: string };

type CategoriesResponse =
  | { ok: true; categories: InventoryCategory[] }
  | { ok: false; message?: string };

const initialCreateForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  unidad: "pza",
  cantidad_inicial: "",
  nivel_minimo: "",
  categoria_id: "",
};

async function parseResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function SupervisorHome({ user, logout }: SupervisorHomeProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [adjustModal, setAdjustModal] = useState<AdjustState>({
    product: null,
    mode: "add",
  });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setInventoryError(null);
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/inventory/products");
      const body = await parseResponse<InventoryResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? "No se pudo obtener el inventario");
      }
      setProducts(body.products ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cargar inventario";
      setInventoryError(message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const fetchCategories = useCallback(async () => {
    setCategoriesError(null);
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/inventory/categories");
      const body = await parseResponse<CategoriesResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(
          body?.message ?? "No se pudieron obtener las categorías",
        );
      }
      setCategories(body.categories ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al obtener categorías";
      setCategoriesError(message);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateModalOpen(false);
  };

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const nombre = createForm.nombre.trim();
    if (!nombre) {
      setCreateError("El nombre es obligatorio");
      return;
    }

    const bodyPayload: Record<string, unknown> = { nombre };
    if (createForm.descripcion.trim()) {
      bodyPayload.descripcion = createForm.descripcion.trim();
    }
    if (createForm.precio) {
      const precio = Number(createForm.precio);
      if (Number.isNaN(precio) || precio < 0) {
        setCreateError("El precio debe ser mayor o igual a 0");
        return;
      }
      bodyPayload.precio = precio;
    }
    if (createForm.unidad.trim()) {
      bodyPayload.unidad = createForm.unidad.trim();
    }
    if (createForm.categoria_id) {
      const categoriaId = Number(createForm.categoria_id);
      if (Number.isNaN(categoriaId)) {
        setCreateError("La categoría seleccionada es inválida");
        return;
      }
      bodyPayload.categoria_id = categoriaId;
    }
    if (createForm.cantidad_inicial) {
      const qty = Number(createForm.cantidad_inicial);
      if (Number.isNaN(qty) || qty < 0) {
        setCreateError("La cantidad inicial debe ser mayor o igual a 0");
        return;
      }
      bodyPayload.cantidad_inicial = qty;
    }
    if (createForm.nivel_minimo) {
      const level = Number(createForm.nivel_minimo);
      if (Number.isNaN(level) || level < 0) {
        setCreateError("El nivel mínimo debe ser mayor o igual a 0");
        return;
      }
      bodyPayload.nivel_minimo = level;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const body = await parseResponse<ProductResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? "No se pudo crear el producto");
      }
      resetCreateForm();
      await fetchInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear el producto";
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openAdjustModal = (product: InventoryProduct, mode: AdjustMode) => {
    setAdjustModal({ product, mode });
    setAdjustAmount("");
    setAdjustError(null);
  };

  const closeAdjustModal = () => {
    setAdjustModal({ product: null, mode: "add" });
    setAdjustAmount("");
    setAdjustError(null);
  };

  const handleAdjustSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!adjustModal.product) return;

    const parsedAmount = Number(adjustAmount);
    if (!adjustAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setAdjustError("Ingresa una cantidad válida mayor a 0");
      return;
    }

    const currentQty = adjustModal.product.inventario.cantidadDisponible;
    const delta = adjustModal.mode === "add" ? parsedAmount : -parsedAmount;
    const nextQty = Number((currentQty + delta).toFixed(3));

    if (nextQty < 0) {
      setAdjustError("No hay suficiente inventario para retirar esa cantidad");
      return;
    }

    setAdjustLoading(true);
    setAdjustError(null);

    try {
      const res = await fetch(`/api/inventory/products/${adjustModal.product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad_disponible: nextQty }),
      });
      const body = await parseResponse<ProductResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? "No se pudo actualizar el inventario");
      }
      closeAdjustModal();
      await fetchInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el inventario";
      setAdjustError(message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const isAdjustModalOpen = Boolean(adjustModal.product);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="m-10">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          <div className="flex flex-col">
            <span className="text-xl manrope-bold">{user.nombre}</span>
            <span className="text-sm text-[var(--text-secondary)]">Supervisor</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={logout}
              className="text-sm underline underline-offset-2 hover:opacity-80"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <Separator />
      </div>

      <div className="flex-1 px-6 pb-10">
        <div className="bg-[var(--secondary)] rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl manrope-bold">Inventario</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Revisa existencias y realiza ajustes rápidos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void fetchInventory()}
                className="px-4 py-2 rounded-lg border border-[var(--text-primary)] text-sm hover:bg-white/10 transition"
              >
                Actualizar
              </button>
              <Button
                type="button"
                className="!w-auto px-6"
                onClick={() => setCreateModalOpen(true)}
              >
                Nuevo producto
              </Button>
            </div>
          </div>

          {inventoryError && (
            <div className="rounded-md bg-red-100/80 text-red-800 px-4 py-2 text-sm">
              {inventoryError}
            </div>
          )}

          {loadingProducts ? (
            <p className="text-sm text-[var(--text-secondary)]">Cargando inventario...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No hay productos registrados todavía.
            </p>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => {
                const nivelMinimo = product.inventario.nivelMinimo ?? 0;
                const lowStock =
                  nivelMinimo > 0 &&
                  product.inventario.cantidadDisponible <= nivelMinimo;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10 rounded-xl p-4 bg-[var(--secondary-accent)]"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg manrope-bold">{product.nombre}</h3>
                      {product.categoriaNombre && (
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] manrope-bold">
                          {product.categoriaNombre}
                        </p>
                      )}
                      <p className="text-sm text-[var(--text-secondary)]">
                        {product.descripcion ?? "Sin descripción"}
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="manrope-bold">
                          Disponibles: {product.inventario.cantidadDisponible} {product.unidad}
                        </span>
                        {lowStock && (
                          <span className="ml-3 text-[var(--warning)]">
                            Bajo inventario (mínimo {nivelMinimo})
                          </span>
                        )}
                      </div>
                      {product.inventario.nivelMinimo !== null && !lowStock && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          Nivel mínimo: {nivelMinimo} {product.unidad}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openAdjustModal(product, "add")}
                        className="px-4 py-2 rounded-lg bg-[var(--confirmation)] text-[var(--text-buttons)] text-sm hover:opacity-90 transition"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => openAdjustModal(product, "remove")}
                        className="px-4 py-2 rounded-lg bg-[var(--warning)] text-[var(--text-buttons)] text-sm hover:opacity-90 transition"
                      >
                        Retirar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={resetCreateForm}
        title="Registrar producto"
        width="max-w-3xl"
      >
        <form
          className="flex flex-col gap-4 items-center"
          onSubmit={handleCreateSubmit}
        >
          <Input
            placeholder="Nombre"
            value={createForm.nombre}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            required
          />
          <Input
            placeholder="Descripción (opcional)"
            value={createForm.descripcion}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                descripcion: e.target.value,
              }))
            }
          />
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-between">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={createForm.precio}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, precio: e.target.value }))
              }
            />
            <Input
              placeholder="Unidad (ej. kg, pza)"
              value={createForm.unidad}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, unidad: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="text-sm mb-1 manrope-bold">
              Categoría
              <span className="ml-1 text-xs text-[var(--text-secondary)]">
                (opcional)
              </span>
            </label>
            <select
              value={createForm.categoria_id}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  categoria_id: e.target.value,
                }))
              }
              className="bg-[var(--options)] text-[var(--text-primary)] rounded-lg px-4 h-[45px] sm:h-[55px] shadow-2xl text-sm manrope-regular"
            >
              <option value="">
                {loadingCategories
                  ? "Cargando categorías..."
                  : "Sin categoría"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-between">
            <Input
              type="number"
              min="0"
              step="0.001"
              placeholder="Cantidad inicial"
              value={createForm.cantidad_inicial}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  cantidad_inicial: e.target.value,
                }))
              }
            />
            <Input
              type="number"
              min="0"
              step="0.001"
              placeholder="Nivel mínimo"
              value={createForm.nivel_minimo}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  nivel_minimo: e.target.value,
                }))
              }
            />
          </div>

          {createError && (
            <p className="text-sm text-[var(--warning)]">{createError}</p>
          )}
          {categoriesError && (
            <p className="text-sm text-[var(--warning)]">
              {categoriesError}
            </p>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <Button type="submit" disabled={createLoading}>
              {createLoading ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" onClick={resetCreateForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={closeAdjustModal}
        title={
          adjustModal.mode === "add" ? "Agregar inventario" : "Retirar inventario"
        }
        width="max-w-lg"
      >
        {adjustModal.product && (
          <form className="flex flex-col gap-4" onSubmit={handleAdjustSubmit}>
            <p className="text-sm text-[var(--text-secondary)] manrope-regular">
              Producto:{" "}
              <span className="manrope-bold text-[var(--text-primary)]">
                {adjustModal.product.nombre}
              </span>
            </p>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder={`Cantidad a ${
                adjustModal.mode === "add" ? "agregar" : "retirar"
              }`}
              required
            />
            {adjustError && (
              <p className="text-sm text-[var(--warning)]">{adjustError}</p>
            )}
            <div className="flex gap-4 justify-center">
              <Button type="submit" disabled={adjustLoading}>
                {adjustLoading ? "Aplicando..." : "Confirmar"}
              </Button>
              <Button type="button" onClick={closeAdjustModal}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
