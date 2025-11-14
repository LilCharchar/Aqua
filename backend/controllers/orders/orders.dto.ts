export interface OrderItemDto {
  platillo_id: number;
  cantidad: number;
}

export class CreateOrderDto {
  mesa_id?: number | null;
  mesero_id?: number | null;
  estado?: string;
  items!: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  estado!: string;
}

export class RegisterPaymentDto {
  metodo_pago!: string;
  monto!: number;
  cambio?: number | null;
}

export class AddOrderItemsDto {
  items!: OrderItemDto[];
}
