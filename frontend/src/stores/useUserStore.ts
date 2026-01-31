import { create } from "zustand";
import type { User, CreateUserInput, UpdateUserInput } from "../types";
import * as userService from "../services/userService";

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
      const users = await userService.fetchUsers();
      set({ users, loading: false });
    } catch (err) {
      set({ error: "Failed to fetch users", loading: false });
    }
  },

  createUser: async (input) => {
    set({ error: null });
    try {
      const user = await userService.createUser(input);
      set((state) => ({ users: [user, ...state.users] }));
    } catch (err) {
      set({ error: "Failed to create user" });
    }
  },

  updateUser: async (id, input) => {
    set({ error: null });
    try {
      const updated = await userService.updateUser(id, input);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
      }));
    } catch (err) {
      set({ error: "Failed to update user" });
    }
  },

  deleteUser: async (id) => {
    set({ error: null });
    try {
      await userService.deleteUser(id);
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err) {
      set({ error: "Failed to delete user" });
    }
  },
}));
