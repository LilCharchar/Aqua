import type { User } from "../types";
import Separator from "../../src/components/separator";
import DishCard from "../../src/components/ui/Dishcard";
import Modal from "../../src/components/ui/modal";
import { useEffect, useState } from "react";
import SearchBar from "../../src/components/ui/searchBar"
import Button from "../../src/components/ui/button"
import { uploadImage } from "../../src/lib/supabase/uploadImage";
import { RotateCw } from "lucide-react"
import {X} from "lucide-react"
import { IngredientsEditor, createIngredientRow, type IngredientInput, type ProductOption } from "../../src/components/IngredientsEditor";

type SupervisorDishesProps = {
  user: User;
};

type DishIngredient = {
  id: number;
  productoId: number | null;
  productoNombre: string | null;
  productoUnidad: string | null;
  cantidad: number;
};

type Dish = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagenUrl: string | null;
  supervisorId?: number | null;
  supervisorNombre: string | null;
  creadoEn: string | null;
  ingredientes: DishIngredient[];
  cantidadPreparable: number;
  ingredientInputs?: IngredientInput[];
};

const EMPTY_DISH: Dish = {
  id: 0,
  nombre: "",
  descripcion: "",
  precio: 0,
  disponible: true,
  imagenUrl: "",
  supervisorNombre: null, // Se llenará con el nombre del usuario
  creadoEn: null,
  ingredientes: [],
  cantidadPreparable: 0,
  ingredientInputs: [createIngredientRow()]
};

const API_URL = "/api";

export function Dishes({ user }: SupervisorDishesProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishToEdit, setDishToEdit] = useState<Dish>(EMPTY_DISH);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);


  const fetchDishes = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_URL + "/platillos");
      const data = await res.json();
      setDishes(data.platillos);
    } catch (error) {
      console.error("Error al cargar platillos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      
      const res = await fetch(API_URL + "/inventory/products");
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          unidad: p.unidad
        })));
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchProducts();
  }, []);

  const openInfoModal = async (id: number) => {
    try {
      const res = await fetch(API_URL + `/platillos/${id}`);
      const data = await res.json();
      setSelectedDish(data.platillo);
      setIsInfoModalOpen(true);
    } catch (error) {
      console.error("Error al obtener info del platillo:", error);
    }
  };

  const openCreateModal = () => {
    //Inicilizo DishToEdit para crear un nuevo plato
    setDishToEdit(
      {
        ...EMPTY_DISH,
        supervisorNombre: user.nombre,
        ingredientInputs: [createIngredientRow()]
      });
    setIsEditModalOpen(true);
  }

  const openEditFromInfoModal = () => {
    if (!selectedDish) return;

    const inputs: IngredientInput[] = selectedDish.ingredientes.map((ing) => ({
      key: `${ing.id}-${Date.now()}`,
      productoId: ing.productoId,
      cantidad: ing.cantidad.toString(),
    }));

    if (inputs.length === 0) {
      inputs.push(createIngredientRow());
    }

    setDishToEdit({
      ...selectedDish,
      ingredientInputs: inputs
    });
    setIsInfoModalOpen(false);
    setIsEditModalOpen(true);
  };


  const saveChanges = async () => {

    if (!dishToEdit || !dishToEdit.nombre || dishToEdit.precio <= 0) {
      alert("Por favor, complete todos los campos requeridos (Nombre y Precio).");
      return;
    }

    const method = dishToEdit.id === 0 ? "POST" : "PATCH";
    const url = method === "POST" ? API_URL + "/platillos" : API_URL + `/platillos/${dishToEdit.id}`;

    const validIngredients = dishToEdit.ingredientInputs
      ?.filter(i => i.productoId && Number(i.cantidad) > 0)
      .map(i => ({
        producto_id: Number(i.productoId),
        cantidad: Number(i.cantidad)
      }));

    const payload = {
      nombre: dishToEdit.nombre,
      descripcion: dishToEdit.descripcion,
      precio: dishToEdit.precio,
      disponible: dishToEdit.disponible,
      imagen_url: dishToEdit.imagenUrl,
      ingredientes: validIngredients,
      // Solo se envía el supervisorId/Nombre si es una creación, o si se necesita en el PATCH
      ...(method === "POST" && { supervisorNombre: user.nombre }),
    };

    try {
      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Recargar la lista de platos después de guardar
      await fetchDishes();

      // Cerrar y limpiar estados
      setIsEditModalOpen(false);
      setDishToEdit(EMPTY_DISH);
      setSelectedDish(null);

    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }

  };

  const deleteDish = async () => {
    if (!dishToEdit.id) return;

    try {
      await fetch(API_URL + `/platillos/${dishToEdit.id}`, { method: 'DELETE' });
      await fetchDishes();
      setIsEditModalOpen(false);
      setDishToEdit(EMPTY_DISH);
      setSelectedDish(null);
    } catch (error) {
      console.error("Error al eliminar platillo:", error);
    }
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if (!file) return;

    try{
        const preview = URL.createObjectURL(file);
        setDishToEdit(prev => ({ ...prev, imagenUrl: preview}));

        const url = await uploadImage(file)

        setDishToEdit(prev =>({...prev, imagenUrl: url}));
    }catch(err){
      console.error(err)
      alert("error subiendo la imagen")
    }

  }

