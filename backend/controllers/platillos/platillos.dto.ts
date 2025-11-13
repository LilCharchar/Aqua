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
  ingredientes?: PlatilloIngredientDto[];
}

export class UpdatePlatilloDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  supervisor_id?: number | null;
  disponible?: boolean;
  ingredientes?: PlatilloIngredientDto[];
}
