import apiClient from "../api/client";
import type { User, CreateUserInput, UpdateUserInput } from "../types";

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/users");
  return data;
}

export async function fetchUser(id: number): Promise<User> {
  const { data } = await apiClient.get<User>(`/api/users/${id}`);
  return data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>("/api/users", input);
  return data;
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<User> {
  const { data } = await apiClient.put<User>(`/api/users/${id}`, input);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/users/${id}`);
}
