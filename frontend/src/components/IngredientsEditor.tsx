import { useId } from "react";
import { Plus, Trash } from "lucide-react";

export interface ProductOption {
    id: number;
    nombre: string;
    unidad: string;
}

export interface IngredientInput {
    key: string;
    productoId: number | null ;
    cantidad: string;
}

interface IngredientsEditorProps {
    items: IngredientInput[];
    onChange: (next: IngredientInput[]) => void;
    products: ProductOption[];
}

export function createIngredientRow(): IngredientInput {
    return { key:  crypto.randomUUID(),
            productoId: null, 
            cantidad: "" 
        };
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
                {items.map((item) => {
                    return(
                <div key={item.key} className="flex flex-wrap gap-2 items-center justify-center">
                        <select
                            className="flex-1 min-w-[120px] p-2 bg-[var(--secondary)] border border-[var(--text-primary)] rounded-lg manrope-light"
                            value={item.productoId ?? ""}
                            onChange={(e) => 
                                updateItem(item.key, { productoId: Number(e.target.value) || null })
                            }
                        >
                            <option value="">Seleccionar producto...</option>

                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} ({p.unidad})
                                </option>
                            ))}
                        </select>
                    <input
                        className="w-32 p-2 bg-[var(--secondary)] border border-bg-[var(--text-primary)] rounded-lg manrope-light"
                        placeholder={"Cantidad"}
                        value={item.cantidad}
                        onChange={(e) =>
                            updateItem(item.key, { cantidad: e.target.value })
                        }
                    />
                    
                    <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                    >
                        <Trash className="hover:text-[var(--warning)]"/>
                    </button>
                </div>
                    );
                })}

                <div className="flex justify-end mt-4" >
                    <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center justify-center 
                    shadow-2xl 
                    bg-[var(--primary)]/80
                    p-1
                    text-[var(--options)] text-sm rounded-lg  
                    cursor-pointer 
                    manrope-regular 
                    transition duration-150 ease-in-out 
                    hover:shadow-inner hover:shadow-black/20 hover:scale-[0.99] active:scale-[0.98]
                    gap-0.5"
                >
                    <Plus  size={16}/> Añadir ingrediente
                </button>
                </div>
                

            <datalist id={datalistId}>
                {products.map((product) => (
                    <option
                        key={product.id}
                        value={product.nombre}
                    >{` (${product.unidad})`}</option>
                ))}
            </datalist>
        </div>
    );
}
