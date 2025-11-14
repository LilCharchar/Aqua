import React from 'react';
import ordersIcon from "../../../assets/ordersIcon.png";
import dashboardIcon from "../../../assets/dashboardIcon.svg";
import logo from "../../../assets/logo.png";
import inventoryIcon from "../../../assets/inventoryIcon.svg";
import dishesIcon from "../../../assets/dishesIcon.svg";
import { Menu } from 'lucide-react'

export type NavItem ={
  id: string;
  name: string;
  icon: React.ReactNode;
  path: 'home' | 'orders' | 'inventory' | 'dishes' | 'dashboard';
}

const navItems: NavItem[]=[
  { id: '1', name: 'Home', icon: <img src={logo} className="w-[50px] h-[50px] hover:bg[-var(--primary)]" />, path: 'home' },
  { id: '2', name: 'Orders', icon: <img src={ordersIcon} className="w-[50px] h-[50pxl" />, path: 'orders' },
  { id: '3', name: 'Inventory', icon: <img src={inventoryIcon} className="w-full h-full" />, path: 'inventory' },
  { id: '4', name: 'Dishes', icon: <img src={dishesIcon} className="w-full h-full" />, path: 'dishes' },
  { id: '5', name: 'Dashboard', icon: <img src={dashboardIcon} className="w-full h-full" />, path: 'dashboard' },
]

interface SidebarProps{
  currentPath: NavItem['path'];
  onNavigate: (path: NavItem['path']) => void;
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({currentPath, onNavigate, logout}) =>{
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Componente de enlace de navegación
  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = currentPath === item.path;
    
    return (
      <button
        onClick={() => {
          onNavigate(item.path);
          setIsMenuOpen(false); // Cierra el menú al navegar en móvil
        }}
        className={`
          flex items-center rounded-xl transition-colors duration-200 
          ${isActive
            ? 'bg-[var(--confirmation)] text-white shadow-lg'
            : 'text-[var(--options)] hover:bg-gray-100 hover:text-[var(--text-primary)]'
          }
        `}
      >
        <span className="p-1">{item.icon}</span> 
      </button>
    );
  };

  return (
    <>
      {/* Botón de Menú para Móviles */}
      <div className="md:hidden p-4 bg-white shadow-md flex justify-between items-center fixed top-0 left-0 right-0 z-40">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg bg-gray-100 text-[var(--text-primary)]">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar - Fija en Desktop */}
      
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[var(--primary)] w-10 p-5 shadow-2xl transition-transform duration-300 z-30
          md:sticky md:flex md:flex-col md:w-22  rounded-r-xl md:shadow-xl md:translate-x-0 md:top-0 items-center
        `}
      >
        
        <div className="flex flex-col justify-between items-center h-full w-full">
          
          {/* Enlaces de Navegación */}
          <nav className="flex flex-col justify-evenly items-center flex-1 w-full">
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </nav>

          {/* Opción de Cerrar Sesión */}
          <div className="w-full mb-4">
                    <div className="flex items-center justify-center manrope-light text-xs">
                      <button className=" text-[var(--text-buttons)] hover:text-[var(--warning)]  hover:scale-105 hover:cursor-pointer tansition-transform duration-200" onClick={logout}>Cerrar sesión</button>
                    </div>
          </div>
        </div>
      </aside>
      
      {/* Overlay para Móviles */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;


