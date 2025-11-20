# Aqua Frontend

Interfaz moderna de usuario construida con React y Vite para el sistema POS Aqua. Proporciona una experiencia visual intuitiva con pantallas específicas organizadas por roles de usuario.

## 🎨 Descripción

El frontend es una Single Page Application (SPA) que se comunica con el backend a través de una API REST. Está diseñado con un enfoque mobile-first y responsivo, utilizando TailwindCSS para un diseño moderno y consistente.

## 🛠️ Tecnologías

### Core
- **React 19** - Biblioteca de UI moderna
- **TypeScript** - Lenguaje tipado para mayor seguridad
- **Vite 7** - Build tool ultrarrápido con HMR
- **React Router DOM 7** - Enrutamiento declarativo

### Estilos
- **TailwindCSS 4** - Framework de CSS utility-first
- **tailwind-scrollbar** - Scrollbars personalizados
- **PostCSS** - Procesamiento de CSS

### UI y Componentes
- **Lucide React** - Biblioteca de iconos moderna y ligera
- Componentes UI personalizados reutilizables

### Otros
- **@supabase/supabase-js** - Cliente de Supabase (usado en algunos componentes)
- **ESLint** - Linting de código
- **TypeScript ESLint** - Reglas específicas para TypeScript

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── main.tsx              # Entry point de la aplicación
│   ├── App.tsx               # Componente raíz con enrutamiento
│   ├── App.css               # Estilos globales
│   ├── index.css             # Estilos base y TailwindCSS
│   │
│   └── components/           # Componentes reutilizables
│       ├── ui/              # Componentes de UI base
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── input.tsx
│       │   ├── label.tsx
│       │   ├── select.tsx
│       │   ├── table.tsx
│       │   ├── tabs.tsx
│       │   └── toast.tsx
│       │
│       ├── getuser.tsx      # Gestión de usuarios
│       ├── logo.tsx         # Logo de Aqua
│       ├── separator.tsx    # Separadores visuales
│       ├── wave-background.tsx  # Fondo animado
│       └── MetabaseDashboard.tsx # Dashboard de analytics
│
├── screens/                  # Pantallas organizadas por rol
│   ├── Login.tsx            # Pantalla de login
│   ├── types.ts             # Tipos compartidos
│   │
│   ├── admin/               # Pantallas de administrador
│   │   └── adminHome.tsx    # Gestión de usuarios y config
│   │
│   ├── mesero/              # Pantallas de mesero
│   │   └── meseroHome.tsx   # Vista básica (en desarrollo)
│   │
│   ├── supervisor/          # Pantallas de supervisor
│   │   ├── supervisorApp.tsx  # App principal con navegación
│   │   ├── home.tsx          # Página de inicio
│   │   ├── dashboard.tsx     # Dashboard con KPIs
│   │   ├── orders.tsx        # Gestión de órdenes
│   │   ├── dishes.tsx        # Gestión de platillos
│   │   └── inventory.tsx     # Control de inventario
│   │
│   └── dev/                 # Herramientas de desarrollo
│       └── OrdersPlayground.tsx  # Testing de órdenes y pagos
│
├── assets/                   # Recursos estáticos
│   ├── aqua-logo.jpg
│   ├── fish.jpg
│   └── ...
│
├── public/                   # Archivos públicos
│   └── vite.svg
│
├── index.html               # HTML principal
├── vite.config.ts          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind
├── postcss.config.js       # Configuración de PostCSS
├── tsconfig.json           # Configuración de TypeScript
└── package.json
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo con HMR
                        # Disponible en http://localhost:5173

# Producción
npm run build           # Compila TypeScript y construye para producción
npm run preview         # Preview de la build de producción

