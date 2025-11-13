import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  CreateOrderDto,
  RegisterPaymentDto,
  UpdateOrderStatusDto,
} from "./orders.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(@Query("status") status?: string) {
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
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const orderId = this.parseNumericId(id);
    if (!orderId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.ordersService.updateOrderStatus(orderId, dto);
  }

  @Post(":id/payments")
  async registerPayment(
    @Param("id") id: string,
    @Body() dto: RegisterPaymentDto,
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
