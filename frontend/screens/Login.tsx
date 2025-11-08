import { useState } from "react";
import type { User } from "./types";
import { AdminHome } from "../screens/admin/adminHome";
import { SupervisorHome } from "../screens/supervisor/supervisorHome";
import { MeseroHome } from "../screens/mesero/meseroHome";
import WaveBackground from "../src/components/wave-background";
import Input from "../src/components/ui/input";
import Button from "../src/components/ui/button";

function Login() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // ✅ Usuario completo tipado
  const [user, setUser] = useState<User | null>(null);

  async function loginService(correo: string, contraseña: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contraseña }),
    });
    return res.json();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    try {
      const data = await loginService(correo, contraseña);

      if (data.ok) {
        setUser({
          nombre: data.nombre,
          rol: data.rol,
        });
      } else {
        setResultado(data.message ?? "Credenciales inválidas");
      }
    } catch (err) {
      console.log(err);
      setResultado("Error de red o servidor caído");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setCorreo("");
    setContrasena("");
    setResultado(null);
    setLoading(false);
  }

  // ✅ Navegación por rol
  if (user?.rol === 1) return <AdminHome user={user} logout={logout} />;
  if (user?.rol === 2) return <SupervisorHome user={user} logout={logout} />;
  if (user?.rol === 3) return <MeseroHome user={user} logout={logout} />;

  return (
    
    <div className="h-screen w-full relative overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center">
      <div className=" inset-0 flex items-center justify-center h-full z-10 relative">
        <div className="shadow-2xl rounded-[61px] bg-[var(--secondary)] relative p-8 pt-[50px] pb-[50px] w-[539] h-[392]">
              <form className="flex flex-col items-center justify-center gap-5 " onSubmit={handleSubmit}>
                  <Input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@aqua.local"
                    required
                  />
                  <Input
                    id="contraseña"
                    type="password"
                    value={contraseña}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="••••••"
                    required
                  />

                <Button type="submit" disabled={loading}>
                  {loading ? "Verificando..." : "Iniciar Sesión"}
                </Button>
              </form>
            {resultado && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm w-full max-w-[400px] text-center">
            {resultado}
          </div>
          )}
        </div>
        
      </div>
      <WaveBackground/>
    </div>
  );
}

export default Login;
