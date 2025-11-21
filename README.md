# Aqua POS

Sistema POS (Point of Sale) moderno para un restaurante de comida marina. Aqua es una aplicación full-stack que permite gestionar órdenes, inventario, platillos y usuarios de manera eficiente.

## 📋 Descripción

El sistema está dividido en dos partes principales:

- **`backend/`** → API RESTful en NestJS (TypeScript)  
  Maneja la lógica de negocio, autenticación, órdenes, platillos, inventario y comunicación con la base de datos (Supabase).

- **`frontend/`** → Interfaz moderna en React + Vite (TypeScript)  
  Punto de venta visual para el personal del restaurante con pantallas específicas por rol.

## 🚀 Características Principales

### Sistema de Órdenes
- Creación y gestión de órdenes con estados (`Pendiente`, `En_Proceso`, `Confirmada`, `Pagada`, `Anulada`)
- Agregado dinámico de platillos a órdenes existentes
- Cálculo automático de totales, subtotales y saldos pendientes
- Registro de pagos con múltiples métodos (Efectivo, Tarjeta)
- **Cálculo automático de cambio** para pagos en efectivo
- **Actualización automática a estado "Pagada"** cuando se recibe el pago completo
- **Prevención de pagos** en órdenes ya pagadas
- Validación automática de inventario al crear/modificar órdenes

### Gestión de Platillos
- CRUD completo de platillos
- Gestión de ingredientes por platillo
- Validación de disponibilidad de ingredientes
- Descuento automático de inventario al confirmar órdenes

### Control de Inventario
- Gestión de productos y categorías
- Seguimiento de cantidades disponibles y niveles mínimos
- Actualización automática al procesar órdenes

### Autenticación y Usuarios
- Login seguro con contraseñas encriptadas (bcrypt)
- Gestión de usuarios por roles (Admin, Mesero, Supervisor)
- Activación/desactivación de usuarios

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework de Node.js
- **TypeScript** - Lenguaje de programación
- **Supabase** - Base de datos PostgreSQL y backend-as-a-service
- **bcrypt** - Encriptación de contraseñas
- **class-validator** - Validación de DTOs
- **Jest** - Testing (unit y e2e)
- **Winston** - Logging

### Frontend
- **React 19** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Lenguaje de programación
- **TailwindCSS 4** - Framework de estilos
- **React Router DOM** - Enrutamiento
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
Aqua/
├── backend/                 # API NestJS
│   ├── src/                # Código fuente principal
│   │   ├── app.module.ts   # Módulo raíz
│   │   ├── main.ts         # Entry point
│   │   └── supabase.service.ts
│   ├── controllers/        # Módulos de negocio
│   │   ├── auth/          # Autenticación y usuarios
│   │   ├── orders/        # Gestión de órdenes
│   │   ├── platillos/     # Gestión de platillos
│   │   └── inventory/     # Gestión de inventario
│   ├── test/              # Tests
│   │   ├── unit/          # Tests unitarios
│   │   └── app.e2e-spec.ts
│   └── types/             # Type definitions
│
├── frontend/              # App React
│   ├── src/              # Código fuente
│   │   ├── components/   # Componentes reutilizables
│   │   ├── App.tsx       # Componente raíz
│   │   └── main.tsx      # Entry point
│   ├── screens/          # Pantallas por rol
│   │   ├── admin/        # Vista de administrador
│   │   ├── mesero/       # Vista de mesero
│   │   ├── supervisor/   # Vista de supervisor
│   │   └── dev/          # Playground de desarrollo
│   └── assets/           # Recursos estáticos
│
└── package.json          # Script para levantar ambos proyectos
```

## 📦 Requisitos

- Node.js 18 o superior
- npm
- Acceso al archivo `.env` del backend (se comparte internamente)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd Aqua
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno

Crear un archivo `.env` en la carpeta `backend/` basado en `.env.example`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-key-aqui
```

## 🚦 Ejecución

### Levantar todo el proyecto (Backend + Frontend)

Desde la carpeta raíz:

```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:5000`
- Frontend en `http://localhost:5173`

### Levantar solo el backend

```bash
cd backend
npm run start:dev
```

### Levantar solo el frontend

```bash
cd frontend
npm run dev
```

## 🧪 Testing

Ejecutar todos los tests del backend:

```bash
cd backend
npm test
```

Ejecutar tests con coverage:

```bash
cd backend
npm run test:cov
```

Ejecutar suite específica:

```bash
cd backend
npm test -- --runTestsByPath test/unit/orders.service.spec.ts
```

## 📡 API Endpoints

### Autenticación (`/api/auth`)

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"usuario@aqua.local","contraseña":"123456"}'
```

**Registro**
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

**Listar usuarios**
```bash
curl http://localhost:5000/api/auth/users
```

**Actualizar usuario**
```bash
curl -X PATCH http://localhost:5000/api/auth/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nombre Editado", "rol_id": 2, "activo": true}'
```

**Desactivar/Restaurar usuario**
```bash
curl -X DELETE http://localhost:5000/api/auth/USER_ID
curl -X PATCH http://localhost:5000/api/auth/USER_ID/restore
```

### Órdenes (`/api/orders`)

**Listar órdenes**
```bash
curl http://localhost:5000/api/orders
curl http://localhost:5000/api/orders?status=Pendiente
```

**Obtener orden por ID**
```bash
curl http://localhost:5000/api/orders/1
```

**Crear orden**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "mesa_id": 1,
    "mesero_id": 1,
    "items": [
      {"platillo_id": 1, "cantidad": 2},
      {"platillo_id": 2, "cantidad": 1}
    ]
  }'
```

