"use client";

import { useEffect, useState } from "react";
import { apiRequest, formatApiError, unwrapData } from "@/lib/api";
import type { ApiCollection, ApiResource, User } from "@/types/api";

type AdminForm = {
  name: string;
  password: string;
  password_confirmation: string;
};

const emptyForm: AdminForm = {
  name: "",
  password: "",
  password_confirmation: "",
};

export default function AdminsManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ApiCollection<User>>("/users");
      setUsers(unwrapData<User[]>(response));
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setMessage("");
    setError("");
    setForm({
      name: user.name,
      password: "",
      password_confirmation: "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Admin name is required.");
      setSaving(false);
      return;
    }

    if (!editingId && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSaving(false);
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("Password confirmation does not match.");
      setSaving(false);
      return;
    }

    const body: Record<string, string> = { name: form.name.trim() };
    if (form.password) {
      body.password = form.password;
      body.password_confirmation = form.password_confirmation;
    }

    try {
      if (editingId) {
        await apiRequest<ApiResource<User>>(`/users/${editingId}`, {
          method: "PATCH",
          body,
        });
        setMessage("Admin updated.");
      } else {
        await apiRequest<ApiResource<User>>("/auth/register", {
          method: "POST",
          body,
        });
        setMessage("Admin created.");
      }

      resetForm();
      await loadUsers();
    } catch (submitError) {
      setError(formatApiError(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(`Delete admin "${user.name}"?`);
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest<void>(`/users/${user.id}`, { method: "DELETE" });
      setMessage("Admin deleted.");
      await loadUsers();
    } catch (deleteError) {
      setError(formatApiError(deleteError));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Admins</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage admin users for the panel.
          </p>
        </div>
      </header>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {editingId ? "Edit admin" : "Create admin"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Password {editingId ? "(optional)" : ""}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Confirm password {editingId ? "(optional)" : ""}
            </span>
            <input
              type="password"
              value={form.password_confirmation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password_confirmation: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <div className="flex items-end gap-3 md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
              {saving ? "Saving..." : editingId ? "Update admin" : "Create admin"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-500">Loading admins...</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">No admins found.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {user.id}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-950">
                    {user.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(user)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
