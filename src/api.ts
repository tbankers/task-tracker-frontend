const BASE = "/api";

interface ApiError {
  code: string;
  message: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  if (!res.ok) {
    const err: ApiError = body;
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return body as T;
}

// ---- Auth ----
export interface LoginResponse {
  token: string;
  user: UserResponse;
}
export interface UserResponse {
  user_id: string;
  email: string;
  username: string;
  created_at: string;
}

export const auth = {
  register: (data: {
    email: string;
    username: string;
    password: string;
  }) =>
    request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
};

// ---- Users ----
export interface User {
  user_id: string;
  email: string;
  username: string;
  created_at: string;
}

export const users = {
  getByEmail: (email: string) =>
    request<User>(`/users?email=${encodeURIComponent(email)}`),
  getById: (id: string) => request<User>(`/users/${id}`),
  create: (data: { username: string; email: string; password: string }) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  changePassword: (id: string, password: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),
};

// ---- Workspaces ----
export interface Workspace {
  workspace_id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export const workspaces = {
  listByUser: (userId: string) =>
    request<Workspace[]>(`/users/${userId}/workspaces`),
  get: (id: string) => request<Workspace>(`/workspaces/${id}`),
  create: (title: string) =>
    request<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  update: (id: string, title: string) =>
    request<Workspace>(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
  delete: (id: string) =>
    request<void>(`/workspaces/${id}`, { method: "DELETE" }),
};

// ---- Members ----
export type MemberRole = "guest" | "member" | "administrator";
export interface Member {
  user_id: string;
  workspace_id: string;
  role: MemberRole;
}

export const members = {
  add: (workspaceId: string, userId: string, role?: MemberRole) =>
    request<Member>(
      `/workspaces/${workspaceId}/workspace_members`,
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId, ...(role ? { role } : {}) }),
      }
    ),
  updateRole: (
    workspaceId: string,
    userId: string,
    role: MemberRole
  ) =>
    request<Member>(
      `/workspaces/${workspaceId}/workspace_members/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }
    ),
  remove: (workspaceId: string, userId: string) =>
    request<void>(
      `/workspaces/${workspaceId}/workspace_members/${userId}`,
      { method: "DELETE" }
    ),
  getRole: (workspaceId: string, userId: string) =>
    request<MemberRole>(
      `/workspaces/${workspaceId}/workspace_members/${userId}/role`
    ),
};

// ---- Boards ----
export interface Board {
  board_id: string;
  title: string;
  workspace_id: string;
  created_at: string;
  created_by: string | null;
}

export const boards = {
  listByWorkspace: (workspaceId: string) =>
    request<Board[]>(`/workspaces/${workspaceId}/boards`),
  get: (id: string) => request<Board>(`/boards/${id}`),
  create: (workspaceId: string, title: string) =>
    request<Board>(`/workspaces/${workspaceId}/boards`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  update: (id: string, title: string) =>
    request<Board>(`/boards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
  delete: (id: string) =>
    request<void>(`/boards/${id}`, { method: "DELETE" }),
};

// ---- Tasks ----
export type TaskStatus = "to_do" | "in_progress" | "done";
export interface Task {
  task_id: number;
  board_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const tasks = {
  listByBoard: (boardId: string) =>
    request<Task[]>(`/boards/${boardId}/tasks`),
  create: (boardId: string, title: string) =>
    request<Task>(`/boards/${boardId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateStatus: (taskId: number, status: TaskStatus) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (taskId: number) =>
    request<void>(`/tasks/${taskId}`, { method: "DELETE" }),
};
