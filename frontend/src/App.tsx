import Login from "../screens/Login";
import OrdersPlayground from "../screens/dev/OrdersPlayground";
import { Toaster } from "sonner";

function App() {
  const showPlayground =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "lab";

  return (
    <>
      {showPlayground ? <OrdersPlayground /> : <Login />}
      <Toaster position="bottom-right" />
    </>
    );
}

export default App;
