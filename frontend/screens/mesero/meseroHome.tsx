import type { User } from "../types";
import Orders from "./orders";

type MeseroHomeProps = {
  user: User;
  logout: () => void;
};

export function MeseroHome({ user, logout }: MeseroHomeProps) {
  return <Orders user={user} logout={logout} />;
}
