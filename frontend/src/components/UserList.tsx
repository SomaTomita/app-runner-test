import { useEffect, useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import type { CreateUserInput } from "../types";

export function UserList() {
  const { users, loading, error, fetchUsers, createUser, deleteUser } =
    useUserStore();
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Users</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ marginRight: "0.5rem", padding: "0.3rem" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={{ marginRight: "0.5rem", padding: "0.3rem" }}
          />
          <button type="submit">Create</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
                Name
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
                Email
              </th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  {user.name}
                </td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  {user.email}
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    borderBottom: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => handleDelete(user.id)}
                    style={{ color: "red" }}
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
