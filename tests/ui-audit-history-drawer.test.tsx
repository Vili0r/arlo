// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditHistoryDrawer } from "@/components/audit/audit-history-drawer";

const { mockGetAuditHistory, mockUseOrganization } = vi.hoisted(() => ({
  mockGetAuditHistory: vi.fn(),
  mockUseOrganization: vi.fn(),
}));

vi.mock("@/lib/actions/audit", () => ({
  getAuditHistory: (...args: any[]) => mockGetAuditHistory(...args),
}));

vi.mock("@clerk/nextjs", () => ({
  useOrganization: () => mockUseOrganization(),
}));

describe("<AuditHistoryDrawer /> UI Component", () => {
  const defaultLogs = [
    {
      id: "log_1",
      action: "UPDATE",
      entityType: "Complaint",
      entityId: "cmp_123",
      timestamp: new Date("2026-09-18T10:30:00Z"),
      changedById: "user_qa",
      changedByRole: "QA Manager",
      changedBy: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@hospital.org",
      },
      reason: "Updated priority following physician consultation",
      fieldChanges: [
        {
          field: "priority",
          oldValue: "LOW",
          newValue: "HIGH",
        },
      ],
      previousData: { priority: "LOW" },
      newData: { priority: "HIGH" },
    },
    {
      id: "log_2",
      action: "CREATE",
      entityType: "Complaint",
      entityId: "cmp_123",
      timestamp: new Date("2026-09-17T09:00:00Z"),
      changedById: "user_triage",
      changedBy: {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@hospital.org",
      },
      reason: "Initial complaint intake logged",
      fieldChanges: [],
      newData: { shortDescription: "Syringe barrel hairline fracture" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      memberships: { data: [] },
    });
    mockGetAuditHistory.mockResolvedValue(defaultLogs);
  });

  it("should not render drawer when isOpen is false", () => {
    render(
      <AuditHistoryDrawer
        isOpen={false}
        onClose={vi.fn()}
        entityType="Complaint"
        entityId="cmp_123"
      />
    );

    expect(screen.queryByText(/COMPLAINT/i)).not.toBeInTheDocument();
    expect(mockGetAuditHistory).not.toHaveBeenCalled();
  });

  it("should fetch and render audit logs with actor names, badges, and field changes", async () => {
    render(
      <AuditHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="Complaint"
        entityId="cmp_123"
        identifier="CMP-2026-0001"
      />
    );

    expect(mockGetAuditHistory).toHaveBeenCalledWith("Complaint", "cmp_123");

    // Actor names and emails
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    // Reason text
    expect(screen.getByText("Updated priority following physician consultation")).toBeInTheDocument();

    // Changed field title
    expect(screen.getAllByText(/Severity/i).length).toBeGreaterThan(0);
  });

  it("should trigger onClose when clicking the backdrop", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    const { container } = render(
      <AuditHistoryDrawer
        isOpen={true}
        onClose={handleClose}
        entityType="Complaint"
        entityId="cmp_123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    // Backdrop element has class 'bg-black/60'
    const backdrop = container.querySelector(".bg-black\\/60");
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      await user.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it("should trigger onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <AuditHistoryDrawer
        isOpen={true}
        onClose={handleClose}
        entityType="Complaint"
        entityId="cmp_123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("should render error message when audit history fetch fails", async () => {
    mockGetAuditHistory.mockRejectedValue(new Error("Failed to load audit history"));

    render(
      <AuditHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="Complaint"
        entityId="cmp_123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load audit history/i)).toBeInTheDocument();
    });
  });
});
