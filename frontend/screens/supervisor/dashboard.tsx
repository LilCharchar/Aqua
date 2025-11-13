import type { User } from "../types";
import Separator from "../../src/components/separator";
import MetabaseDashboard from "../../src/components/MetabaseDashboard";

type SupervisorDashboardProps = {
  user: User;
  logout: () => void;
};

export function Dashboard({ user, logout }: SupervisorDashboardProps) {
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
        <MetabaseDashboard url="http://metabase-production-fbed.up.railway.app/public/question/6a63da24-c75c-4449-83aa-6ccccb489bb5"/>
        <MetabaseDashboard url="http://metabase-production-fbed.up.railway.app/public/question/75057140-df95-4cdb-aa7a-a76dd40a7b42"/>
        <MetabaseDashboard url="http://metabase-production-fbed.up.railway.app/public/dashboard/5dfb104b-42aa-4588-87e9-28fb39dd1578"/>


      </div>
    </div>
  );
}
export default Dashboard;