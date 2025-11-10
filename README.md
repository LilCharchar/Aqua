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