# Calidad de código
npm run lint            # Ejecuta ESLint para verificar código
```

## 🎯 Pantallas por Rol

### 1. Login (`screens/Login.tsx`)

Pantalla inicial de autenticación:
- Formulario de login con correo y contraseña
- Validación de credenciales con el backend
- Redirección automática según rol del usuario
- Diseño moderno con fondo animado tipo wave

**Ruta**: `/` (raíz)

---

### 2. Admin (`screens/admin/`)

Vista para administradores del sistema.

#### adminHome.tsx
- **Gestión completa de usuarios**
- Crear nuevos usuarios
- Editar usuarios existentes
- Activar/desactivar usuarios
- Asignar roles (Admin, Mesero, Supervisor)
- Tabla interactiva con filtrado

**Ruta**: `/admin`

**Características**:
- CRUD completo de usuarios
- Validación de formularios
- Feedback visual con toast notifications
- Diseño con cards y tablas responsivas

---

### 3. Mesero (`screens/mesero/`)

Vista simplificada para meseros.

#### meseroHome.tsx
- Vista básica (actualmente en desarrollo)
- Diseñada para flujo simplificado de toma de órdenes

**Ruta**: `/mesero`

---

### 4. Supervisor (`screens/supervisor/`)

Panel completo de gestión para supervisores.

#### supervisorApp.tsx
Aplicación principal con navegación por tabs:
- Home
- Dashboard
- Órdenes
- Platillos
- Inventario

#### home.tsx
- Página de bienvenida
- Accesos rápidos
- Resumen del estado del sistema

#### dashboard.tsx
- **Dashboard con métricas y KPIs**
- Integración con Metabase para analytics avanzados
- Visualizaciones de datos en tiempo real
- Gráficos y estadísticas

#### orders.tsx
- Visualización de órdenes activas
- Filtros por estado
- Vista de detalles de orden

#### dishes.tsx
- **Gestión de platillos**
- Crear nuevos platillos con ingredientes
- Editar platillos existentes
- Marcar disponibilidad
- Gestión de precios
- Tabla con filtrado y búsqueda

#### inventory.tsx
- **Control completo de inventario**
- Gestión de productos
- Categorías de productos
- Seguimiento de stock
- Niveles mínimos
- Alertas de inventario bajo
- Edición inline de cantidades

**Ruta**: `/supervisor`

---

### 5. Dev Tools (`screens/dev/`)

Herramientas de desarrollo y testing.

#### OrdersPlayground.tsx
- **Playground completo para testing de órdenes**
- Visualizar platillos disponibles
- Crear platillos con ingredientes
- Crear órdenes con múltiples items
- Agregar items a órdenes existentes
- Buscar órdenes por ID
- Registrar pagos (Efectivo/Tarjeta)
- Ver historial de pagos
- Probar cálculo automático de cambio
- Verificar actualización automática de estado a "Pagada"
- Actualizar estados manualmente

**Acceso**: Agregar `?view=lab` a la URL
```
http://localhost:5173/?view=lab
```

**Características**:
- Interfaz intuitiva con tabs
- Feedback visual inmediato
- Testing sin afectar producción
- Debugging de flujo de pagos

## 🔌 Integración con Backend

### API Base URL

El frontend se conecta al backend en:
```
http://localhost:5000/api
```

Para configurar otra URL, usar la variable de entorno:
```bash
VITE_API_URL=https://api.tudominio.com
```

### Estructura de Requests

Todos los servicios siguen el patrón:

```typescript
const response = await fetch(`${API_URL}/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

const result = await response.json();

if (result.ok) {
  // Éxito
} else {
  // Error: result.message
}
```

### Endpoints Utilizados

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/users`
- **Orders**: `/api/orders`, `/api/orders/:id`, `/api/orders/:id/payments`
- **Platillos**: `/api/platillos`
- **Inventory**: `/api/inventory`, `/api/inventory/categories`

## 🎨 Sistema de Diseño

### Colores

El tema utiliza una paleta azul-acuática:

```css
/* Primarios */
--primary: oklch(colors.sky.500)
--primary-foreground: white

/* Secundarios */
--secondary: oklch(colors.blue.100)
--secondary-foreground: oklch(colors.blue.900)

/* Acentos */
--accent: oklch(colors.cyan.100)
--accent-foreground: oklch(colors.cyan.900)
```

### Componentes UI

Biblioteca de componentes reutilizables en `src/components/ui/`:

- **Button**: Botones con variantes (default, destructive, outline, ghost)
- **Card**: Cards con header, content y footer
- **Input**: Campos de texto estilizados
- **Label**: Labels para formularios
- **Select**: Dropdowns nativos estilizados
- **Table**: Tablas responsivas
- **Tabs**: Navegación por tabs
- **Toast**: Notificaciones temporales

### Iconos

Se usa **Lucide React** para iconos consistentes:

```tsx
import { User, Package, DollarSign } from 'lucide-react';

<User className="h-4 w-4" />
```

## 🔐 Autenticación

### Flujo de Login

1. Usuario ingresa credenciales en `/`
2. Se valida contra `/api/auth/login`
3. Si es exitoso, se guarda la sesión (implementación pendiente)
4. Redirección según rol:
   - Admin → `/admin`
   - Mesero → `/mesero`
   - Supervisor → `/supervisor`

### Protección de Rutas

(Implementación pendiente - actualmente las rutas son públicas)

## 📱 Responsive Design

El diseño es mobile-first y se adapta a diferentes tamaños:

- **Mobile**: Layout vertical, menú colapsable
- **Tablet**: Grid de 2 columnas
- **Desktop**: Layout completo con sidebar

## 🧩 Agregar Nuevas Pantallas

### 1. Crear el componente

```tsx
// screens/nombre-rol/nuevaPantalla.tsx
export default function NuevaPantalla() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Nueva Pantalla</h1>
      {/* Contenido */}
    </div>
  );
}
```

### 2. Agregar ruta en App.tsx

```tsx
import NuevaPantalla from './screens/nombre-rol/nuevaPantalla';

