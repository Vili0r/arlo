import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ProjectsView } from "@/components/projects-view";
import { InsightsContainer } from "@/components/insights/insights-container";
import { InsightsData } from "@/components/insights/insight-cards";
import { formatUserName } from "@/lib/utils";

interface OrgOverviewPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgOverviewPage({
  params,
}: OrgOverviewPageProps) {
  const { orgSlug } = await params;
  const { userId, orgId, orgRole } = await requireOrgAuth();

  // Parallel database queries strictly filtered by orgId (tenant isolation)
  const [
    complaintCount,
    openComplaints,
    capaCount,
    vigilanceRecords,
    pendingComplaintApprovals,
    pendingCapaApprovals,
    assignedComplaints,
    assignedTasks,
    capaGroups,
    sampleGroups,
    openCommunications,
    recentLogs,
  ] = await Promise.all([
    prisma.complaint.count({
      where: { orgId, deletedAt: null },
    }),
    prisma.complaint.count({
      where: { orgId, status: "OPEN", deletedAt: null },
    }),
    prisma.capa.count({
      where: { orgId },
    }),
    prisma.vigilanceDecisionTree.findMany({
      where: { orgId, status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        complaint: {
          select: {
            id: true,
            complaintNumber: true,
            priority: true,
            awarenessDate: true,
          },
        },
      },
    }),
    prisma.complaint.findMany({
      where: {
        orgId,
        approvedById: userId,
        status: "PENDING_REVIEW",
        deletedAt: null,
      },
      take: 3,
      select: {
        id: true,
        complaintNumber: true,
        shortDescription: true,
        createdAt: true,
      },
    }),
    prisma.capa.findMany({
      where: {
        orgId,
        ownerId: userId,
        currentPhase: { not: "CLOSED" },
      },
      take: 3,
      select: {
        id: true,
        capaNumber: true,
        shortDescription: true,
        createdAt: true,
      },
    }),
    prisma.complaint.findMany({
      where: {
        orgId,
        assignedInvestigatorId: userId,
        status: { notIn: ["CLOSED", "CANCELLED"] },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        investigation: {
          select: { status: true },
        },
      },
    }),
    prisma.complaintTask.findMany({
      where: {
        orgId,
        assignedToId: userId,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
      orderBy: { dateDue: "asc" },
      take: 5,
      include: {
        complaint: {
          select: { complaintNumber: true },
        },
      },
    }),
    prisma.capa.groupBy({
      by: ["currentPhase"],
      where: { orgId },
      _count: { currentPhase: true },
    }),
    prisma.sampleManagement.groupBy({
      by: ["status"],
      where: { orgId },
      _count: { status: true },
    }),
    prisma.customerCommunication.findMany({
      where: { orgId, status: "OPEN" },
      orderBy: { communicationDate: "desc" },
      take: 5,
      include: {
        complaint: {
          select: { complaintNumber: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { timestamp: "desc" },
      take: 5,
      include: {
        changedBy: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  // Transform vigilance countdown calculations
  const now = new Date().getTime();
  const transformedVigilance = vigilanceRecords.map((v) => {
    let daysRemaining: number | null = null;
    let isUrgent = false;

    if (v.dueDate) {
      const diffTime = new Date(v.dueDate).getTime() - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isUrgent = daysRemaining <= 5;
    } else if (v.complaint?.awarenessDate) {
      // Default 30-day reporting window from awarenessDate if due date not explicitly set
      const defaultDue =
        new Date(v.complaint.awarenessDate).getTime() + 30 * 24 * 60 * 60 * 1000;
      const diffTime = defaultDue - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isUrgent = daysRemaining <= 5;
    }

    return {
      id: v.complaintId,
      complaintNumber: v.complaint?.complaintNumber || "CMP",
      targetRegion: v.targetRegion,
      decision: v.decision ? String(v.decision) : null,
      dueDate: v.dueDate ? v.dueDate.toISOString() : null,
      awarenessDate: v.complaint?.awarenessDate
        ? v.complaint.awarenessDate.toISOString()
        : null,
      priority: v.complaint?.priority || "MEDIUM",
      daysRemaining,
      isUrgent,
    };
  });

  // Transform pending approvals
  const transformedApprovals = [
    ...pendingComplaintApprovals.map((c) => ({
      id: c.id,
      type: "Complaint" as const,
      number: c.complaintNumber,
      title: c.shortDescription,
      createdAt: c.createdAt.toISOString(),
      href: `/complaints/${c.id}`,
    })),
    ...pendingCapaApprovals.map((cp) => ({
      id: cp.id,
      type: "CAPA" as const,
      number: cp.capaNumber,
      title: cp.shortDescription,
      createdAt: cp.createdAt.toISOString(),
      href: `/capa`,
    })),
  ];

  // Transform assigned investigations
  const transformedInvestigations = assignedComplaints.map((c) => ({
    id: c.id,
    complaintNumber: c.complaintNumber,
    shortDescription: c.shortDescription,
    priority: c.priority,
    status: c.status,
    investigationStatus: c.investigation?.status || "NOT_STARTED",
  }));

  // Transform assigned tasks
  const transformedTasks = assignedTasks.map((t) => ({
    id: t.id,
    complaintId: t.complaintId,
    complaintNumber: t.complaint?.complaintNumber || "CMP",
    shortDescription: t.shortDescription,
    taskType: t.taskType,
    dateDue: t.dateDue ? t.dateDue.toISOString() : null,
    isOverdue: t.dateDue ? new Date(t.dateDue).getTime() < now : false,
  }));

  // Transform CAPA stats
  const capaStatMap: Record<string, number> = {};
  capaGroups.forEach((g) => {
    capaStatMap[g.currentPhase] = g._count.currentPhase;
  });
  const capaStats = {
    draft: capaStatMap["INITIATION"] || 0,
    actionPlanning: capaStatMap["INVESTIGATION"] || 0,
    implementation: capaStatMap["IMPLEMENTATION"] || 0,
    effectivenessCheck: capaStatMap["EFFECTIVENESS"] || 0,
    pendingApproval: 0,
    closed: capaStatMap["CLOSED"] || 0,
    total: capaCount,
  };

  // Transform Sample stats
  const sampleStatMap: Record<string, number> = {};
  let totalSamples = 0;
  sampleGroups.forEach((g) => {
    sampleStatMap[g.status] = g._count.status;
    totalSamples += g._count.status;
  });
  const sampleStats = {
    pending: sampleStatMap["PENDING"] || 0,
    received: sampleStatMap["RECEIVED"] || 0,
    underEvaluation: sampleStatMap["UNDER_EVALUATION"] || 0,
    completed: (sampleStatMap["RETURNED"] || 0) + (sampleStatMap["DISPOSED"] || 0),
    total: totalSamples,
  };

  // Transform customer communications
  const transformedCommunications = openCommunications.map((comm) => ({
    id: comm.id,
    complaintId: comm.complaintId,
    complaintNumber: comm.complaint?.complaintNumber || "CMP",
    questionAsked: comm.questionAsked,
    communicationDate: comm.communicationDate.toISOString(),
  }));

  // Transform audit logs
  const transformedAuditLogs = recentLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    timestamp: new Date(log.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    userName: formatUserName(log.changedBy, "System"),
    reason: log.reason,
  }));

  const insightsData: InsightsData = {
    userId,
    orgSlug,
    vigilanceDeadlines: transformedVigilance,
    pendingApprovals: transformedApprovals,
    assignedInvestigations: transformedInvestigations,
    assignedTasks: transformedTasks,
    capaStats,
    sampleStats,
    customerCommunications: transformedCommunications,
    auditLogs: transformedAuditLogs,
  };

  return (
    <ProjectsView
      orgSlug={orgSlug}
      complaintCount={complaintCount}
      openComplaints={openComplaints}
      capaCount={capaCount}
      auditLogCount={recentLogs.length}
      sideContent={<InsightsContainer data={insightsData} orgRole={orgRole} />}
    />
  );
}
