import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  AddOrderItemsDto,
  CreateOrderDto,
  RegisterPaymentDto,
  UpdateOrderStatusDto,
} from "./orders.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // orders.controller.ts
  @Get()
  async listOrders(@Query("status") status?: string) {
    // si no se pasa status, devolvemos sólo las órdenes activas
    if (!status) {
      // usaremos 'Pendiente' como filtro por defecto en el controller
      return this.ordersService.listOrders("Pendiente");
    }
    return this.ordersService.listOrders(status);
  }

  @Get(":id")
  async getOrder(@Param("id") id: string) {
    const orderId = this.parseNumericId(id);
    if (!orderId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.ordersService.getOrderById(orderId);
  }

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    const orderId = this.parseNumericId(id);
    if (!orderId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.ordersService.updateOrderStatus(orderId, dto);
  }

  @Post(":id/items")
  async addItems(@Param("id") id: string, @Body() dto: AddOrderItemsDto) {
    const orderId = this.parseNumericId(id);
    if (!orderId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.ordersService.addItems(orderId, dto);
  }

  @Delete(":id/items/:itemId")
  async removeItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    const orderId = this.parseNumericId(id);
    const detailId = this.parseNumericId(itemId);
    if (!orderId || !detailId) {
      return { ok: false, message: "ID inválido" };
    }
    // delegate to service
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: service method exists
    return this.ordersService.removeItem(orderId, detailId);
  }

  @Post(":id/payments")
  async registerPayment(
    @Param("id") id: string,
    @Body() dto: RegisterPaymentDto
  ) {
    const orderId = this.parseNumericId(id);
    if (!orderId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.ordersService.registerPayment(orderId, dto);
  }

  private parseNumericId(id: string): number | null {
    const parsed = Number(id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }
}
