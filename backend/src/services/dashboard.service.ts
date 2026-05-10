import type { AuthenticatedUser } from "../auth/middleware.js";
import { prisma } from "../models/prisma.js";
import type { TaskStatus } from "../types/domain.js";
import type { DbProject, DbTask } from "../types/prisma.js";
import { isTaskOverdue } from "./serializers.js";

type DashboardProject = DbProject & { tasks: DbTask[] };

const emptyStatusTotals: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

export async function getDashboardSummary(user: AuthenticatedUser) {
  const projects = (await prisma.project.findMany({
    where: user.role === "ADMIN" ? undefined : { memberships: { some: { userId: user.id } } },
    include: {
      tasks: true
    },
    orderBy: { createdAt: "desc" }
  })) as DashboardProject[];

  const allTasks = projects.flatMap((project) => project.tasks);
  const statusTotals = { ...emptyStatusTotals };
  for (const task of allTasks) {
    statusTotals[task.status] += 1;
  }

  return {
    projectCount: projects.length,
    totalTasks: allTasks.length,
    assignedTasks: allTasks.filter((task) => task.assigneeId === user.id).length,
    statusTotals,
    overdueTasks: allTasks.filter((task) => isTaskOverdue(task)).length,
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
        progressPercent: totalTasks === 0 ? 0 : Math.round((projectStatusTotals.DONE / totalTasks) * 100)
      };
    })
  };
}
