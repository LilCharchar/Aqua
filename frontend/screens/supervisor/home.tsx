import type { User } from "../types";
import Separator from "../../src/components/separator";

type SupervisorHomeProps = {
  user: User;
  logout: () => void;
};

export function Home({ user, logout }: SupervisorHomeProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <div className="m-10">
                <div className="flex items-center gap-4">
                  <span className="text-xl manrope-bold">{user.nombre}</span>
                  <div className="ml-auto">
                    <span className="text-s text-[var(--text-primary)]">Supervisor</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className=" text-3xl manrope-bold">Arqueo de caja</span>
                </div>
                
                <Separator />
              </div>
    </div>
  );
}
export default Home;