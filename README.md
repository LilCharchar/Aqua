# Aqua POS

Aqua es un sistema POS (Point of Sale) para un restaurante de comida marina.

El sistema está dividido en dos partes:
- `backend/`  → API en NestJS (TypeScript). Maneja lógica de negocio, ventas, comunicación con base de datos (Supabase).
- `frontend/` → Interfaz en React + Vite (TypeScript). Punto de venta visual para el personal del restaurante.

## 1. Requisitos

- Node.js 18 o superior
- npm
- Acceso al archivo `.env` del backend (se comparte por interno)

Clonar el repositorio y trabajar desde la carpeta raíz del proyecto.

## 2. Instalación de dependencias

Instalar dependencias del backend:

```bash
cd backend
npm install
```

Instalar dependencias del frontend:
```bash
cd ../frontend
npm install
```

## 3. ENV

En el backend hay un archivo llamado .env.example que sirve como ejemplo para poner el url y las keys del supabase

## 4. Levantar proyecto

Para levantar el proyecto desde la carpeta principal ejecutar el siguiente comando:
```bash
npm run dev
```

## 6. Flujo de desarrollo local

Crear backend/.env con las claves reales.

npm run dev en la carpeta raíz

Abrir el navegador en http://localhost:5173.

Probar que el frontend puede consultar la API sin error de CORS.

## 7. Probar endpoints con `curl`

Con el proyecto levantado (`npm run dev` en la raíz) la API queda disponible en `http://localhost:5000/api`.

- **Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"usuario@aqua.local","contraseña":"123456"}'
```

- **Registro**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nuevo Usuario",
    "correo": "nuevo@aqua.local",
    "contraseña": "123456",
    "rol_id": 1,
    "activo": true
  }'
```

- **Listar usuarios**

```bash
curl http://localhost:5000/api/auth/users
```

- **Actualizar usuario**

```bash
curl -X PATCH http://localhost:5000/api/auth/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nombre Editado",
    "rol_id": 2,
    "activo": true
  }'
```

- **Desactivar usuario**

```bash
curl -X DELETE http://localhost:5000/api/auth/USER_ID
```

- **Restaurar usuario**

```bash
curl -X PATCH http://localhost:5000/api/auth/USER_ID/restore
```

Cada comando devuelve un objeto JSON con la propiedad `ok`. Si `ok` es `false`, revisa el campo `message` para conocer el error devuelto por la API.

## 8. Notas de seguridad

- Las contraseñas se almacenan con `bcrypt` (coste 10) al registrarse.
- Si tenías usuarios creados antes de este cambio (contraseña en texto plano), vuelve a registrarlos o actualiza su contraseña para que se guarde hasheada.

## 9. Ejecutar tests

Los tests del backend se ejecutan desde la carpeta `backend/` usando Jest:

```bash
cd backend
npm test
```

Para correr una suite específica (por ejemplo la de `AuthService`):

```bash
cd backend
npm test -- --runTestsByPath src/auth.service.spec.ts
```

También podés correr un archivo puntual dentro de `test/unit`, por ejemplo el set de órdenes:

```bash
cd backend
npm test -- --runTestsByPath test/unit/orders.service.spec.ts
```

## 10. API de órdenes

Los endpoints REST de órdenes expuestos por Nest (ver `backend/controllers/orders`) siguen esta convención:

- `GET /orders?status=Pendiente` → lista órdenes (opcionalmente filtradas por estado válido).
- `GET /orders/:id` → devuelve una orden con su detalle y pagos.
- `POST /orders` → crea una orden; payload: `{ mesa_id?, mesero_id?, estado?, items: [{ platillo_id, cantidad }] }`.
- `PATCH /orders/:id/status` → cambia el estado (`Pendiente`, `En_Proceso`, `Confirmada`, `Pagada`, `Anulada`).
- `POST /orders/:id/items` → agrega más platillos a una orden existente; payload: `{ items: [{ platillo_id, cantidad }] }`.
- `POST /orders/:id/payments` → registra un pago (`metodo_pago` = `Efectivo`|`Tarjeta`, `monto`, `cambio?`).

Cada respuesta incluye totales normalizados (`total`, `totalPagado`, `saldoPendiente`) y los ítems con precios unitarios calculados a partir del catálogo de platillos.

> Nota: al crear o actualizar una orden la API revisa los ingredientes de cada platillo, verifica el inventario disponible y descuenta automáticamente las cantidades requeridas. Si algún insumo no existe o no alcanza, la operación se rechaza con un mensaje descriptivo.

## 11. Playground de platillos y órdenes

Hay una vista mínima para pruebas rápidas sin pasar por el flujo de login. Levanta el frontend normalmente y abre:

```
http://localhost:5173/?view=lab
```

La pantalla te deja:
- Visualizar los platillos disponibles.
- Crear platillos nuevos (incluyendo ingredientes).
- Crear órdenes especificando mesa, mesero y los ítems.
- Agregar platillos a órdenes existentes.
- Consultar una orden por ID para revisar totales e ítems.
- Registrar pagos y actualizar el estado de la orden, viendo el historial resultante.

Por defecto usa `http://localhost:5000/api` como base; si necesitás apuntar a otra URL, define `VITE_API_URL` en el entorno del frontend antes de ejecutar `npm run dev`.
