export interface PlatilloIngredientDto {
  producto_id: number;
  cantidad: number;
}

export class CreatePlatilloDto {
  nombre!: string;
  descripcion?: string;
  precio!: number;
  supervisor_id?: number | null;
  disponible?: boolean;
  imagen_url?: string;
  ingredientes?: PlatilloIngredientDto[];
}

export class UpdatePlatilloDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  supervisor_id?: number | null;
  disponible?: boolean;
  imagen_url?: string;
  ingredientes?: PlatilloIngredientDto[];
}
