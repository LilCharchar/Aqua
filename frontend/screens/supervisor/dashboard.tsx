import type { User } from "../types";
import Separator from "../../src/components/separator";
import MetabaseDashboard from "../../src/components/MetabaseDashboard";

type SupervisorDashboardProps = {
  user: User;
};

export function Dashboard({ user }: SupervisorDashboardProps) {
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
              <span className=" text-3xl manrope-bold">Dashboard</span>
            </div>
          <Separator />
        </div>
      <div className="min-h-screen p-8">
        <MetabaseDashboard url="http://metabase-production-65c9.up.railway.app/public/dashboard/0c87ef7b-d668-4c32-a024-ab36f9487206"/>


      </div>
    </div>
  );
}
export default Dashboard;
