import { useCallback, useEffect, useState } from "react";
import type { InventoryCategory, InventoryProduct, User } from "../types";
import Separator from "../../src/components/separator";
import logo from "../../assets/logo.png";
import Modal from "../../src/components/ui/modal";
import Button from "../../src/components/ui/button";
import Input from "../../src/components/ui/input";
import SearchBar from "../../src/components/ui/searchBar";
import { Pencil, Trash2 } from "lucide-react";

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

type BasicResponse = { ok: boolean; message?: string };

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

const initialEditForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  unidad: "",
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

function getResponseMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export function SupervisorHome({ user, logout }: SupervisorHomeProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  const [editModalProduct, setEditModalProduct] = useState<InventoryProduct | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setInventoryError(null);
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/inventory/products");
      const body = await parseResponse<InventoryResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(getResponseMessage(body) ?? "No se pudo obtener el inventario");
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
          getResponseMessage(body) ?? "No se pudieron obtener las categorías",
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

  useEffect(() => {
    if (editModalProduct) {
      setEditForm({
        nombre: editModalProduct.nombre,
        descripcion: editModalProduct.descripcion ?? "",
        precio: editModalProduct.precio ? String(editModalProduct.precio) : "",
        unidad: editModalProduct.unidad ?? "",
        nivel_minimo:
          editModalProduct.inventario.nivelMinimo !== null
            ? String(editModalProduct.inventario.nivelMinimo)
            : "",
        categoria_id: editModalProduct.categoriaId
          ? String(editModalProduct.categoriaId)
          : "",
      });
      setEditError(null);
    } else {
      setEditForm(initialEditForm);
    }
  }, [editModalProduct]);

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
        throw new Error(getResponseMessage(body) ?? "No se pudo crear el producto");
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

  const openEditModal = (product: InventoryProduct) => {
    setEditModalProduct(product);
  };

  const closeEditModal = () => {
    setEditModalProduct(null);
    setEditError(null);
  };

  const openDeleteModal = (product: InventoryProduct) => {
    setDeleteTarget(product);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
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
        throw new Error(getResponseMessage(body) ?? "No se pudo actualizar el inventario");
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

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editModalProduct) return;

    const trimmedName = editForm.nombre.trim();
    if (!trimmedName) {
      setEditError("El nombre es obligatorio");
      return;
    }

    const payload: Record<string, unknown> = {};
    if (trimmedName !== editModalProduct.nombre) {
      payload.nombre = trimmedName;
    }

    const trimmedDescription = editForm.descripcion.trim();
    if (trimmedDescription !== (editModalProduct.descripcion ?? "")) {
      payload.descripcion = trimmedDescription;
    }

    if (editForm.precio) {
      const precio = Number(editForm.precio);
      if (Number.isNaN(precio) || precio < 0) {
        setEditError("El precio debe ser mayor o igual a 0");
        return;
      }
      if (precio !== editModalProduct.precio) {
        payload.precio = precio;
      }
    } else if (editModalProduct.precio !== 0) {
      payload.precio = 0;
    }

    const unidad = editForm.unidad.trim();
    if (!unidad) {
      setEditError("La unidad es obligatoria");
      return;
    }
    if (unidad !== editModalProduct.unidad) {
      payload.unidad = unidad;
    }

    const nivelValue = editForm.nivel_minimo ? Number(editForm.nivel_minimo) : null;
    if (nivelValue !== null && (Number.isNaN(nivelValue) || nivelValue < 0)) {
      setEditError("El nivel mínimo debe ser mayor o igual a 0");
      return;
    }
    const previousLevel = editModalProduct.inventario.nivelMinimo;
    if (nivelValue !== previousLevel) {
      payload.nivel_minimo = nivelValue;
    }

    if (editForm.categoria_id) {
      const categoriaId = Number(editForm.categoria_id);
      if (Number.isNaN(categoriaId)) {
        setEditError("La categoría seleccionada es inválida");
        return;
      }
      if (categoriaId !== editModalProduct.categoriaId) {
        payload.categoria_id = categoriaId;
      }
    } else if (editModalProduct.categoriaId !== null) {
      payload.categoria_id = null;
    }

    if (Object.keys(payload).length === 0) {
      setEditError("No hay cambios para aplicar");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/inventory/products/${editModalProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await parseResponse<ProductResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(getResponseMessage(body) ?? "No se pudo actualizar el producto");
      }
      closeEditModal();
      await fetchInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el producto";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/inventory/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = await parseResponse<BasicResponse>(res);
      if (!res.ok || !body?.ok) {
        throw new Error(getResponseMessage(body) ?? "No se pudo eliminar el producto");
      }
      closeDeleteModal();
      await fetchInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el producto";
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isAdjustModalOpen = Boolean(adjustModal.product);
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      product.nombre.toLowerCase().includes(term) ||
      (product.categoriaNombre ?? "").toLowerCase().includes(term)
    );
  });

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

          <SearchBar
            placeholder="Buscar por nombre o categoría"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {inventoryError && (
            <div className="rounded-md bg-red-100/80 text-red-800 px-4 py-2 text-sm">
              {inventoryError}
            </div>
          )}

          {loadingProducts ? (
            <p className="text-sm text-[var(--text-secondary)]">Cargando inventario...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {products.length === 0
                ? "No hay productos registrados todavía."
                : "No encontramos productos que coincidan con tu búsqueda."}
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product) => {
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
                    <div className="flex gap-2 flex-wrap items-center">
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
                      <button
                        onClick={() => openEditModal(product)}
                        title="Editar producto"
                        className="p-2 rounded-full border border-white/20 text-[var(--text-primary)] hover:bg-white/10 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        title="Eliminar producto"
                        className="p-2 rounded-full border border-white/20 text-[var(--warning)] hover:bg-white/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
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
        isOpen={Boolean(editModalProduct)}
        onClose={closeEditModal}
        title="Editar producto"
        width="max-w-3xl"
      >
        {editModalProduct && (
          <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
            <Input
              placeholder="Nombre"
              value={editForm.nombre}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, nombre: event.target.value }))
              }
              required
            />
            <Input
              placeholder="Descripción"
              value={editForm.descripcion}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  descripcion: event.target.value,
                }))
              }
            />
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio"
                value={editForm.precio}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    precio: event.target.value,
                  }))
                }
                required
              />
              <Input
                placeholder="Unidad"
                value={editForm.unidad}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    unidad: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <select
                value={editForm.categoria_id}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    categoria_id: event.target.value,
                  }))
                }
                className="flex-1 bg-[var(--options)] text-[var(--text-primary)] rounded-lg px-4 h-[45px] shadow-2xl text-sm manrope-regular"
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="Nivel mínimo"
                value={editForm.nivel_minimo}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    nivel_minimo: event.target.value,
                  }))
                }
              />
            </div>
            {editError && (
              <p className="text-sm text-[var(--warning)]">{editError}</p>
            )}
            <div className="flex gap-4 justify-center">
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button type="button" onClick={closeEditModal}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={closeDeleteModal}
        title="Eliminar producto"
        width="max-w-lg"
      >
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Seguro que deseas eliminar
              <span className="ml-1 manrope-bold text-[var(--text-primary)]">
                {deleteTarget.nombre}
              </span>? Esta acción es permanente.
            </p>
            {deleteError && (
              <p className="text-sm text-[var(--warning)]">{deleteError}</p>
            )}
            <div className="flex gap-4 justify-center">
              <Button type="button" onClick={handleDeleteProduct} disabled={deleteLoading}>
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button type="button" onClick={closeDeleteModal}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
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
