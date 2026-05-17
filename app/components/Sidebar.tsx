"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearAuth } from "@/lib/auth";

const navItems = [
  { href: "/articles", label: "Articles" },
  { href: "/admins", label: "Admins" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    } catch {
      // Logout should clear local state even if the token was already revoked.
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Nikkoshi
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          Admin Panel
        </h1>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
      >
        Logout
      </button>
    </aside>
  );
}
