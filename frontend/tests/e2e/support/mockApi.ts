import type { Page, Route } from "@playwright/test";
import type {
  DashboardSummary,
  Membership,
  Project,
  ProjectSummary,
  Sprint,
  Task,
  TaskActivity,
  TaskComment,
  TaskDetail,
  TaskStatus,
  User
} from "../../../src/api/client";

type MockProject = Omit<Project, "tasks"> & {
  tasks: TaskDetail[];
};

export type MockWorkspaceState = {
  currentUser: User;
  project: MockProject;
};

type MutableWorkspaceState = MockWorkspaceState & {
  nextSprintId: number;
  nextCommentId: number;
  nextActivityId: number;
};

const timestamp = "2099-06-01T09:00:00.000Z";

function toTask(task: TaskDetail): Task {
  const { comments, activity, ...rest } = task;
  return rest;
}

function toProject(project: MockProject): Project {
  return {
    ...project,
    tasks: project.tasks.map(toTask)
  };
}

function orderedTasks(tasks: TaskDetail[]) {
  return [...tasks].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

function buildProjectSummary(project: MockProject): ProjectSummary {
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

function buildDashboard(state: MockWorkspaceState): DashboardSummary {
  const tasks = state.project.tasks;
  const statusTotals = tasks.reduce<Record<TaskStatus, number>>(
    (totals, task) => ({ ...totals, [task.status]: totals[task.status] + 1 }),
    { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
  );
  const trackedMinutesTotal = tasks.reduce((total, task) => total + task.trackedMinutes, 0);
  const estimatedMinutesTotal = tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const completedTasks = statusTotals.DONE;
  const memberWorkload = state.project.members.map((membership) => {
    const assignedTasks = tasks.filter((task) => task.assignee?.id === membership.user.id || (task.assignmentType === "ROLE" && task.assigneeRole === membership.role));
    return {
      userId: membership.user.id,
      name: membership.user.name,
      assignedTasks: assignedTasks.length,
      completedTasks: assignedTasks.filter((task) => task.status === "DONE").length,
      trackedMinutes: assignedTasks.reduce((total, task) => total + task.trackedMinutes, 0)
    };
  });

  return {
    projectCount: 1,
    totalTasks: tasks.length,
    assignedTasks: tasks.filter((task) => task.assignee?.id === state.currentUser.id || (task.assignmentType === "ROLE" && task.assigneeRole === "OWNER")).length,
    statusTotals,
    overdueTasks: tasks.filter((task) => task.isOverdue).length,
    estimatedMinutesTotal,
    trackedMinutesTotal,
    activeTimerCount: tasks.filter((task) => Boolean(task.timerStartedAt)).length,
    recurringTaskCount: tasks.filter((task) => task.recurrencePattern !== "NONE").length,
    completionRate: tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100),
    memberWorkload,
    projectSummaries: [
      {
        projectId: state.project.id,
        projectName: state.project.name,
        totalTasks: tasks.length,
        statusTotals,
        overdueTasks: tasks.filter((task) => task.isOverdue).length,
        progressPercent: tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100),
        estimatedMinutes: estimatedMinutesTotal,
        trackedMinutes: trackedMinutesTotal,
        recurringTaskCount: tasks.filter((task) => task.recurrencePattern !== "NONE").length,
        activeTimerCount: tasks.filter((task) => Boolean(task.timerStartedAt)).length
      }
    ]
  };
}

function createWorkspaceState(): MutableWorkspaceState {
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
  const memberships: Membership[] = [
    {
      id: "membership-1",
      projectId: "project-1",
      role: "OWNER",
      user: currentUser,
      createdAt: timestamp
    },
    {
      id: "membership-2",
      projectId: "project-1",
      role: "MEMBER",
      user: teammate,
      createdAt: timestamp
    }
  ];
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

  const makeActivity = (taskId: string, actor: User, message: string, type: TaskActivity["type"] = "CREATED"): TaskActivity => ({
    id: `activity-${taskId}-${message.length}`,
    taskId,
    actor,
    type,
    message,
    createdAt: timestamp
  });

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
      activity: [makeActivity("task-1", teammate, "Created the issue")] 
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
      activity: [makeActivity("task-2", currentUser, "Created the issue")]
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
      activity: [makeActivity("task-3", teammate, "Moved the issue into the active sprint")]
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
      activity: [makeActivity("task-4", currentUser, "Completed the issue")]
    }
  ];

  return {
    currentUser,
    project: {
      id: "project-1",
      name: "Launch control",
      description: "Coordinate the final board rebuild, backlog cleanup, and workspace polish from one place.",
      createdById: currentUser.id,
      createdAt: timestamp,
      members: memberships,
      sprints: [sprint],
      tasks
    },
    nextSprintId: 2,
    nextCommentId: 2,
    nextActivityId: 10
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}

function getTask(state: MutableWorkspaceState, taskId: string) {
  return state.project.tasks.find((task) => task.id === taskId) ?? null;
}

