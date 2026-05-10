export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Membership = {
  id: string;
  projectId: string;
  user: User;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: User;
  createdBy: User;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
};

export type Project = ProjectSummary & {
  members: Membership[];
  tasks: Task[];
};

export type DashboardSummary = {
  projectCount: number;
  totalTasks: number;
  assignedTasks: number;
  statusTotals: Record<TaskStatus, number>;
  overdueTasks: number;
  projectSummaries: Array<{
    projectId: string;
    projectName: string;
    totalTasks: number;
    statusTotals: Record<TaskStatus, number>;
    overdueTasks: number;
    progressPercent: number;
  }>;
};

export type ApiError = {
  code: string;
  message: string;
  fields?: Array<{ path: string; message: string }>;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data.error ?? { code: "REQUEST_FAILED", message: "Request failed" };
    throw { ...error, fields: data.fields } satisfies ApiError;
  }

  return data as T;
}

export const api = {
  me: () => apiRequest<User>("/auth/me"),
  signup: (body: { name: string; email: string; password: string }) =>
    apiRequest<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  searchUsers: (query: string) => apiRequest<User[]>(`/users?q=${encodeURIComponent(query)}`),
  listProjects: () => apiRequest<ProjectSummary[]>("/projects"),
  createProject: (body: { name: string; description?: string }) =>
    apiRequest<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  getProject: (projectId: string) => apiRequest<Project>(`/projects/${projectId}`),
  addMembership: (projectId: string, userId: string) =>
    apiRequest<Membership>(`/projects/${projectId}/memberships`, { method: "POST", body: JSON.stringify({ userId }) }),
  removeMembership: (projectId: string, userId: string) =>
    apiRequest<void>(`/projects/${projectId}/memberships/${userId}`, { method: "DELETE" }),
  createTask: (projectId: string, body: { title: string; description?: string; status: TaskStatus; assigneeId: string; dueDate: string }) =>
    apiRequest<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  updateTask: (projectId: string, taskId: string, body: Partial<{ title: string; description: string; status: TaskStatus; assigneeId: string; dueDate: string }>) =>
    apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask: (projectId: string, taskId: string) => apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
  dashboard: () => apiRequest<DashboardSummary>("/dashboard")
};
