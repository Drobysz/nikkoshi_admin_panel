import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Nikkoshi
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage Nikko temple and shrine articles.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
