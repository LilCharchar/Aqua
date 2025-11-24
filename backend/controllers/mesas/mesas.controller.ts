import { Controller, Get, Query } from "@nestjs/common";
import { MesasService } from "./mesas.service";

@Controller("mesas")
export class MesasController {
    constructor(private readonly mesasService: MesasService) { }

    @Get()
    async listMesas(@Query("all") all?: string) {
        const includeInactive = all === "true";
        return this.mesasService.listMesas(includeInactive);
    }
}
