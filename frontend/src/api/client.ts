import { demoApi, isDemoModeEnabled } from "../demo/demoApi";

export type Role = "ADMIN" | "MEMBER";
export type ProjectRole = "OWNER" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskAssignmentType = "USER" | "ROLE";
export type TaskIssueType = "EPIC" | "STORY" | "TASK" | "BUG";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
export type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
export type TaskActivityType = "CREATED" | "UPDATED" | "COMMENTED";

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
  role: ProjectRole;
  user: User;
  createdAt: string;
};

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  issueType: TaskIssueType;
  priority: TaskPriority;
  assignmentType: TaskAssignmentType;
  assignee: User | null;
  assigneeRole: ProjectRole | null;
  assignmentLabel: string;
  createdBy: User;
  dueDate: string;
  sprintId: string | null;
  storyPoints: number;
  labels: string[];
  sortOrder: number;
  estimatedMinutes: number;
  trackedMinutes: number;
  timerStartedAt: string | null;
  timerUserId: string | null;
  recurrencePattern: RecurrencePattern;
  recurrenceParentTaskId: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  body: string;
  author: User;
  createdAt: string;
  updatedAt: string;
};

export type TaskActivity = {
  id: string;
  taskId: string;
  actor: User;
  type: TaskActivityType;
  message: string;
  createdAt: string;
};

export type TaskDetail = Task & {
  comments: TaskComment[];
  activity: TaskActivity[];
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
  sprints: Sprint[];
  tasks: Task[];
};

export type DashboardSummary = {
  projectCount: number;
  totalTasks: number;
  assignedTasks: number;
  statusTotals: Record<TaskStatus, number>;
  overdueTasks: number;
  estimatedMinutesTotal: number;
  trackedMinutesTotal: number;
  activeTimerCount: number;
  recurringTaskCount: number;
  completionRate: number;
  memberWorkload: Array<{
    userId: string;
    name: string;
    assignedTasks: number;
    completedTasks: number;
    trackedMinutes: number;
  }>;
  projectSummaries: Array<{
    projectId: string;
    projectName: string;
    totalTasks: number;
    statusTotals: Record<TaskStatus, number>;
    overdueTasks: number;
    progressPercent: number;
    estimatedMinutes: number;
    trackedMinutes: number;
    recurringTaskCount: number;
    activeTimerCount: number;
  }>;
};

