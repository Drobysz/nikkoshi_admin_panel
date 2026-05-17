import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-100 text-slate-950">
        <Sidebar />
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
