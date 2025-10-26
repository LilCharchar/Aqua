import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ENV } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ENV.FRONTEND_ORIGIN,
    credentials: true,
  });

  app.setGlobalPrefix("api");

  await app.listen(parseInt(ENV.PORT, 10));

  console.log(`Backend corriendo en http://localhost:${ENV.PORT}`);
}
void bootstrap();