const filteredDishes = dishes
  .filter(dish => {
    if (filter === "available") return dish.cantidadPreparable > 0;
    if (filter === "unavailable") return dish.cantidadPreparable === 0;
    return true;
  })
  .filter(dish =>
    dish.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && dishes.length === 0) return <p className="p-6">Cargando platillos...</p>;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)] manrope-medium">
      <div className="m-10">
        <div className="flex items-center gap-4">
          <span className="text-xl manrope-bold">{user.nombre}</span>
          <div className="ml-auto">
            <span className="text-s text-[var(--text-primary)]">Supervisor</span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <span className=" text-3xl manrope-bold">Platos</span>
        </div>
        <Separator />
      </div>
      <div className="flex mx-10 pb-10 items-center justify-between">
        <div className="w-[30vh] flex items-center gap-2">
          <SearchBar
            type="text"
            placeholder="Buscar tu platillo"
            className="w-full sm:w-auto shadow-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="text-sm"
            onClick={fetchDishes}
          >
            <RotateCw size={20} className={isLoading?"animate-spin" : ""}/>
          </button>
        </div>
        <div className="flex justify-end w-[50vh] gap-4">
          <select
            className="  p-2 bg-[var(--options)] border border-[var(--text-primary)] text-[var(--text-primary)] rounded-2xl"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No Disponibles</option>
          </select>
          <Button
            className=" text-s"
            onClick={openCreateModal}
          >
            Nuevo patillo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-22 p-10 place-items-center ">
        {filteredDishes.map((dish) => (
          <DishCard
            key={dish.id}
            name={dish.nombre}
            precio={dish.precio}
            disponible={dish.disponible}
            cantidadPreparable={dish.cantidadPreparable}
            hasIngredients={dish.ingredientes.length > 0}
            imageURL={dish.imagenUrl ?? undefined}
            onClick={() => openInfoModal(dish.id)}

          />
        ))}
      </div>
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      >
        {selectedDish ? (
          <div className="flex flex-col m-5 gap-4 mt-0">
            <div className=" relative flex items-center justify-center w-full">
              <p className="manrope-bold text-center w-full text-2xl">{selectedDish?.nombre ?? ""}</p>
              <button
                className=" absolute right-0 text-[var(--primary)] text-xs underline hover:scale-105 hover:cursor-pointer tansition-transform duration-200"
                onClick={openEditFromInfoModal}
                >
                  Editar
              </button>
            </div>
            <div className="flex items-center gap-6 ">
              <img className=' h-40 w-50 rounded-4xl'src={selectedDish.imagenUrl ?? undefined}/>
              <p> {selectedDish.descripcion}</p>
            </div>
            <div>
              <p className="manrope-bold text-2xl">Ingredientes</p>
              <ul className="mt-2">
                {selectedDish.ingredientes.map((ing) => (
                  <li key={ing.id}>
                    <div className="flex manrope-light text-sm text-[var(--text-secondary)] justify-between">
                      <p>{ing.productoNombre}</p>
                      <p className=""> {ing.cantidad} {ing.productoUnidad}</p>
                    </div>
                    <div className="bg-[var(--text-primary)]/60 h-[1.5px] w-full mt-1 mb-2"></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          "Cargando..."
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        
        closeOnBackdrop={false}
      >
        <div className="flex flex-col gap-4">
          <div className="relative flex items-center justify-center mb-2">
            <h2 className=" manrope-bold text-2xl">
              {dishToEdit?.id ? "Editar Platillo" : "Nuevo Platillo"}
            </h2>

            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2  p-1 hover:bg-[var(--warning)]/80 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className=" flex w-full justify-between items-center">
            <input
              className="p-2 h-10 w-1/2  bg-[var(--background-alt)] border border-bg-[var(--text-primary)] rounded-lg"
              placeholder="Nombre"
              value={dishToEdit.nombre}
              onChange={(e) => setDishToEdit({ ...dishToEdit, nombre: e.target.value })}
            />
            <div className="flex flex-col gap-2 w-1/2 justify-center items-center">
              <label>Imagen del platillo</label>
              {dishToEdit.imagenUrl &&(
                <img
                  src={dishToEdit.imagenUrl}
                  alt="vista previa"
                  className="w-40 h-30 object-cover rounded "
                />
              )} 
              <label className="cursor-pointer bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm">
                Subir imagen
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              </label>
            </div>
          </div>
          <textarea
            className=" p-2  border border-bg-[var(--text-primary)] rounded-lg"
            placeholder="Descripción"
            value={dishToEdit.descripcion ?? ""}
            onChange={(e) => setDishToEdit({ ...dishToEdit, descripcion: e.target.value })}
          />
          <div className="flex flex-col">
            <label className="text-[var(--text-secundary)] manrope-light text-xs">
              Precio
            </label>
              <input
                className="p-2  border border-bg-[var(--text-primary)] rounded-lg"
                placeholder="Precio"
                value={dishToEdit.precio}
                onChange={(e) => setDishToEdit({ ...dishToEdit, precio: Number(e.target.value) || 0 })}
              />
          </div>
          <div>
            <label className="text-[var(--text-secundary)] manrope-light text-xs">
              Ingredientes
            </label>
          <div className="bg-[var(--secondary-accent)] border border-[var(--text-primary)] rounded-lg p-3 max-h-65 overflow-y-auto table-scroll-area">

            <IngredientsEditor
              items={dishToEdit.ingredientInputs ?? []}
              products={products}
              onChange={(inputs) => setDishToEdit({ ...dishToEdit, ingredientInputs: inputs })}
            />
          </div>
          </div>



          <div className={`flex items-center mt-4 ${dishToEdit.id !== 0 ? "justify-between" : "justify-center"}`}>
            {dishToEdit.id !== 0 && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={saveChanges}>
              Guardar cambios
            </Button>
          </div>

        </div>
      </Modal>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Confirmar eliminacion"
      >
          <div className="flex flex-col gap-4 p-4 pt-0">
    <p className="text-sm text-[var(--text-primary)]">
      ¿Estás seguro de que deseas eliminar <b>{dishToEdit?.nombre}</b>?  
      Esta acción no se puede deshacer.
    </p>

    <div className="flex justify-end gap-3">
      <Button
        className="bg-gray-300 text-black hover:bg-gray-400"
        onClick={() => setConfirmDeleteOpen(false)}
      >
        Cancelar
      </Button>

      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => {
          deleteDish();           
          setConfirmDeleteOpen(false); 
          setIsEditModalOpen(false);   
        }}
      >
        Eliminar
      </Button>
    </div>
  </div>



      </Modal>






    </div>
  );

}
export default Dishes;
