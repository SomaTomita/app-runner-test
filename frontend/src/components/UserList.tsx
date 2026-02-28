import { useEffect, useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import type { CreateUserInput } from "../types";

export function UserList() {
  const users = useUserStore((s) => s.users);
  const loading = useUserStore((s) => s.loading);
  const error = useUserStore((s) => s.error);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const createUser = useUserStore((s) => s.createUser);
  const deleteUser = useUserStore((s) => s.deleteUser);
  const [form, setForm] = useState<CreateUserInput>({ email: "", name: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(form);
    setForm({ email: "", name: "" });
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this user?")) {
      await deleteUser(id);
    }
  };

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          Users
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 active:bg-primary-800"
        >
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-600 dark:text-danger-400"
        >
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-4 animate-slide-down rounded-lg border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Name"
              aria-label="Name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              autoComplete="name"
              className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 transition-colors duration-150 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500"
            />
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              autoComplete="email"
              className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 transition-colors duration-150 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 active:bg-primary-800"
            >
              Create
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Loading...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 shadow-sm dark:border-surface-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">
                  Email
                </th>
                <th className="px-4 py-3 text-right font-medium text-surface-600 dark:text-surface-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="bg-white transition-colors duration-150 hover:bg-surface-50 dark:bg-surface-900 dark:hover:bg-surface-800/50"
                >
                  <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-100">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-sm text-danger-600 transition-colors duration-150 hover:text-danger-500 dark:text-danger-500 dark:hover:text-danger-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
