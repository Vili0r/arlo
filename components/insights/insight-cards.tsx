"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  CheckSquare,
  Activity,
  Package,
  MessageSquare,
  History,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { InsightCardId } from "@/lib/insights";

export interface InsightsData {
  userId: string;
  orgSlug: string;
  vigilanceDeadlines: Array<{
    id: string;
    complaintNumber: string;
    targetRegion: string | null;
    decision: string | null;
    dueDate: string | null;
    awarenessDate: string | null;
    priority: string;
    daysRemaining: number | null;
    isUrgent: boolean;
  }>;
  pendingApprovals: Array<{
    id: string;
    type: "Complaint" | "CAPA";
    number: string;
    title: string;
    createdAt: string;
    href: string;
  }>;
  assignedInvestigations: Array<{
    id: string;
    complaintNumber: string;
    shortDescription: string;
    priority: string;
    status: string;
    investigationStatus: string;
  }>;
  assignedTasks: Array<{
    id: string;
    complaintId: string;
    complaintNumber: string;
    shortDescription: string;
    taskType: string;
    dateDue: string | null;
    isOverdue: boolean;
  }>;
  capaStats: {
    draft: number;
    actionPlanning: number;
    implementation: number;
    effectivenessCheck: number;
    pendingApproval: number;
    closed: number;
    total: number;
  };
  sampleStats: {
    pending: number;
    received: number;
    underEvaluation: number;
    completed: number;
    total: number;
  };
  customerCommunications: Array<{
    id: string;
    complaintId: string;
    complaintNumber: string;
    questionAsked: string | null;
    communicationDate: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    timestamp: string;
    userName: string;
    reason: string | null;
  }>;
}

export function InsightCardRenderer({
  cardId,
  data,
}: {
  cardId: InsightCardId;
  data: InsightsData;
}) {
  switch (cardId) {
    case "VIGILANCE_SLA":
      return <VigilanceSlaCard data={data} />;
    case "MY_APPROVALS":
      return <PendingApprovalsCard data={data} />;
    case "MY_INVESTIGATIONS":
      return <MyInvestigationsCard data={data} />;
    case "MY_TASKS":
      return <MyTasksCard data={data} />;
    case "CAPA_PIPELINE":
      return <CapaPipelineCard data={data} />;
    case "SAMPLE_STATUS":
      return <SampleStatusCard data={data} />;
    case "CUSTOMER_COMMUNICATION":
      return <CustomerCommunicationCard data={data} />;
    case "AUDIT_ACTIVITY":
      return <AuditActivityCard data={data} />;
    default:
      return null;
  }
}

