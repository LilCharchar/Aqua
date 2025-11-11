import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { CreateProductDto, UpdateProductDto } from "./inventory.dto";

@Controller("inventory/products")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async listProducts() {
    return this.inventoryService.listProducts();
  }

  @Get(":id")
  async getProduct(@Param("id") id: string) {
    const productId = this.parseNumericId(id);
    if (!productId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.inventoryService.getProductById(productId);
  }

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(dto);
  }

  @Patch(":id")
  async updateProduct(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    const productId = this.parseNumericId(id);
    if (!productId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.inventoryService.updateProduct(productId, dto);
  }

  @Delete(":id")
  async deleteProduct(@Param("id") id: string) {
    const productId = this.parseNumericId(id);
    if (!productId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.inventoryService.deleteProduct(productId);
  }

  private parseNumericId(id: string): number | null {
    const parsed = Number(id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }
}
