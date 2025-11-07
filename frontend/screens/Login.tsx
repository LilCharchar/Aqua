import { useState } from "react";
import type { User } from "./types";
import { AdminHome } from "../screens/admin/adminHome";
import { SupervisorHome } from "../screens/supervisor/supervisorHome";
import { MeseroHome } from "../screens/mesero/meseroHome";

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

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0077ff 0%, #00bfff 100%)",
      padding: "1rem",
    },
    card: {
      backgroundColor: "white",
      width: "100%",
      maxWidth: "380px",
      padding: "2rem",
      borderRadius: "14px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
      animation: "fadeIn 0.5s ease",
    },
    title: {
      fontSize: "1.8rem",
      marginBottom: "1.5rem",
      color: "#333",
      fontWeight: "600",
    },
    form: {
      display: "grid",
      gap: "1rem",
    },
    inputGroup: {
      display: "grid",
      gap: "0.4rem",
    },
    label: {
      fontSize: "0.9rem",
      fontWeight: "500",
      color: "#444",
    },
    input: {
      padding: "0.75rem",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "1rem",
      outline: "none",
      transition: "border 0.2s",
    },
    button: {
      marginTop: "0.5rem",
      padding: "0.9rem",
      borderRadius: "8px",
      border: "none",
      background: "#0077ff",
      color: "white",
      fontSize: "1.05rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "0.2s",
    },
    result: {
      marginTop: "1rem",
      fontSize: "0.95rem",
      background: "#f3f3f3",
      padding: "0.6rem",
      borderRadius: "8px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Aqua POS</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@aqua.local"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>

        {resultado && <p style={styles.result}>{resultado}</p>}
      </div>
    </div>
  );
}

export default Login;