**Actualizar estado de orden**
```bash
curl -X PATCH http://localhost:5000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"estado": "En_Proceso"}'
```

**Agregar items a orden**
```bash
curl -X POST http://localhost:5000/api/orders/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"platillo_id": 3, "cantidad": 1}
    ]
  }'
```

**Registrar pago**
```bash
# Pago con tarjeta
curl -X POST http://localhost:5000/api/orders/1/payments \
  -H "Content-Type: application/json" \
  -d '{"metodo_pago": "Tarjeta", "monto": 150.00}'

# Pago en efectivo (cambio calculado automáticamente)
curl -X POST http://localhost:5000/api/orders/1/payments \
  -H "Content-Type: application/json" \
  -d '{"metodo_pago": "Efectivo", "monto": 200.00}'
```

### Platillos (`/api/platillos`)

**Listar platillos**
```bash
curl http://localhost:5000/api/platillos
```

**Obtener platillo por ID**
```bash
curl http://localhost:5000/api/platillos/1
```

**Crear platillo**
```bash
curl -X POST http://localhost:5000/api/platillos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ceviche de Camarón",
    "descripcion": "Camarones frescos marinados en limón",
    "precio": 120.00,
    "disponible": true,
    "supervisor_id": 1,
    "ingredientes": [
      {"producto_id": 1, "cantidad": 200},
      {"producto_id": 2, "cantidad": 3}
    ]
  }'
```

**Actualizar platillo**
```bash
curl -X PATCH http://localhost:5000/api/platillos/1 \
  -H "Content-Type: application/json" \
  -d '{"precio": 130.00, "disponible": true}'
```

**Eliminar platillo**
```bash
curl -X DELETE http://localhost:5000/api/platillos/1
```

### Inventario (`/api/inventory`)

Similar estructura CRUD para gestión de productos de inventario.

## 🎯 Características del Sistema de Pagos

El sistema de pagos incluye lógica automática avanzada:

1. **Cálculo de cambio**: Al registrar un pago en efectivo, el sistema calcula automáticamente el cambio basado en el saldo pendiente.

2. **Actualización automática de estado**: Cuando el total pagado alcanza o excede el total de la orden, el sistema actualiza automáticamente el estado a "Pagada".

3. **Prevención de sobrepagos**: Una vez que la orden está en estado "Pagada", no se permiten más pagos.

4. **Historial de pagos**: Cada orden mantiene un registro completo de todos los pagos realizados.

## 🗂️ Pantallas por Rol

El frontend organiza las vistas según el rol del usuario:

### Admin (`/screens/admin`)
- Gestión completa de usuarios
- Configuración del sistema

### Mesero (`/screens/mesero`)
- Vista simplificada (en desarrollo)
- Toma de órdenes

### Supervisor (`/screens/supervisor`)
- Dashboard con KPIs
- Gestión de órdenes
- Gestión de platillos
- Control de inventario
- Analytics con Metabase

### Dev Playground (`/screens/dev`)
- `OrdersPlayground`: Herramienta de testing para órdenes y pagos
- Accesible en: `http://localhost:5173/?view=lab`

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (coste 10)
- Validación de DTOs con class-validator
- Variables de entorno para información sensible
- Gestión de usuarios activos/inactivos

## 🌊 Base de Datos (Supabase)

El proyecto utiliza las siguientes tablas principales:

- `usuarios` - Usuarios del sistema
- `roles` - Roles de usuario
- `ordenes` - Órdenes de venta
- `detalle_orden` - Items de cada orden
- `pagos` - Registro de pagos
- `platillos` - Catálogo de platillos
- `platillo_ingredientes` - Ingredientes por platillo
- `productos` - Productos de inventario
- `categorias` - Categorías de productos
- `inventario` - Stock de productos
- `mesas` - Mesas del restaurante

## 🐛 Validaciones y Reglas de Negocio

- **Inventario**: Al crear/modificar órdenes, se valida disponibilidad de ingredientes
- **Estados**: Flujo de estados validado (`Pendiente` → `En_Proceso` → `Confirmada` → `Pagada`)
- **Pagos**: Solo se permiten pagos en órdenes no pagadas
- **Usuarios**: Correos únicos, contraseñas hasheadas obligatorias en nuevos registros

## 📝 Notas Adicionales

- El proyecto usa `concurrently` para levantar backend y frontend simultáneamente
- La API corre en el puerto 5000, el frontend en el 5173
- CORS está habilitado para desarrollo local
- Los tests usan mocks de Supabase para no afectar la base de datos real

## 📚 Documentación Adicional

- [Backend README](./backend/README.md) - Documentación específica del backend
- [Frontend README](./frontend/README.md) - Documentación específica del frontend

---

**Desarrollado para Aqua Restaurant** 🐟
