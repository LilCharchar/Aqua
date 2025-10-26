import { useEffect, useState } from 'react';

interface ApiResponse {
  message: string;
}

function App() {
  const [mensaje, setMensaje] = useState<string>("Cargando...");

  useEffect(() => {
    fetch("http://localhost:5000/api/hello")
      .then(res => res.json())
      .then((data: ApiResponse) => setMensaje(data.message))
      .catch(() => setMensaje("Error al conectar con el backend 😢"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "50px" }}>
      <h1>Frontend React + NestJS</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;