function appendActivity(state: MutableWorkspaceState, task: TaskDetail, message: string, type: TaskActivity["type"] = "UPDATED") {
  task.activity.unshift({
    id: `activity-${state.nextActivityId++}`,
    taskId: task.id,
    actor: state.currentUser,
    type,
    message,
    createdAt: timestamp
  });
  task.updatedAt = timestamp;
}

function updateTaskDetail(state: MutableWorkspaceState, task: TaskDetail, payload: Record<string, unknown>) {
  if (typeof payload.status === "string" && payload.status !== task.status) {
    task.status = payload.status as TaskStatus;
    appendActivity(state, task, `Moved the issue to ${task.status.replace("_", " ").toLowerCase()}.`);
  }

  if (typeof payload.sortOrder === "number") {
    task.sortOrder = payload.sortOrder;
    task.updatedAt = timestamp;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "sprintId")) {
    task.sprintId = typeof payload.sprintId === "string" ? payload.sprintId : null;
    appendActivity(state, task, task.sprintId ? `Assigned the issue to ${task.sprintId}.` : "Moved the issue back to backlog.");
  }

  if (typeof payload.trackedMinutesDelta === "number") {
    task.trackedMinutes += payload.trackedMinutesDelta;
    task.updatedAt = timestamp;
  }
}

async function handleApiRoute(route: Route, state: MutableWorkspaceState) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();
  const projectPath = `/api/projects/${state.project.id}`;

  if (path === "/api/auth/me" && method === "GET") {
    return fulfillJson(route, state.currentUser);
  }

  if (path === "/api/auth/logout" && method === "POST") {
    return fulfillJson(route, undefined, 204);
  }

  if (path === "/api/dashboard" && method === "GET") {
    return fulfillJson(route, buildDashboard(state));
  }

  if (path === "/api/projects" && method === "GET") {
    return fulfillJson(route, [buildProjectSummary(state.project)]);
  }

  if (path === projectPath && method === "GET") {
    return fulfillJson(route, toProject(state.project));
  }

  if (path === `${projectPath}/sprints` && method === "POST") {
    const payload = JSON.parse(request.postData() ?? "{}") as Partial<Sprint> & { name?: string; goal?: string };
    const sprint: Sprint = {
      id: `sprint-${state.nextSprintId++}`,
      projectId: state.project.id,
      name: payload.name ?? `Sprint ${state.nextSprintId}`,
      goal: payload.goal ?? null,
      status: "PLANNED",
      startDate: null,
      endDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    state.project.sprints.push(sprint);
    return fulfillJson(route, sprint, 201);
  }

  if (path.startsWith(`${projectPath}/sprints/`) && method === "PATCH") {
    const sprintId = path.slice(`${projectPath}/sprints/`.length);
    const sprint = state.project.sprints.find((entry) => entry.id === sprintId);
    if (!sprint) {
      return fulfillJson(route, { error: { code: "NOT_FOUND", message: "Sprint not found" } }, 404);
    }

    const payload = JSON.parse(request.postData() ?? "{}") as Partial<Sprint>;
    Object.assign(sprint, payload, { updatedAt: timestamp });
    return fulfillJson(route, sprint);
  }

  if (path.startsWith(`${projectPath}/tasks/`)) {
    const suffix = path.slice(`${projectPath}/tasks/`.length);
    const [taskId, nestedResource] = suffix.split("/");
    const task = getTask(state, taskId);
    if (!task) {
      return fulfillJson(route, { error: { code: "NOT_FOUND", message: "Task not found" } }, 404);
    }

    if (!nestedResource && method === "GET") {
      return fulfillJson(route, task);
    }

    if (!nestedResource && method === "PATCH") {
      const payload = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
      updateTaskDetail(state, task, payload);
      return fulfillJson(route, toTask(task));
    }

    if (nestedResource === "comments" && method === "GET") {
      return fulfillJson(route, task.comments);
    }

    if (nestedResource === "comments" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as { body?: string };
      const comment: TaskComment = {
        id: `comment-${state.nextCommentId++}`,
        taskId: task.id,
        body: payload.body ?? "",
        author: state.currentUser,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      task.comments.unshift(comment);
      appendActivity(state, task, "Posted a comment.", "COMMENTED");
      return fulfillJson(route, comment, 201);
    }

    if (nestedResource === "activity" && method === "GET") {
      return fulfillJson(route, task.activity);
    }
  }

  return fulfillJson(route, { error: { code: "NOT_FOUND", message: `Unhandled mock route: ${method} ${path}` } }, 404);
}

export async function mockWorkspaceApi(page: Page) {
  const state = createWorkspaceState();
  await page.context().route("**/*", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.startsWith("/api/")) {
      return handleApiRoute(route, state);
    }

    return route.continue();
  });
  return state;
}

export async function mockUnauthenticatedApi(page: Page) {
  await page.context().route("**/*", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/auth/me") {
      return fulfillJson(route, { error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
    }

    return route.continue();
  });
}

export function getOrderedLaneTitles(tasks: TaskDetail[], status: TaskStatus) {
  return orderedTasks(tasks.filter((task) => task.status === status)).map((task) => task.title);
}