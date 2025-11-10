import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { LoginDto, CreateUserDto, UpdateUserDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("register")
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Get()
  async getUsers() {
    return this.authService.getUsers();
  }

  @Patch(":id")
  async updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Delete(":id")
  async deactivateUser(@Param("id") id: string) {
    return this.authService.deactivateUser(id);
  }

  @Patch(":id/restore")
  async restoreUser(@Param("id") id: string) {
    return this.authService.restoreUser(id);
  }
}
