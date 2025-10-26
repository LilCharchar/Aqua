import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:5173", // o 3000, depende de tu frontend
    credentials: true,
  });

  await app.listen(5000);
  console.log("🚀 Backend corriendo en http://localhost:5000");
}
void bootstrap();
