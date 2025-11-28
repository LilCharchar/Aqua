import { useState } from "react";
import type { User } from "./types";
import { AdminHome } from "../screens/admin/adminHome";
import { MeseroHome } from "../screens/mesero/meseroHome";
import SupervisorApp from "./supervisor/supervisorApp";
import WaveBackground from "../src/components/wave-background";
import Input from "../src/components/ui/input";
import Button from "../src/components/ui/button";
import logoAqua from "../assets/logo-aqua.svg";
import ThemeToggle from "../src/components/ui/toggle";

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

    const body = await res
      .clone()
      .json()
      .catch(() => null);

    if (!res.ok) {
      throw new Error(body?.message ?? "No se pudo iniciar sesión");
    }

    return body ?? {};
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    try {
      const data = await loginService(correo, contraseña);

      if (data?.ok) {
        if (typeof data.rol === "number") {
          const nextUser: User = {
            id: data.userId,
            nombre: data.nombre,
            rol: data.rol,
          };
          setUser(nextUser);
          try {
            localStorage.setItem("user", JSON.stringify(nextUser));
          } catch {
            // ignore storage errors
          }
        } else {
          setResultado("Tu usuario no tiene un rol asignado");
        }
      } else {
        setResultado(data?.message ?? "Credenciales inválidas");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error de red o servidor caído";
      setResultado(message);
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
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
  }

  // ✅ Navegación por rol
  if (user?.rol === 1) return <AdminHome user={user} logout={logout} />;
  if (user?.rol === 2) return <SupervisorApp user={user} logout={logout} />;
  if (user?.rol === 3) return <MeseroHome user={user} logout={logout} />;

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div>
        <img className="w-80 h-auto" src={logoAqua} alt="aqua" />
      </div>
      <div className="w-full max-w-md mx-auto flex items-center justify-center z-10 relative">
        <div className="shadow-2xl rounded-2xl sm:rounded-[61px] bg-[var(--secondary)] relative w-full p-6 sm:p-10">
          <form
            className="flex flex-col items-center justify-center w-full gap-6 sm:gap-7"
            onSubmit={handleSubmit}
          >
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
            <div className="fixed bottom-4 left-4 right-4 sm:absolute sm:-bottom-16 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm w-full max-w-[400px] text-center">
              {resultado}
            </div>
          )}
        </div>
      </div>
      <WaveBackground />
    </div>
  );
}

export default Login;
