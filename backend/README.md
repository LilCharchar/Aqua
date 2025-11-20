# Aqua Backend

API RESTful construida con NestJS que proporciona la lógica de negocio completa para el sistema POS Aqua.

## 🏗️ Arquitectura

El backend sigue una arquitectura modular basada en NestJS, con separación clara de responsabilidades:

- **Controllers**: Manejan las solicitudes HTTP y respuestas
- **Services**: Contienen la lógica de negocio
- **DTOs**: Validación y transformación de datos
- **Modules**: Agrupación funcional de componentes

## 🛠️ Tecnologías

### Core
- **NestJS 11** - Framework de Node.js para aplicaciones server-side
- **TypeScript 5.7** - Lenguaje tipado
- **Node.js 18+** - Runtime

### Base de Datos
- **Supabase** - Backend-as-a-Service con PostgreSQL
- **@supabase/supabase-js** - Cliente oficial de Supabase

### Seguridad
- **bcrypt** - Hash de contraseñas
- **@nestjs/passport** - Autenticación
- **@nestjs/jwt** - JSON Web Tokens

### Validación
- **class-validator** - Validación declarativa de DTOs
- **class-transformer** - Transformación de objetos

### Testing
- **Jest** - Framework de testing
- **Supertest** - Testing de endpoints HTTP

### Otras
- **Winston** - Logging estructurado
- **dotenv** - Gestión de variables de entorno
- **Axios** - Cliente HTTP

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── main.ts              # Entry point de la aplicación
│   ├── app.module.ts        # Módulo raíz
│   ├── supabase.service.ts  # Servicio de conexión a Supabase
│   └── config/              # Configuraciones
│
├── controllers/             # Módulos de negocio
│   ├── auth/               # Autenticación y usuarios
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts
│   │   └── auth.module.ts
│   │
│   ├── orders/             # Gestión de órdenes
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.dto.ts
│   │   └── orders.module.ts
│   │
│   ├── platillos/          # Gestión de platillos
│   │   ├── platillos.controller.ts
│   │   ├── platillos.service.ts
│   │   ├── platillos.dto.ts
│   │   └── platillos.module.ts
│   │
│   └── inventory/          # Gestión de inventario
│       ├── inventory.controller.ts
│       ├── inventory.service.ts
│       ├── inventory.dto.ts
│       └── inventory.module.ts
│
├── test/
│   ├── unit/               # Tests unitarios
│   │   ├── auth.service.spec.ts
│   │   ├── orders.service.spec.ts
│   │   ├── platillos.service.spec.ts
│   │   └── inventory.service.spec.ts
│   └── app.e2e-spec.ts    # Tests end-to-end
│
├── types/                  # Type definitions personalizados
│   └── bcrypt.d.ts
│
├── dist/                   # Código compilado
├── .env                    # Variables de entorno (no versionado)
├── .env.example           # Plantilla de variables de entorno
└── package.json
```

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del backend:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key-aqui
```

El archivo `.env.example` proporciona una plantilla de referencia.

### Puerto

Por defecto, la aplicación corre en el puerto **5000**. La configuración se establece en `src/main.ts`.

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Inicia el servidor con hot-reload
npm run start:debug        # Inicia con debugger

# Producción
npm run build              # Compila el proyecto a JavaScript
npm run start:prod         # Ejecuta la versión compilada

# Testing
npm test                   # Ejecuta todos los tests
npm run test:watch         # Tests en modo watch
npm run test:cov          # Tests con coverage
npm run test:e2e          # Tests end-to-end

# Calidad de código
npm run lint              # Ejecuta ESLint
npm run format            # Formatea código con Prettier
```

## 📚 Módulos

### 1. Auth Module (`controllers/auth`)

**Responsabilidades:**
- Autenticación de usuarios
- Registro de nuevos usuarios
- Gestión de usuarios (CRUD)
- Hash de contraseñas con bcrypt

**Endpoints:**
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/register` - Registro de usuario
- `GET /api/auth/users` - Listar usuarios
- `PATCH /api/auth/:id` - Actualizar usuario
- `DELETE /api/auth/:id` - Desactivar usuario
- `PATCH /api/auth/:id/restore` - Restaurar usuario

**DTOs:**
- `LoginDto` - Credenciales de login (correo, contraseña)
- `CreateUserDto` - Datos para crear usuario
- `UpdateUserDto` - Datos para actualizar usuario

