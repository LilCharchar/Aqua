import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import {
    CloseCajaDto,
    CreateCajaDto,
    CreateTransaccionDto,
} from "./caja.dto";
import { CajaService } from "./caja.service";

@Controller("caja")
export class CajaController {
    constructor(private readonly cajaService: CajaService) { }

    @Get("current")
    async getCurrentCaja() {
        return this.cajaService.getCurrentCaja();
    }

    @Get()
    async listCajas() {
        return this.cajaService.listCajas();
    }

    @Get(":id")
    async getCaja(@Param("id") id: string) {
        const cajaId = this.parseNumericId(id);
        if (!cajaId) {
            return { ok: false, message: "ID inválido" };
        }
        return this.cajaService.getCajaById(cajaId);
    }

    @Post()
    async openCaja(@Body() dto: CreateCajaDto) {
        return this.cajaService.openCaja(dto);
    }

    @Patch(":id/close")
    async closeCaja(@Param("id") id: string, @Body() dto: CloseCajaDto) {
        const cajaId = this.parseNumericId(id);
        if (!cajaId) {
            return { ok: false, message: "ID inválido" };
        }
        return this.cajaService.closeCaja(cajaId, dto);
    }

    @Post(":id/transactions")
    async addTransaction(
        @Param("id") id: string,
        @Body() dto: CreateTransaccionDto,
    ) {
        const cajaId = this.parseNumericId(id);
        if (!cajaId) {
            return { ok: false, message: "ID inválido" };
        }
        return this.cajaService.addTransaction(cajaId, dto);
    }

    private parseNumericId(id: string): number | null {
        const parsed = Number(id);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return null;
        }
        return parsed;
    }
}
