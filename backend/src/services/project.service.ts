import type { AuthenticatedUser } from "../auth/middleware.js";
import { requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { database } from "../models/database.js";
import type { ProjectCreateInput, ProjectUpdateInput } from "../validations/project.schemas.js";
import { serializeProject, serializeProjectSummary } from "./serializers.js";
import type { ProjectDetailRecord, ProjectSummaryRecord } from "./serializers.js";

const projectInclude = {
  memberships: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
    }
  },
  tasks: {
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
    },
    orderBy: { createdAt: "desc" as const }
  },
  _count: { select: { memberships: true, tasks: true } }
};

export async function listProjects(user: AuthenticatedUser) {
  const projects = (await database.project.findMany({
    where: user.role === "ADMIN" ? undefined : { memberships: { some: { userId: user.id } } },
    include: { _count: { select: { memberships: true, tasks: true } } },
    orderBy: { createdAt: "desc" }
  })) as ProjectSummaryRecord[];
  return projects.map(serializeProjectSummary);
}

export async function createProject(user: AuthenticatedUser, input: ProjectCreateInput) {
  const project = (await database.project.create({
    data: {
      name: input.name,
      description: input.description || null,
      createdById: user.id,
      memberships: {
        create: { userId: user.id, role: "OWNER" }
      }
    },
    include: projectInclude
  })) as ProjectDetailRecord;
  return serializeProject(project);
}

export async function getProject(user: AuthenticatedUser, projectId: string) {
  await requireProjectAccess(user, projectId);
  const project = (await database.project.findUniqueOrThrow({ where: { id: projectId }, include: projectInclude })) as ProjectDetailRecord;
  return serializeProject(project);
}

export async function updateProject(user: AuthenticatedUser, projectId: string, input: ProjectUpdateInput) {
  await requireProjectAdmin(user, projectId);
  const project = (await database.project.update({
    where: { id: projectId },
    data: {
      name: input.name,
      description: input.description === undefined ? undefined : input.description || null
    },
    include: projectInclude
  })) as ProjectDetailRecord;
  return serializeProject(project);
}

export async function deleteProject(user: AuthenticatedUser, projectId: string) {
  await requireProjectAdmin(user, projectId);
  await database.project.delete({ where: { id: projectId } });
}
