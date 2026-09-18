// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";

vi.mock("@/lib/actions/esignature", () => ({
  executeStatusTransition: vi.fn(),
}));

vi.mock("@/components/ui/dropdown-menu", () => {
  const React = require("react");
  return {
    DropdownMenu: ({ children }: any) => {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <div data-testid="dropdown-menu">
          {React.Children.map(children, (child: any) => {
            if (!React.isValidElement(child)) return child;
            if (child.type?.name === "DropdownMenuTrigger" || (child.props as any)["data-slot"] === "dropdown-menu-trigger") {
              return React.cloneElement(child, {
                onClick: () => setIsOpen((prev: boolean) => !prev),
              } as any);
            }
            if (child.type?.name === "DropdownMenuContent" || (child.props as any)["data-slot"] === "dropdown-menu-content") {
              return isOpen ? <div role="menu">{child.props.children}</div> : null;
            }
            // By default pass isOpen to children
            return React.cloneElement(child, {
              isOpen,
              onToggle: () => setIsOpen((prev: boolean) => !prev),
            } as any);
          })}
        </div>
      );
    },
    DropdownMenuTrigger: ({ children, disabled, onClick, className }: any) => (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={className}
        data-slot="dropdown-menu-trigger"
      >
        {children}
      </button>
    ),
    DropdownMenuContent: ({ children, isOpen }: any) =>
      isOpen ? <div role="menu" data-slot="dropdown-menu-content">{children}</div> : null,
    DropdownMenuItem: ({ children, onClick, disabled, className }: any) => (
      <div
        role="menuitem"
        onClick={disabled ? undefined : onClick}
        className={className}
      >
        {children}
      </div>
    ),
    DropdownMenuLabel: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
    DropdownMenuSeparator: () => <hr />,
  };
});

describe("<StatusTransitionTracker /> UI Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render horizontal steps for Complaint in OPEN stage", () => {
    render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="OPEN"
      />
    );

    // Desktop stepper and tooltips show stages
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending Response").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);
  });

  it("should mark completed steps with checkmark when in PENDING_RESPONSE stage", () => {
    const { container } = render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="PENDING_RESPONSE"
      />
    );

    // Open (step 1) and In Progress (step 2) are completed
    const svgs = container.querySelectorAll("svg.lucide-check");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it("should render Action dropdown trigger and open menu on click", async () => {
    const user = userEvent.setup();
    render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="OPEN"
      />
    );

    const actionButton = screen.getByRole("button", { name: /action/i });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).not.toBeDisabled();

    await user.click(actionButton);

    // Advance Stage option should be visible
    expect(screen.getByText(/Advance Stage/i)).toBeInTheDocument();
    expect(screen.getByText(/Move to In Progress/i)).toBeInTheDocument();
  });

  it("should open ESignatureModal when advance stage item is clicked", async () => {
    const user = userEvent.setup();
    render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="OPEN"
      />
    );

    const actionButton = screen.getByRole("button", { name: /action/i });
    await user.click(actionButton);

    const moveToItem = screen.getByText(/Move to In Progress/i);
    await user.click(moveToItem);

    // ESignature modal should be triggered
    expect(screen.getByText(/Electronic Signature Required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Meaning of Signature/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Re-enter your password to sign/i)).toBeInTheDocument();
  });

  it("should disable Action button when disabled prop is true", () => {
    render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="OPEN"
        disabled={true}
      />
    );

    const actionButton = screen.getByRole("button", { name: /action/i });
    expect(actionButton).toBeDisabled();
  });

  it("should show approval required note when isAdvanceDisabled is true", async () => {
    const user = userEvent.setup();
    render(
      <StatusTransitionTracker
        entityType="Complaint"
        entityId="cmp_123"
        currentStatus="OPEN"
        isAdvanceDisabled={true}
        advanceDisabledReason="QA Manager review required before advancing."
      />
    );

    const actionButton = screen.getByRole("button", { name: /action/i });
    await user.click(actionButton);

    expect(screen.getByText(/\(approval required\)/i)).toBeInTheDocument();
  });
});