**Características:**
- Contraseñas hasheadas con bcrypt (coste 10)
- Validación de correos únicos
- Soporte para usuarios activos/inactivos
- Retrocompatibilidad con contraseñas en texto plano (migrables)

---

### 2. Orders Module (`controllers/orders`)

**Responsabilidades:**
- Gestión completa del ciclo de vida de órdenes
- Agregado de items a órdenes
- Registro y gestión de pagos
- Validación de inventario
- Cálculo automático de totales y cambios

**Endpoints:**
- `GET /api/orders` - Listar órdenes (filtrable por estado)
- `GET /api/orders/:id` - Obtener orden por ID
- `POST /api/orders` - Crear nueva orden
- `PATCH /api/orders/:id/status` - Actualizar estado de orden
- `POST /api/orders/:id/items` - Agregar items a orden existente
- `POST /api/orders/:id/payments` - Registrar pago

**DTOs:**
- `CreateOrderDto` - Datos para crear orden (mesa_id, mesero_id, items)
- `UpdateOrderStatusDto` - Nuevo estado
- `AddOrderItemsDto` - Items a agregar
- `RegisterPaymentDto` - Datos del pago (metodo_pago, monto, cambio)
- `OrderItemDto` - Item individual (platillo_id, cantidad)

**Estados de Orden:**
- `Pendiente` - Orden recién creada
- `En_Proceso` - En preparación
- `Confirmada` - Lista para entregar
- `Pagada` - Pago completado
- `Anulada` - Cancelada

**Métodos de Pago:**
- `Efectivo` - Pago en efectivo (calcula cambio automáticamente)
- `Tarjeta` - Pago con tarjeta

**Lógica de Negocio:**

1. **Validación de Inventario**: Al crear/modificar una orden, se valida que haya suficiente inventario de todos los ingredientes necesarios.

2. **Descuento Automático**: Cuando se crea una orden, el inventario se descuenta automáticamente.

3. **Cálculo de Cambio**: Para pagos en efectivo, si el monto excede el saldo pendiente, el cambio se calcula automáticamente.

4. **Actualización Automática de Estado**: Cuando el total pagado alcanza o excede el total de la orden, el estado se actualiza a "Pagada" automáticamente.

5. **Prevención de Sobrepagos**: No se permiten pagos en órdenes que ya están en estado "Pagada".

6. **Rollback en Errores**: Si alguna operación falla, se revierten los cambios en el inventario.

**Respuesta de Orden:**
```typescript
{
  id: number;
  mesaId: number | null;
  mesaNumero: string | null;
  meseroId: number | null;
  meseroNombre: string | null;
  estado: string;
  fecha: string | null;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  items: OrderItemResponse[];
  pagos: OrderPaymentResponse[];
}
```

---

### 3. Platillos Module (`controllers/platillos`)

**Responsabilidades:**
- CRUD de platillos
- Gestión de ingredientes por platillo
- Validación de supervisores
- Control de disponibilidad

**Endpoints:**
- `GET /api/platillos` - Listar platillos
- `GET /api/platillos/:id` - Obtener platillo por ID
- `POST /api/platillos` - Crear platillo
- `PATCH /api/platillos/:id` - Actualizar platillo
- `DELETE /api/platillos/:id` - Eliminar platillo

**DTOs:**
- `CreatePlatilloDto` - Datos para crear platillo (nombre, descripcion, precio, ingredientes)
- `UpdatePlatilloDto` - Datos para actualizar platillo
- `PlatilloIngredientDto` - Ingrediente individual (producto_id, cantidad)

**Características:**
- Gestión de ingredientes con cantidades específicas
- Validación de existencia de productos
- Soft delete (marca como no disponible)
- Transacciones para asegurar integridad

---

### 4. Inventory Module (`controllers/inventory`)

**Responsabilidades:**
- CRUD de productos de inventario
- Gestión de categorías
- Control de stock y niveles mínimos

**Endpoints:**
- `GET /api/inventory` - Listar productos
- `GET /api/inventory/categories` - Listar categorías
- `GET /api/inventory/:id` - Obtener producto por ID
- `POST /api/inventory` - Crear producto
- `PATCH /api/inventory/:id` - Actualizar producto
- `DELETE /api/inventory/:id` - Eliminar producto

**DTOs:**
- `CreateProductDto` - Datos para crear producto
- `UpdateProductDto` - Datos para actualizar producto

