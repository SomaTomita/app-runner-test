import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserList } from "./UserList";
import { useUserStore } from "../stores/useUserStore";

vi.mock("../stores/useUserStore");

const mockStore = {
  users: [
    {
      id: 1,
      email: "alice@example.com",
      name: "Alice",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
  ],
  loading: false,
  error: null,
  fetchUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
};

describe("UserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.createUser.mockResolvedValue(undefined);
    vi.mocked(useUserStore).mockImplementation((selector: any) =>
      selector(mockStore),
    );
  });

  it("renders user list", () => {
    render(<UserList />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("calls fetchUsers on mount", () => {
    render(<UserList />);

    expect(mockStore.fetchUsers).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    vi.mocked(useUserStore).mockImplementation((selector: any) =>
      selector({ ...mockStore, loading: true, users: [] }),
    );

    render(<UserList />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    vi.mocked(useUserStore).mockImplementation((selector: any) =>
      selector({ ...mockStore, error: "Failed to fetch users" }),
    );

    render(<UserList />);

    expect(screen.getByText("Failed to fetch users")).toBeInTheDocument();
  });

  it("shows add user form on button click", async () => {
    const user = userEvent.setup();
    render(<UserList />);

    await user.click(screen.getByText("Add User"));

    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });

  it("calls createUser on form submit", async () => {
    const user = userEvent.setup();
    render(<UserList />);

    await user.click(screen.getByText("Add User"));
    await user.type(screen.getByPlaceholderText("Name"), "Bob");
    await user.type(screen.getByPlaceholderText("Email"), "bob@example.com");
    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockStore.createUser).toHaveBeenCalledWith({
        name: "Bob",
        email: "bob@example.com",
      });
    });
  });

  it("preserves form input after a failed create", async () => {
    mockStore.createUser.mockRejectedValue(new Error("Create failed"));
    const user = userEvent.setup();
    render(<UserList />);
    await user.click(screen.getByText("Add User"));
    await user.type(screen.getByPlaceholderText("Name"), "Bob");
    await user.type(screen.getByPlaceholderText("Email"), "bob@example.com");
    await user.click(screen.getByText("Create"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Email")).toHaveValue(
        "bob@example.com",
      ),
    );
    expect(screen.getByPlaceholderText("Name")).toHaveValue("Bob");
  });
});
