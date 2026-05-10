import type { AuthenticatedUser } from "../auth/middleware.js";
import { database } from "../models/database.js";
import type { TaskStatus } from "../types/domain.js";
import type { DbMembership, DbProject, DbTask, DbUser } from "../types/database.js";
import { isTaskOverdue } from "./serializers.js";

type DashboardProject = DbProject & { tasks: DbTask[]; memberships: Array<DbMembership & { user: Pick<DbUser, "id" | "name"> }> };

const emptyStatusTotals: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

export async function getDashboardSummary(user: AuthenticatedUser) {
  const projects = (await database.project.findMany({
    where: user.role === "ADMIN" ? undefined : { memberships: { some: { userId: user.id } } },
    include: {
      tasks: true,
      memberships: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })) as DashboardProject[];

  const allTasks = projects.flatMap((project) => project.tasks);
  const allMemberships = projects.flatMap((project) => project.memberships);
  const statusTotals = { ...emptyStatusTotals };
  for (const task of allTasks) {
    statusTotals[task.status] += 1;
  }

  const memberWorkloadMap = new Map<string, { userId: string; name: string; assignedTasks: number; completedTasks: number; trackedMinutes: number }>();
  for (const membership of allMemberships) {
    if (!memberWorkloadMap.has(membership.user.id)) {
      memberWorkloadMap.set(membership.user.id, {
        userId: membership.user.id,
        name: membership.user.name,
        assignedTasks: 0,
        completedTasks: 0,
        trackedMinutes: 0
      });
    }
  }

  for (const task of allTasks) {
    if (!task.assigneeId) {
      continue;
    }

    const memberSummary = memberWorkloadMap.get(task.assigneeId);
    if (!memberSummary) {
      continue;
    }

    memberSummary.assignedTasks += 1;
    memberSummary.trackedMinutes += task.trackedMinutes;
    if (task.status === "DONE") {
      memberSummary.completedTasks += 1;
    }
  }

  const completionRate = allTasks.length === 0 ? 0 : Math.round((statusTotals.DONE / allTasks.length) * 100);

  return {
    projectCount: projects.length,
    totalTasks: allTasks.length,
    assignedTasks: allTasks.filter((task) => task.assigneeId === user.id).length,
    statusTotals,
    overdueTasks: allTasks.filter((task) => isTaskOverdue(task)).length,
    estimatedMinutesTotal: allTasks.reduce((total, task) => total + task.estimatedMinutes, 0),
    trackedMinutesTotal: allTasks.reduce((total, task) => total + task.trackedMinutes, 0),
    activeTimerCount: allTasks.filter((task) => Boolean(task.timerStartedAt)).length,
    recurringTaskCount: allTasks.filter((task) => task.recurrencePattern !== "NONE").length,
    completionRate,
    memberWorkload: Array.from(memberWorkloadMap.values()).sort((left, right) => right.trackedMinutes - left.trackedMinutes),
    projectSummaries: projects.map((project) => {
      const projectStatusTotals = { ...emptyStatusTotals };
      for (const task of project.tasks) {
        projectStatusTotals[task.status] += 1;
      }
      const totalTasks = project.tasks.length;
      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        statusTotals: projectStatusTotals,
        overdueTasks: project.tasks.filter((task) => isTaskOverdue(task)).length,
        progressPercent: totalTasks === 0 ? 0 : Math.round((projectStatusTotals.DONE / totalTasks) * 100),
        estimatedMinutes: project.tasks.reduce((total, task) => total + task.estimatedMinutes, 0),
        trackedMinutes: project.tasks.reduce((total, task) => total + task.trackedMinutes, 0),
        recurringTaskCount: project.tasks.filter((task) => task.recurrencePattern !== "NONE").length,
        activeTimerCount: project.tasks.filter((task) => Boolean(task.timerStartedAt)).length
      };
    })
  };
}