**Características:**
- Gestión automática de registros de inventario
- Soporte para categorías de productos
- Seguimiento de niveles mínimos
- Unidades de medida personalizables

## 🗄️ Base de Datos (Supabase)

### Tablas Principales

**usuarios**
- Almacena información de usuarios del sistema
- Contraseñas hasheadas con bcrypt
- Relación con roles

**ordenes**
- Órdenes de venta
- Estados y totales
- Relaciones con mesas y meseros

**detalle_orden**
- Items de cada orden
- Cantidades y precios unitarios
- Relación con platillos

**pagos**
- Registro de pagos por orden
- Métodos de pago y cambios
- Timestamps

**platillos**
- Catálogo de platillos
- Precios y disponibilidad
- Relación con supervisor

**platillo_ingredientes**
- Ingredientes requeridos por platillo
- Cantidades necesarias
- Relación con productos

**productos**
- Productos de inventario
- Unidades y categorías

**inventario**
- Stock actual de productos
- Niveles mínimos y disponibilidad

## 🧪 Testing

### Estructura de Tests

```
test/
├── unit/                          # Tests unitarios por servicio
│   ├── auth.service.spec.ts       # Tests de autenticación
│   ├── orders.service.spec.ts     # Tests de órdenes
│   ├── platillos.service.spec.ts  # Tests de platillos
│   └── inventory.service.spec.ts  # Tests de inventario
└── app.e2e-spec.ts               # Tests de integración
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Un archivo específico
npm test -- --runTestsByPath test/unit/orders.service.spec.ts

# Con coverage
npm run test:cov

# En modo watch
npm run test:watch
```

### Mocking

Los tests utilizan mocks de Supabase para no afectar la base de datos real. Cada servicio tiene su suite de tests que valida:
- Creación de recursos
- Validaciones
- Lógica de negocio
- Manejo de errores

## ✅ Validaciones

### DTOs

Todos los DTOs utilizan decoradores de `class-validator`:

```typescript
@IsString()
@IsNotEmpty()
nombre: string;

@IsEmail()
correo: string;

@IsNumber()
@Min(0)
precio: number;
```

### Reglas de Negocio

1. **Correos únicos**: No se permiten usuarios duplicados
2. **Inventario suficiente**: Se valida antes de crear/modificar órdenes
3. **Estados válidos**: Solo transiciones de estado permitidas
4. **Pagos en órdenes activas**: No se permiten pagos en órdenes pagadas o anuladas
5. **Ingredientes existentes**: Se valida que los productos existan antes de asignarlos

## 🔐 Seguridad

- **Contraseñas**: Hash con bcrypt, coste 10
- **Variables sensibles**: Almacenadas en `.env` (no versionado)
- **Validación de entrada**: DTOs con class-validator
- **CORS**: Habilitado para desarrollo local

## 📝 Convenciones de Código

- **Nombres en español**: Para reflejar el dominio del negocio
- **camelCase**: Para variables y métodos en TypeScript
- **PascalCase**: Para clases y componentes
- **snake_case**: Para nombres de columnas en base de datos (convención de Supabase)

## 🚨 Manejo de Errores

Todos los servicios retornan respuestas con la siguiente estructura:

```typescript
// Éxito
{ ok: true, ...data }

// Error
{ ok: false, message: string }
```

Esto permite validación consistente en el frontend.

## 🔄 Transacciones

Para operaciones que modifican múltiples tablas (por ejemplo, crear una orden que afecta inventario), se utilizan transacciones para garantizar consistencia:

```typescript
// Si falla alguna operación, se hace rollback automático
await rollbackOrder(orderId, supabase);
```

## 📦 Dependencias Principales

```json
{
  "@nestjs/core": "^11.1.6",
  "@supabase/supabase-js": "^2.75.0",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.2",
  "winston": "^3.18.3"
}
```

## 🌐 CORS

CORS está habilitado en `main.ts` para permitir peticiones desde el frontend en desarrollo:

```typescript
app.enableCors();
```

En producción, se debe configurar para permitir solo orígenes específicos.

## 📊 Logging

Se utiliza Winston para logging estructurado. Los logs incluyen:
- Requests HTTP
- Errores de base de datos
- Validaciones fallidas
- Operaciones críticas

---

**Para más información general del proyecto, ver el [README principal](../README.md)**