import type { User } from "../types";
import Separator from "../../src/components/separator";
import DishCard from "../../src/components/ui/Dishcard";
import Modal from "../../src/components/ui/modal";
import { useEffect, useState } from "react";
import SearchBar from "../../src/components/ui/searchBar"
import Button from "../../src/components/ui/button"

type SupervisorDishesProps = {
  user: User;
  logout: () => void;
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
  cantidadPreparable: 0
};

const API_URL = "/api";

export function Dishes({ user, logout }: SupervisorDishesProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishToEdit, setDishToEdit] = useState<Dish>(EMPTY_DISH);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const fetchDishes = async () => {
    try {
      const res = await fetch(API_URL + "/platillos");
      const data = await res.json();
      setDishes(data.platillos);
    } catch (error) {
      console.error("Error al cargar platillos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
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
      });
    setIsEditModalOpen(true);
  }

  const openEditFromInfoModal = () => {
    if (!selectedDish) return;
    setDishToEdit(selectedDish);
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

    const payload = {
      nombre: dishToEdit.nombre,
      descripcion: dishToEdit.descripcion,
      precio: dishToEdit.precio,
      disponible: dishToEdit.disponible,
      imagen_url: dishToEdit.imagenUrl,
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

  if (loading) return <p className="p-6">Cargando platillos...</p>;

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
          <span className=" text-3xl manrope-bold">Platos</span>
        </div>
        <Separator />
      </div>
      <div className="flex mx-10 pb-10 items-center justify-between">
        <div className="w-[30vh]">
          <SearchBar
            type="text"
            placeholder="Buscar tu platillo"
            className="w-full sm:w-auto shadow-2xl"
          />
        </div>
        <div className="flex justify-end w-[20vh]">
          <Button
            className=" text-s"
            onClick={openCreateModal}
          >
            Nuevo patillo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-22 p-10 place-items-center ">
        {dishes.map((dish) => (
          <DishCard
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
        title={selectedDish?.nombre ?? ""}
      >
        {selectedDish ? (
          <div className="space-y-4">
            <p><strong>Nombre:</strong> {selectedDish.nombre}</p>
            <p><strong>Descripción:</strong> {selectedDish.descripcion}</p>
            <p><strong>Precio:</strong> ${selectedDish.precio}</p>
            <p><strong>Disponible:</strong> {selectedDish.disponible ? "Sí" : "No"}</p>
            <div>
              <strong>Ingredientes:</strong>
              <ul className="list-disc ml-6 mt-2">
                {selectedDish.ingredientes.map((ing) => (
                  <li key={ing.id}>
                    {ing.productoNombre} — {ing.cantidad} {ing.productoUnidad}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          "Cargando..."
        )}
        <Button
          className="mt-4"
          onClick={openEditFromInfoModal}
        >
          Editar platillo
        </Button>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={dishToEdit?.id ? "Editar Platillo" : "Nuevo Platillo"}
      >
        <div className="flex flex-col gap-4">

          <input
            className="p-2 rounded bg-[var(--background-alt)]"
            placeholder="Nombre"
            value={dishToEdit.nombre}
            onChange={(e) => setDishToEdit({ ...dishToEdit, nombre: e.target.value })}
          />

          <input
            type="number"
            className="p-2 rounded bg-[var(--background-alt)]"
            placeholder="Precio"
            value={dishToEdit.precio}
            onChange={(e) => setDishToEdit({ ...dishToEdit, precio: Number(e.target.value) || 0 })}
          />

          <textarea
            className="p-2 rounded bg-[var(--background-alt)]"
            placeholder="Descripción"
            value={dishToEdit.descripcion ?? ""}
            onChange={(e) => setDishToEdit({ ...dishToEdit, descripcion: e.target.value })}
          />

          <input
            className="p-2 rounded bg-[var(--background-alt)]"
            placeholder="URL de la imagen"
            value={dishToEdit.imagenUrl ?? ""}
            onChange={(e) => setDishToEdit({ ...dishToEdit, imagenUrl: e.target.value })}
          />

          <Button className="mt-4" onClick={saveChanges}>
            Guardar cambios
          </Button>

        </div>
      </Modal>

    </div>
  );

}
export default Dishes;