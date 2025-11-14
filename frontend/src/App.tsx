import Login from "../screens/Login";
import OrdersPlayground from "../screens/dev/OrdersPlayground";

function App() {
  const showPlayground =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "lab";

  return showPlayground ? <OrdersPlayground /> : <Login />;
}

export default App;
