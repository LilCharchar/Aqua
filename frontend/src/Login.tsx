import { useState } from "react";

function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correo,
          contraseña: contrasena,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // login correcto
        setResultado(
          `OK. Usuario: ${data.correo ?? data.user?.correo ?? correo} Rol: ${
            data.rol ?? data.user?.rol ?? "sin rol"
          }`
        );
        // aquí podrías guardar token o user en estado global si ya lo devuelves
      } else {
        // login inválido
        setResultado(`Error: ${data.message ?? "Credenciales inválidas"}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setResultado("Error de red o servidor caído");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "320px",
        margin: "2rem auto",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Login Aqua POS</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <label htmlFor="correo">Correo</label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="caja1@aqua.local"
            required
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <div style={{ display: "grid", gap: "0.25rem" }}>
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••"
            required
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#0066ff",
            color: "white",
            border: "none",
            padding: "0.6rem",
            fontSize: "1rem",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>

      {resultado && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.9rem",
            backgroundColor: "#f5f5f5",
            padding: "0.5rem",
            borderRadius: "4px",
            wordBreak: "break-word",
          }}
        >
          {resultado}
        </div>
      )}
    </div>
  );
}

export default Login;
