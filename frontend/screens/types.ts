export type User = {
  userId: string;
  nombre: string;
  rol: number;
  correo?: string;
  activo?: boolean;
  contrasena?: string;
};

export type InventoryProduct = {
  id: number;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  categoriaId: number | null;
  categoriaNombre: string | null;
  inventario: {
    cantidadDisponible: number;
    nivelMinimo: number | null;
  };
};

export type InventoryCategory = {
  id: number;
  nombre: string;
};