// 1. Vigilance SLA Deadlines Card
export function VigilanceSlaCard({ data }: { data: InsightsData }) {
  const items = data.vigilanceDeadlines.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Vigilance Statutory Deadlines</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          EU MDR / FDA
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500/80 mb-1" />
            <p className="font-medium text-foreground text-xs">All Vigilance Clear</p>
            <p className="text-[11px]">No statutory reporting deadlines pending.</p>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/complaints/${item.id}/vigilance`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {item.complaintNumber}
                    </Link>
                    {item.targetRegion && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1 py-0.2 rounded font-mono">
                        {item.targetRegion}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.decision ? item.decision.replace(/_/g, " ") : "Pending assessment"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {item.daysRemaining !== null ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                        item.daysRemaining <= 3
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : item.daysRemaining <= 10
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {item.daysRemaining <= 0 ? "Due Today" : `${item.daysRemaining}d left`}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono">Stage: Initial</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Pending Approvals Card (Separation of Duties Sign-offs)
export function PendingApprovalsCard({ data }: { data: InsightsData }) {
  const items = data.pendingApprovals.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
          <span>Pending Approvals & Sign-Offs</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Part 11
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500/80 mb-1" />
            <p className="font-medium text-foreground text-xs">No Pending Sign-Offs</p>
            <p className="text-[11px]">Your 21 CFR Part 11 approval queue is up to date.</p>
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="truncate space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.type}
                    </span>
                    <Link
                      href={item.href}
                      className="font-mono font-semibold text-primary hover:underline truncate"
                    >
                      {item.number}
                    </Link>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {item.title}
                  </p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                >
                  Sign <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. My Active Investigations Card
export function MyInvestigationsCard({ data }: { data: InsightsData }) {
  const items = data.assignedInvestigations.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <FileSearch className="h-3.5 w-3.5 text-emerald-500" />
          <span>My Assigned Investigations</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {data.assignedInvestigations.length} Open
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-xs">No Active Investigations</p>
            <p className="text-[11px]">You currently have no complaints assigned for investigation.</p>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="truncate space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/complaints/${item.id}/investigation`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {item.complaintNumber}
                    </Link>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                        item.priority === "CRITICAL"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : item.priority === "HIGH"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[210px]">
                    {item.shortDescription}
                  </p>
                </div>
                <Link
                  href={`/complaints/${item.id}/investigation`}
                  className="shrink-0 p-1 hover:text-foreground text-muted-foreground transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 4. My Action Tasks Card
export function MyTasksCard({ data }: { data: InsightsData }) {
  const items = data.assignedTasks.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-purple-500" />
          <span>My Action Tasks</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {data.assignedTasks.length} Pending
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500/80 mb-1" />
            <p className="font-medium text-foreground text-xs">All Tasks Completed</p>
            <p className="text-[11px]">No open sub-tasks or follow-ups assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-border">
            {items.map((task) => (
              <div key={task.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="truncate space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/complaints/${task.complaintId}/tasks/${task.id}`}
                      className="font-medium text-foreground hover:underline truncate max-w-[170px]"
                    >
                      {task.shortDescription}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px]">{task.complaintNumber}</span>
                    <span>•</span>
                    <span className="truncate">{task.taskType.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {task.dateDue && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        task.isOverdue
                          ? "bg-red-500/10 text-red-600 font-semibold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.isOverdue ? "Overdue" : "Due Soon"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 5. CAPA Pipeline Card
export function CapaPipelineCard({ data }: { data: InsightsData }) {
  const stats = data.capaStats;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-blue-500" />
          <span>CAPA Phase Progression</span>
        </h3>
        <Link
          href="/capa"
          className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3.5 shadow-xs">
        {/* Metric Bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <span className="block text-xs font-bold text-foreground">{stats.draft + stats.actionPlanning}</span>
            <span className="text-[10px] text-muted-foreground truncate block">Planning</span>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2">
            <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">
              {stats.implementation}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block">Active</span>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-2">
            <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">
              {stats.effectivenessCheck}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block">Verify</span>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {stats.closed}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block">Closed</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border text-[11px] text-muted-foreground">
          <span>Total Org CAPAs</span>
          <span className="font-mono font-semibold text-foreground">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}

// 6. Sample Status Pipeline Card
export function SampleStatusCard({ data }: { data: InsightsData }) {
  const stats = data.sampleStats;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-teal-500" />
          <span>Sample Evaluation Pipeline</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Lab Triage
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              In Transit / Pending
            </span>
            <span className="font-mono font-semibold text-foreground">{stats.pending}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Received by Decontamination
            </span>
            <span className="font-mono font-semibold text-foreground">{stats.received}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Under Lab Evaluation
            </span>
            <span className="font-mono font-semibold text-foreground">{stats.underEvaluation}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Completed Evaluations</span>
          <span className="font-mono font-semibold text-foreground">{stats.completed}</span>
        </div>
      </div>
    </div>
  );
}

// 7. Customer Communication Card
export function CustomerCommunicationCard({ data }: { data: InsightsData }) {
  const items = data.customerCommunications.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          <span>Customer Follow-Up Queue</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          PMS
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500/80 mb-1" />
            <p className="font-medium text-foreground text-xs">Communications Clear</p>
            <p className="text-[11px]">No customer inquiries currently awaiting reply.</p>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-border">
            {items.map((comm) => (
              <div key={comm.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="truncate space-y-0.5">
                  <Link
                    href={`/complaints/${comm.complaintId}/communications/${comm.id}`}
                    className="font-mono font-semibold text-primary hover:underline text-xs"
                  >
                    {comm.complaintNumber}
                  </Link>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {comm.questionAsked || "Clarification requested from reporter"}
                  </p>
                </div>
                <Link
                  href={`/complaints/${comm.complaintId}/communications/${comm.id}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 8. Audit Activity Card
export function AuditActivityCard({ data }: { data: InsightsData }) {
  const items = data.auditLogs.slice(0, 4);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-neutral-400" />
          <span>Live 21 CFR Part 11 Audit Feed</span>
        </h3>
        <Link
          href="/audit-trail"
          className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
        >
          Full Log <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3 shadow-xs">
        {items.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground text-xs">
            No recent audit log activity
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-border">
            {items.map((log) => (
              <div key={log.id} className="pt-2 first:pt-0 text-[11px] space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-muted-foreground truncate">
                  <span className="font-mono text-primary">{log.entityType}</span> by {log.userName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
