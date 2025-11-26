import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CreatePlatilloDto, UpdatePlatilloDto } from "./platillos.dto";
import { PlatillosService } from "./platillos.service";

@Controller("platillos")
export class PlatillosController {
  constructor(private readonly platillosService: PlatillosService) {}

  @Get()
  async listPlatillos() {
    return this.platillosService.listPlatillos();
  }

  @Get(":id")
  async getPlatillo(@Param("id") id: string) {
    const platilloId = this.parseNumericId(id);
    if (!platilloId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.platillosService.getPlatilloById(platilloId);
  }

  @Post()
  async createPlatillo(@Body() dto: CreatePlatilloDto) {
    return this.platillosService.createPlatillo(dto);
  }

  @Patch(":id")
  async updatePlatillo(
    @Param("id") id: string,
    @Body() dto: UpdatePlatilloDto,
  ) {
    const platilloId = this.parseNumericId(id);
    if (!platilloId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.platillosService.updatePlatillo(platilloId, dto);
  }

  @Delete(":id")
  async deletePlatillo(@Param("id") id: string) {
    const platilloId = this.parseNumericId(id);
    if (!platilloId) {
      return { ok: false, message: "ID inválido" };
    }
    return this.platillosService.deletePlatillo(platilloId);
  }

  private parseNumericId(id: string): number | null {
    const parsed = Number(id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }
}
