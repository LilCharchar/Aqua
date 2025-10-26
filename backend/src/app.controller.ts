import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("hello")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    // responder JSON
    return { message: this.appService.getHello() };
  }
}
