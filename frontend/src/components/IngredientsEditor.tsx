import React, { useId } from "react";
import Button from "./ui/button";

export interface ProductOption {
    id: number;
    nombre: string;
    unidad: string;
}

export interface IngredientInput {
    key: string;
    productoId: string;
    cantidad: string;
}

interface IngredientsEditorProps {
    items: IngredientInput[];
    onChange: (next: IngredientInput[]) => void;
    products: ProductOption[];
}

export function createIngredientRow(): IngredientInput {
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto;
    const key = random
        ? (crypto as Crypto).randomUUID()
        : `${Date.now()}-${Math.random()}`;
    return { key, productoId: "", cantidad: "" };
}

export function IngredientsEditor({ items, onChange, products }: IngredientsEditorProps) {
    const datalistId = useId();

    const updateItem = (key: string, patch: Partial<IngredientInput>) => {
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
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Ingredientes
                </h4>
                <Button
                    type="button"
                    onClick={addItem}
                    className="text-xs px-3 py-1"
                >
                    Agregar ingrediente
                </Button>
            </div>
            {items.map((item) => (
                <div key={item.key} className="flex flex-wrap gap-2 items-center">
                    <input
                        list={datalistId}
                        className="flex-1 min-w-[120px] rounded bg-[var(--background-alt)] p-2 text-sm text-[var(--text-primary)]"
                        placeholder="ID producto"
                        value={item.productoId}
                        onChange={(e) =>
                            updateItem(item.key, { productoId: e.target.value })
                        }
                    />
                    <input
                        className="w-32 rounded bg-[var(--background-alt)] p-2 text-sm text-[var(--text-primary)]"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) =>
                            updateItem(item.key, { cantidad: e.target.value })
                        }
                    />
                    <Button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Quitar
                    </Button>
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
