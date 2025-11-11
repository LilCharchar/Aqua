export class CreateProductDto {
  nombre!: string;
  descripcion?: string;
  precio?: number;
  categoria_id?: number | null;
  unidad?: string;
  cantidad_inicial?: number;
  nivel_minimo?: number;
}

export class UpdateProductDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria_id?: number | null;
  unidad?: string;
  cantidad_disponible?: number;
  nivel_minimo?: number;
}
