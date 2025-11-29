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
  const [showVideo, setShowVideo] = useState(false);

  const videoUrl =
    import.meta.env.VITE_YOUTUBE_URL || null;
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
          const resolvedId =
            (typeof data.userId === "string" && data.userId) ||
            (typeof data.id === "string" && data.id) ||
            undefined;
          const nextUser: User = {
            id: resolvedId,
            userId: resolvedId,
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
      {videoUrl && (
        <button
          type="button"
          onClick={() => setShowVideo(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full bg-white/90 text-[#FF0000] px-5 py-3 shadow-2xl hover:bg-white hover:scale-105 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21.8 8s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.8C15.7 5 12 5 12 5h-.1s-3.7 0-6.9.1c-.4 0-1.3 0-2.1.8C2.3 6.5 2.2 8 2.2 8S2 9.6 2 11.3v1.4c0 1.7.2 3.3.2 3.3s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.1 7 .1 7 .1s3.7 0 6.9-.1c.4 0 1.3 0 2.1-.8.6-.6.8-2.1.8-2.1s.2-1.7.2-3.3v-1.4C22 9.6 21.8 8 21.8 8zm-12.8 6V8l5.7 3-5.7 3z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--primary)]">
            Video Aqua Storytelling
          </span>
        </button>
      )}
      {showVideo && videoUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[var(--secondary)] rounded-2xl shadow-2xl overflow-hidden">
            <button
              type="button"
              className="absolute top-4 right-4 bg-white/80 text-black rounded-full px-3 py-1 text-sm font-medium hover:bg-white"
              onClick={() => setShowVideo(false)}
            >
              Cerrar
            </button>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src={videoUrl}
                title="Video explicativo Aqua"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