// En el Router
<Route path="/nueva-ruta" element={<NuevaPantalla />} />
```

### 3. Agregar navegación

Si es parte de supervisor, agregar en `supervisorApp.tsx`:

```tsx
<Tabs.Trigger value="nueva">Nueva</Tabs.Trigger>
<Tabs.Content value="nueva">
  <NuevaPantalla />
</Tabs.Content>
```

## 🧪 Best Practices

### TypeScript

- Siempre tipar props de componentes
- Usar interfaces para objetos complejos
- Evitar `any`, preferir tipos específicos

```typescript
interface User {
  userId: string;
  nombre: string;
  correo: string;
  rol: number | null;
}
```

### Componentes

- Componentes funcionales con hooks
- Mantener componentes pequeños y reutilizables
- Separar lógica de negocio de presentación

### Estilos

- Usar clases de Tailwind en lugar de CSS custom
- Mantener consistencia con el sistema de diseño
- Utilizar los componentes UI base

### Estado

- `useState` para estado local
- Considerar Context API para estado global (pendiente)
- Props drilling solo para datos simples

## 🔄 Variables de Entorno

Crear `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

**Nota**: Variables deben empezar con `VITE_` para ser accesibles.

## 📦 Dependencias Principales

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.5",
  "lucide-react": "^0.545.0",
  "tailwindcss": "^4.1.14"
}
```

## 🚧 Trabajo Futuro

- [ ] Implementar manejo de sesión persistente
- [ ] Protección de rutas por rol
- [ ] Vista de mesero completa
- [ ] Modo oscuro
- [ ] Notificaciones en tiempo real
- [ ] Caché de datos con React Query
- [ ] Testing con Vitest

## 🐛 Debugging

### Vite Dev Server

El servidor de desarrollo ofrece:
- Hot Module Replacement (HMR)
- Error overlay en el navegador
- Source maps para debugging

### React DevTools

Usar React DevTools para inspeccionar:
- Árbol de componentes
- Props y estado
- Re-renders

## 📊 Performance

### Optimizaciones Actuales

- Code splitting con Vite
- Lazy loading de rutas (pendiente)
- Imágenes optimizadas

### Métricas

Vite proporciona builds optimizados:
- Tree shaking automático
- Minificación de JS/CSS
- Compresión gzip

---

**Para más información general del proyecto, ver el [README principal](../README.md)**

**Para información del backend, ver el [README del backend](../backend/README.md)**
