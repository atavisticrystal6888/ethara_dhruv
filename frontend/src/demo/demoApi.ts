import type {
  DashboardSummary,
  Membership,
  Project,
  ProjectRole,
  ProjectSummary,
  RecurrencePattern,
  Role,
  Sprint,
  SprintStatus,
  Task,
  TaskActivity,
  TaskAssignmentType,
  TaskComment,
  TaskDetail,
  TaskIssueType,
  TaskPriority,
  TaskStatus,
  User
} from "../api/client";

const demoModeStorageKey = "fswa-demo-mode";
const timestamp = "2099-06-01T09:00:00.000Z";

type DemoProject = Omit<Project, "tasks"> & {
  tasks: TaskDetail[];
};

type DemoState = {
  currentUser: User;
  users: User[];
  projects: DemoProject[];
  nextProjectId: number;
  nextTaskId: number;
  nextSprintId: number;
  nextCommentId: number;
  nextActivityId: number;
};

type UpdateTaskPayload = Partial<{
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
}>;

let demoState: DemoState | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function inBrowser() {
  return typeof window !== "undefined";
}

export function isDemoModeEnabled() {
  return inBrowser() && window.localStorage.getItem(demoModeStorageKey) === "1";
}

export function enableDemoMode() {
  if (inBrowser()) {
    window.localStorage.setItem(demoModeStorageKey, "1");
  }
  demoState = createDemoState();
}

export function disableDemoMode() {
  if (inBrowser()) {
    window.localStorage.removeItem(demoModeStorageKey);
  }
  demoState = null;
}

function getDemoState() {
  demoState ??= createDemoState();
  return demoState;
}

function toTask(task: TaskDetail): Task {
  const { comments, activity, ...rest } = task;
  return rest;
}

function toProject(project: DemoProject): Project {
  return {
    ...project,
    tasks: project.tasks.map(toTask)
  };
}

function buildSummary(project: DemoProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdById: project.createdById,
    memberCount: project.members.length,
    taskCount: project.tasks.length,
    createdAt: project.createdAt
  };
}

