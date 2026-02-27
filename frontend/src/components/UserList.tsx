import { useEffect, useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import type { CreateUserInput } from "../types";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  } as const,
  error: { color: "red" } as const,
  form: { marginBottom: "1rem" } as const,
  input: { marginRight: "0.5rem", padding: "0.3rem" } as const,
  table: { width: "100%", borderCollapse: "collapse" } as const,
  th: {
    textAlign: "left" as const,
    borderBottom: "1px solid #ddd",
    padding: "0.5rem",
  },
  thRight: {
    textAlign: "right" as const,
    borderBottom: "1px solid #ddd",
    padding: "0.5rem",
  },
  td: { padding: "0.5rem", borderBottom: "1px solid #eee" } as const,
  tdRight: {
    padding: "0.5rem",
    borderBottom: "1px solid #eee",
    textAlign: "right" as const,
  },
  deleteBtn: { color: "red" } as const,
};

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
    <section>
      <div style={styles.header}>
        <h2>Users</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            style={styles.input}
          />
          <button type="submit">Create</button>
        </form>
      ) : null}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.tdRight}>
                  <button
                    onClick={() => handleDelete(user.id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
