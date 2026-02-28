import { create } from "zustand";
import type { User, CreateUserInput, UpdateUserInput } from "../types";
import {
  fetchUsers as apiFetchUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
} from "../services/userService";

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (input: CreateUserInput) => Promise<void>;
  updateUser: (id: number, input: UpdateUserInput) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await apiFetchUsers();
      set({ users, loading: false });
    } catch {
      set({ error: "Failed to fetch users", loading: false });
    }
  },

  createUser: async (input) => {
    set({ error: null });
    try {
      const user = await apiCreateUser(input);
      set((state) => ({ users: [user, ...state.users] }));
    } catch {
      set({ error: "Failed to create user" });
    }
  },

  updateUser: async (id, input) => {
    set({ error: null });
    try {
      const updated = await apiUpdateUser(id, input);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
      }));
    } catch {
      set({ error: "Failed to update user" });
    }
  },

  deleteUser: async (id) => {
    set({ error: null });
    try {
      await apiDeleteUser(id);
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch {
      set({ error: "Failed to delete user" });
    }
  },
}));