function orderedTasks(tasks: TaskDetail[]) {
  return [...tasks].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

function createDemoState(): DemoState {
  const currentUser: User = {
    id: "user-1",
    name: "Avery",
    email: "avery@example.com",
    role: "ADMIN",
    createdAt: timestamp
  };
  const teammate: User = {
    id: "user-2",
    name: "Maya",
    email: "maya@example.com",
    role: "MEMBER",
    createdAt: timestamp
  };
  const manager: User = {
    id: "user-3",
    name: "Jordan",
    email: "jordan@example.com",
    role: "MEMBER",
    createdAt: timestamp
  };
  const sprint: Sprint = {
    id: "sprint-1",
    projectId: "project-1",
    name: "Sprint 12",
    goal: "Stabilize the release candidate",
    status: "ACTIVE",
    startDate: "2099-06-01",
    endDate: "2099-06-14",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const users = [currentUser, teammate, manager];
  const members: Membership[] = [
    { id: "membership-1", projectId: "project-1", role: "OWNER", user: currentUser, createdAt: timestamp },
    { id: "membership-2", projectId: "project-1", role: "MEMBER", user: teammate, createdAt: timestamp },
    { id: "membership-3", projectId: "project-1", role: "MANAGER", user: manager, createdAt: timestamp }
  ];

  const tasks: TaskDetail[] = [
    {
      id: "task-1",
      projectId: "project-1",
      title: "Refine board ordering",
      description: "Add persistent ordering controls so the active board can be re-sequenced without leaving the workspace.",
      status: "TODO",
      issueType: "STORY",
      priority: "HIGH",
      assignmentType: "USER",
      assignee: currentUser,
      assigneeRole: null,
      assignmentLabel: currentUser.name,
      createdBy: teammate,
      dueDate: "2099-06-12",
      sprintId: null,
      storyPoints: 5,
      labels: ["planning", "ux"],
      sortOrder: 1,
      estimatedMinutes: 240,
      trackedMinutes: 90,
      timerStartedAt: null,
      timerUserId: null,
      recurrencePattern: "NONE",
      recurrenceParentTaskId: null,
      isOverdue: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      comments: [
        {
          id: "comment-1",
          taskId: "task-1",
          body: "Need final QA sign-off before we ship the board polish.",
          author: teammate,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ],
      activity: [
        {
          id: "activity-1",
          taskId: "task-1",
          actor: teammate,
          type: "CREATED",
          message: "Created issue",
          createdAt: timestamp
        }
      ]
    },
    {
      id: "task-2",
      projectId: "project-1",
      title: "Polish backlog handoff",
      description: "Make sure backlog-to-sprint moves stay readable on dense boards.",
      status: "TODO",
      issueType: "TASK",
      priority: "MEDIUM",
      assignmentType: "ROLE",
      assignee: null,
      assigneeRole: "OWNER",
      assignmentLabel: "Owners",
      createdBy: currentUser,
      dueDate: "2099-06-15",
      sprintId: null,
      storyPoints: 3,
      labels: ["backlog"],
      sortOrder: 2,
      estimatedMinutes: 120,
      trackedMinutes: 30,
      timerStartedAt: null,
      timerUserId: null,
      recurrencePattern: "NONE",
      recurrenceParentTaskId: null,
      isOverdue: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      comments: [],
      activity: [
        {
          id: "activity-2",
          taskId: "task-2",
          actor: currentUser,
          type: "CREATED",
          message: "Created issue",
          createdAt: timestamp
        }
      ]
    },
    {
      id: "task-3",
      projectId: "project-1",
      title: "Review sprint scope",
      description: "Check that the active sprint only carries work that is ready for execution.",
      status: "IN_PROGRESS",
      issueType: "BUG",
      priority: "CRITICAL",
      assignmentType: "USER",
      assignee: currentUser,
      assigneeRole: null,
      assignmentLabel: currentUser.name,
      createdBy: teammate,
      dueDate: "2099-06-10",
      sprintId: sprint.id,
      storyPoints: 8,
      labels: ["release", "qa"],
      sortOrder: 3,
      estimatedMinutes: 360,
      trackedMinutes: 135,
      timerStartedAt: "2099-06-02T10:00:00.000Z",
      timerUserId: currentUser.id,
      recurrencePattern: "NONE",
      recurrenceParentTaskId: null,
      isOverdue: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      comments: [],
      activity: [
        {
          id: "activity-3",
          taskId: "task-3",
          actor: teammate,
          type: "UPDATED",
          message: "Moved issue into the active sprint",
          createdAt: timestamp
        }
      ]
    },
    {
      id: "task-4",
      projectId: "project-1",
      title: "Archive launch checklist",
      description: "Close out the last release notes cleanup.",
      status: "DONE",
      issueType: "TASK",
      priority: "LOW",
      assignmentType: "USER",
      assignee: teammate,
      assigneeRole: null,
      assignmentLabel: teammate.name,
      createdBy: currentUser,
      dueDate: "2099-06-18",
      sprintId: sprint.id,
      storyPoints: 2,
      labels: ["ops"],
      sortOrder: 4,
      estimatedMinutes: 60,
      trackedMinutes: 60,
      timerStartedAt: null,
      timerUserId: null,
      recurrencePattern: "NONE",
      recurrenceParentTaskId: null,
      isOverdue: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      comments: [],
      activity: [
        {
          id: "activity-4",
          taskId: "task-4",
          actor: currentUser,
          type: "UPDATED",
          message: "Completed issue",
          createdAt: timestamp
        }
      ]
    }
  ];

  return {
    currentUser,
    users,
    projects: [
      {
        id: "project-1",
        name: "Launch control",
        description: "Coordinate the final board rebuild, backlog cleanup, and workspace polish from one place.",
        createdById: currentUser.id,
        memberCount: members.length,
        taskCount: tasks.length,
        createdAt: timestamp,
        members,
        sprints: [sprint],
        tasks
      }
    ],
    nextProjectId: 2,
    nextTaskId: 5,
    nextSprintId: 2,
    nextCommentId: 2,
    nextActivityId: 5
  };
}

function findProject(projectId: string) {
  const project = getDemoState().projects.find((entry) => entry.id === projectId);
  if (!project) {
    throw new Error("Project not found in demo mode");
  }
  return project;
}

function findTask(projectId: string, taskId: string) {
  const task = findProject(projectId).tasks.find((entry) => entry.id === taskId);
  if (!task) {
    throw new Error("Task not found in demo mode");
  }
  return task;
}

function syncProjectCounts(project: DemoProject) {
  project.memberCount = project.members.length;
  project.taskCount = project.tasks.length;
}

function addActivity(task: TaskDetail, actor: User, type: TaskActivity["type"], message: string) {
  const state = getDemoState();
  task.activity.unshift({
    id: `activity-${state.nextActivityId++}`,
    taskId: task.id,
    actor,
    type,
    message,
    createdAt: new Date().toISOString()
  });
  task.updatedAt = new Date().toISOString();
}

function buildDashboardSummary(): DashboardSummary {
  const state = getDemoState();
  const tasks = state.projects.flatMap((project) => project.tasks);
  const statusTotals = tasks.reduce<Record<TaskStatus, number>>(
    (totals, task) => ({ ...totals, [task.status]: totals[task.status] + 1 }),
    { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
  );
  const trackedMinutesTotal = tasks.reduce((total, task) => total + task.trackedMinutes, 0);
  const estimatedMinutesTotal = tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const completionRate = tasks.length === 0 ? 0 : Math.round((statusTotals.DONE / tasks.length) * 100);

  return {
    projectCount: state.projects.length,
    totalTasks: tasks.length,
    assignedTasks: tasks.filter((task) => task.assignee?.id === state.currentUser.id).length,
    statusTotals,
    overdueTasks: tasks.filter((task) => task.isOverdue).length,
    estimatedMinutesTotal,
    trackedMinutesTotal,
    activeTimerCount: tasks.filter((task) => Boolean(task.timerStartedAt)).length,
    recurringTaskCount: tasks.filter((task) => task.recurrencePattern !== "NONE").length,
    completionRate,
    memberWorkload: state.users.map((user) => {
      const assignedTasks = tasks.filter((task) => task.assignee?.id === user.id);
      return {
        userId: user.id,
        name: user.name,
        assignedTasks: assignedTasks.length,
        completedTasks: assignedTasks.filter((task) => task.status === "DONE").length,
        trackedMinutes: assignedTasks.reduce((total, task) => total + task.trackedMinutes, 0)
      };
    }),
    projectSummaries: state.projects.map((project) => {
      const projectStatusTotals = project.tasks.reduce<Record<TaskStatus, number>>(
        (totals, task) => ({ ...totals, [task.status]: totals[task.status] + 1 }),
        { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
      );
      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: project.tasks.length,
        statusTotals: projectStatusTotals,
        overdueTasks: project.tasks.filter((task) => task.isOverdue).length,
        progressPercent: project.tasks.length === 0 ? 0 : Math.round((projectStatusTotals.DONE / project.tasks.length) * 100),
        estimatedMinutes: project.tasks.reduce((total, task) => total + task.estimatedMinutes, 0),
        trackedMinutes: project.tasks.reduce((total, task) => total + task.trackedMinutes, 0),
        recurringTaskCount: project.tasks.filter((task) => task.recurrencePattern !== "NONE").length,
        activeTimerCount: project.tasks.filter((task) => Boolean(task.timerStartedAt)).length
      };
    })
  };
}

export const demoApi = {
  me: async () => clone(getDemoState().currentUser),
  signup: async (body: { name: string; email: string; password: string }) => {
    const state = getDemoState();
    state.currentUser.name = body.name || state.currentUser.name;
    state.currentUser.email = body.email || state.currentUser.email;
    return { user: clone(state.currentUser) };
  },
  login: async (body: { email: string; password: string }) => {
    const state = getDemoState();
    if (body.email) {
      state.currentUser.email = body.email;
    }
    return { user: clone(state.currentUser) };
  },
  logout: async () => {
    disableDemoMode();
  },
  searchUsers: async (query: string) => {
    const normalized = query.trim().toLowerCase();
    return clone(getDemoState().users.filter((user) => normalized.length === 0 || user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized)));
  },
  listProjects: async () => clone(getDemoState().projects.map(buildSummary)),
  createProject: async (body: { name: string; description?: string }) => {
    const state = getDemoState();
    const projectId = `project-${state.nextProjectId++}`;
    const project: DemoProject = {
      id: projectId,
      name: body.name,
      description: body.description ?? null,
      createdById: state.currentUser.id,
      memberCount: 1,
      taskCount: 0,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: `membership-${projectId}-1`,
          projectId,
          role: "OWNER",
          user: state.currentUser,
          createdAt: new Date().toISOString()
        }
      ],
      sprints: [],
      tasks: []
    };
    state.projects.unshift(project);
    return clone(toProject(project));
  },
  getProject: async (projectId: string) => clone(toProject(findProject(projectId))),
  addMembership: async (projectId: string, userId: string, role: ProjectRole) => {
    const state = getDemoState();
    const project = findProject(projectId);
    const user = state.users.find((entry) => entry.id === userId);
    if (!user) {
      throw new Error("User not found in demo mode");
    }
    const membership: Membership = {
      id: `membership-${projectId}-${project.members.length + 1}`,
      projectId,
      role,
      user,
      createdAt: new Date().toISOString()
    };
    project.members.push(membership);
    syncProjectCounts(project);
    return clone(membership);
  },
  updateMembership: async (projectId: string, userId: string, role: ProjectRole) => {
    const project = findProject(projectId);
    const membership = project.members.find((entry) => entry.user.id === userId);
    if (!membership) {
      throw new Error("Membership not found in demo mode");
    }
    membership.role = role;
    return clone(membership);
  },
  removeMembership: async (projectId: string, userId: string) => {
    const project = findProject(projectId);
    project.members = project.members.filter((entry) => entry.user.id !== userId);
    syncProjectCounts(project);
  },
  createTask: async (
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
  ) => {
    const state = getDemoState();
    const project = findProject(projectId);
    const assignee = body.assigneeId ? state.users.find((entry) => entry.id === body.assigneeId) ?? null : null;
    const laneTasks = orderedTasks(project.tasks.filter((task) => task.status === body.status));
    const task: TaskDetail = {
      id: `task-${state.nextTaskId++}`,
      projectId,
      title: body.title,
      description: body.description ?? null,
      status: body.status,
      issueType: body.issueType,
      priority: body.priority,
      assignmentType: body.assignmentType,
      assignee,
      assigneeRole: body.assigneeRole ?? null,
      assignmentLabel: body.assignmentType === "ROLE" ? `${body.assigneeRole ?? "MEMBER"} group` : assignee?.name ?? "Unassigned",
      createdBy: state.currentUser,
      dueDate: body.dueDate,
      sprintId: body.sprintId ?? null,
      storyPoints: body.storyPoints,
      labels: body.labels,
      sortOrder: laneTasks.length === 0 ? Date.now() : Math.max(...laneTasks.map((entry) => entry.sortOrder)) + 1,
      estimatedMinutes: body.estimatedMinutes,
      trackedMinutes: 0,
      timerStartedAt: null,
      timerUserId: null,
      recurrencePattern: body.recurrencePattern,
      recurrenceParentTaskId: null,
      isOverdue: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      activity: []
    };
    addActivity(task, state.currentUser, "CREATED", "Created issue");
    project.tasks.push(task);
    syncProjectCounts(project);
    return clone(toTask(task));
  },
  updateTask: async (projectId: string, taskId: string, body: UpdateTaskPayload) => {
    const task = findTask(projectId, taskId);
    const state = getDemoState();

    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.status !== undefined) task.status = body.status;
    if (body.issueType !== undefined) task.issueType = body.issueType;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.assignmentType !== undefined) task.assignmentType = body.assignmentType;
    if (body.assigneeId !== undefined) {
      task.assignee = state.users.find((entry) => entry.id === body.assigneeId) ?? null;
      task.assignmentLabel = task.assignee?.name ?? "Unassigned";
    }
    if (body.assigneeRole !== undefined) {
      task.assigneeRole = body.assigneeRole;
      if (task.assignmentType === "ROLE") {
        task.assignmentLabel = `${body.assigneeRole} group`;
      }
    }
    if (body.dueDate !== undefined) task.dueDate = body.dueDate;
    if (body.sprintId !== undefined) task.sprintId = body.sprintId;
    if (body.storyPoints !== undefined) task.storyPoints = body.storyPoints;
    if (body.labels !== undefined) task.labels = body.labels;
    if (body.sortOrder !== undefined) task.sortOrder = body.sortOrder;
    if (body.estimatedMinutes !== undefined) task.estimatedMinutes = body.estimatedMinutes;
    if (body.recurrencePattern !== undefined) task.recurrencePattern = body.recurrencePattern;
    if (body.trackedMinutesDelta !== undefined) task.trackedMinutes += body.trackedMinutesDelta;
    if (body.timerAction === "START") {
      task.timerStartedAt = new Date().toISOString();
      task.timerUserId = state.currentUser.id;
    }
    if (body.timerAction === "STOP") {
      task.timerStartedAt = null;
      task.timerUserId = null;
    }

    task.isOverdue = task.status !== "DONE" && new Date(`${task.dueDate}T00:00:00`).getTime() < Date.now();
    addActivity(task, state.currentUser, "UPDATED", "Updated issue details");
    return clone(toTask(task));
  },
  getTask: async (projectId: string, taskId: string) => clone(findTask(projectId, taskId)),
  listTaskComments: async (projectId: string, taskId: string) => clone(findTask(projectId, taskId).comments),
  addTaskComment: async (projectId: string, taskId: string, body: { body: string }) => {
    const task = findTask(projectId, taskId);
    const state = getDemoState();
    const comment: TaskComment = {
      id: `comment-${state.nextCommentId++}`,
      taskId,
      body: body.body,
      author: state.currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    task.comments.unshift(comment);
    addActivity(task, state.currentUser, "COMMENTED", "Added a comment");
    return clone(comment);
  },
  listTaskActivity: async (projectId: string, taskId: string) => clone(findTask(projectId, taskId).activity),
  listSprints: async (projectId: string) => clone(findProject(projectId).sprints),
  createSprint: async (
    projectId: string,
    body: { name: string; goal?: string; status?: SprintStatus; startDate?: string | null; endDate?: string | null }
  ) => {
    const state = getDemoState();
    const project = findProject(projectId);
    const sprint: Sprint = {
      id: `sprint-${state.nextSprintId++}`,
      projectId,
      name: body.name,
      goal: body.goal ?? null,
      status: body.status ?? "PLANNED",
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    project.sprints.push(sprint);
    return clone(sprint);
  },
  updateSprint: async (
    projectId: string,
    sprintId: string,
    body: Partial<{ name: string; goal: string; status: SprintStatus; startDate: string | null; endDate: string | null }>
  ) => {
    const sprint = findProject(projectId).sprints.find((entry) => entry.id === sprintId);
    if (!sprint) {
      throw new Error("Sprint not found in demo mode");
    }
    Object.assign(sprint, body, { updatedAt: new Date().toISOString() });
    return clone(sprint);
  },
  deleteTask: async (projectId: string, taskId: string) => {
    const project = findProject(projectId);
    project.tasks = project.tasks.filter((task) => task.id !== taskId);
    syncProjectCounts(project);
  },
  dashboard: async () => clone(buildDashboardSummary())
};