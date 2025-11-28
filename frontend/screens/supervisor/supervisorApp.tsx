import { useState, useCallback } from "react";
import Sidebar, { type NavItem } from '../../src/components/ui/Sidebar.tsx';
import type { User } from "../types";
import {Inventory}  from './inventory.tsx'; 
import Dashboard from './dashboard.tsx';
import Dishes from './dishes.tsx';
import Orders from './orders.tsx';
import Home from './home.tsx';
import Ventas from'./ventas.tsx';


// Asume que este es el tipo de tu usuario
type UserProps = {
    user:User;
  logout: () => void;
};


// Este componente es el Layout y Router principal para el Supervisor
export default function SupervisorApp({user, logout}: UserProps) {

  // Define la función real de cierre de sesión de tu aplicación
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);
  
  type CurrentPath = NavItem['path'];
  const [currentView, setCurrentView] = useState<CurrentPath>('home'); // Empieza en 'Home'

  // Función para manejar la navegación desde el Sidebar
  const handleNavigate = useCallback((path: CurrentPath) => {
    setCurrentView(path);
  }, []);

  // Función para renderizar el componente de vista actual
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home user={user} />;
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'inventory':
        // Renderiza el componente de inventario que modificamos
        return <Inventory user={user} logout={logout}/>; 
      case 'dishes':
        return <Dishes user={user} />;
      case 'orders':
        return <Orders user={user} logout={logout}/>;
      case 'ventas':
        return <Ventas user={user} />;
      default:
        return <Home user={user} />;
    }
  };

  return (
    // Estructura principal con flexbox para la barra lateral y el contenido
    <div className="h-screen w-full flex bg-gray-50">
      
      {/* 1. SIDEBAR */}
      <Sidebar
        currentPath={currentView}
        onNavigate={handleNavigate}
        logout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto pt-[60px] md:pt-0">
        <div className="w-full mx-auto">
          {renderView()}
        </div>
      </main>
      
    </div>
  );
}