export type ApiError = {
  code: string;
  message: string;
  fields?: Array<{ path: string; message: string }>;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

function createApiError({
  code,
  message,
  fields
}: ApiError): Error & ApiError {
  const error = new Error(message) as Error & ApiError;
  error.code = code;
  error.fields = fields;
  return error;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  } catch {
    throw createApiError({
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Check the Railway backend URL and CORS settings.",
      fields: undefined
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");
  const data = isJsonResponse ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const error = typeof data === "object" && data !== null && "error" in data
      ? ((data as { error?: ApiError }).error ?? { code: "REQUEST_FAILED", message: "Request failed" })
      : { code: "REQUEST_FAILED", message: "Request failed" };

    throw createApiError({
      ...error,
      fields: typeof data === "object" && data !== null && "fields" in data
        ? (data as { fields?: Array<{ path: string; message: string }> }).fields
        : undefined
    });
  }

  if (!isJsonResponse) {
    throw createApiError({
      code: "INVALID_RESPONSE",
      message: "Unexpected response from server. Verify the frontend API URL points to the backend /api endpoint.",
      fields: undefined
    });
  }

  return data as T;
}

export const api = {
  me: () => isDemoModeEnabled() ? demoApi.me() : apiRequest<User>("/auth/me"),
  signup: (body: { name: string; email: string; password: string }) =>
    isDemoModeEnabled() ? demoApi.signup(body) : apiRequest<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    isDemoModeEnabled() ? demoApi.login(body) : apiRequest<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => isDemoModeEnabled() ? demoApi.logout() : apiRequest<void>("/auth/logout", { method: "POST" }),
  searchUsers: (query: string) => isDemoModeEnabled() ? demoApi.searchUsers(query) : apiRequest<User[]>(`/users?q=${encodeURIComponent(query)}`),
  listProjects: () => isDemoModeEnabled() ? demoApi.listProjects() : apiRequest<ProjectSummary[]>("/projects"),
  createProject: (body: { name: string; description?: string }) =>
    isDemoModeEnabled() ? demoApi.createProject(body) : apiRequest<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  getProject: (projectId: string) => isDemoModeEnabled() ? demoApi.getProject(projectId) : apiRequest<Project>(`/projects/${projectId}`),
  addMembership: (projectId: string, userId: string, role: ProjectRole) =>
    isDemoModeEnabled()
      ? demoApi.addMembership(projectId, userId, role)
      : apiRequest<Membership>(`/projects/${projectId}/memberships`, { method: "POST", body: JSON.stringify({ userId, role }) }),
  updateMembership: (projectId: string, userId: string, role: ProjectRole) =>
    isDemoModeEnabled()
      ? demoApi.updateMembership(projectId, userId, role)
      : apiRequest<Membership>(`/projects/${projectId}/memberships/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMembership: (projectId: string, userId: string) =>
    isDemoModeEnabled() ? demoApi.removeMembership(projectId, userId) : apiRequest<void>(`/projects/${projectId}/memberships/${userId}`, { method: "DELETE" }),
  createTask: (
    projectId: string,
    body: {
      title: string;
      description?: string;
      status: TaskStatus;
      issueType: TaskIssueType;
      priority: TaskPriority;
      assignmentType: TaskAssignmentType;
      assigneeId?: string;
      assigneeRole?: ProjectRole;
      dueDate: string;
      sprintId?: string | null;
      storyPoints: number;
      labels: string[];
      estimatedMinutes: number;
      recurrencePattern: RecurrencePattern;
    }
  ) =>
    isDemoModeEnabled() ? demoApi.createTask(projectId, body) : apiRequest<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  updateTask: (
    projectId: string,
    taskId: string,
    body: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      issueType: TaskIssueType;
      priority: TaskPriority;
      assignmentType: TaskAssignmentType;
      assigneeId: string;
      assigneeRole: ProjectRole;
      dueDate: string;
      sprintId: string | null;
      storyPoints: number;
      labels: string[];
      sortOrder: number;
      estimatedMinutes: number;
      trackedMinutesDelta: number;
      timerAction: "START" | "STOP";
      recurrencePattern: RecurrencePattern;
    }>
  ) =>
    isDemoModeEnabled() ? demoApi.updateTask(projectId, taskId, body) : apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),
  getTask: (projectId: string, taskId: string) => isDemoModeEnabled() ? demoApi.getTask(projectId, taskId) : apiRequest<TaskDetail>(`/projects/${projectId}/tasks/${taskId}`),
  listTaskComments: (projectId: string, taskId: string) => isDemoModeEnabled() ? demoApi.listTaskComments(projectId, taskId) : apiRequest<TaskComment[]>(`/projects/${projectId}/tasks/${taskId}/comments`),
  addTaskComment: (projectId: string, taskId: string, body: { body: string }) =>
    isDemoModeEnabled()
      ? demoApi.addTaskComment(projectId, taskId, body)
      : apiRequest<TaskComment>(`/projects/${projectId}/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(body) }),
  listTaskActivity: (projectId: string, taskId: string) => isDemoModeEnabled() ? demoApi.listTaskActivity(projectId, taskId) : apiRequest<TaskActivity[]>(`/projects/${projectId}/tasks/${taskId}/activity`),
  listSprints: (projectId: string) => isDemoModeEnabled() ? demoApi.listSprints(projectId) : apiRequest<Sprint[]>(`/projects/${projectId}/sprints`),
  createSprint: (
    projectId: string,
    body: { name: string; goal?: string; status?: SprintStatus; startDate?: string | null; endDate?: string | null }
  ) => isDemoModeEnabled() ? demoApi.createSprint(projectId, body) : apiRequest<Sprint>(`/projects/${projectId}/sprints`, { method: "POST", body: JSON.stringify(body) }),
  updateSprint: (
    projectId: string,
    sprintId: string,
    body: Partial<{ name: string; goal: string; status: SprintStatus; startDate: string | null; endDate: string | null }>
  ) => isDemoModeEnabled() ? demoApi.updateSprint(projectId, sprintId, body) : apiRequest<Sprint>(`/projects/${projectId}/sprints/${sprintId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask: (projectId: string, taskId: string) => isDemoModeEnabled() ? demoApi.deleteTask(projectId, taskId) : apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
  dashboard: () => isDemoModeEnabled() ? demoApi.dashboard() : apiRequest<DashboardSummary>("/dashboard")
};
