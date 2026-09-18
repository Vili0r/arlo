import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ESignatureModal } from "@/components/e-signature-modal";
import { SIGNATURE_MEANINGS } from "@/lib/constants/status-transitions";

vi.mock("@/lib/actions/esignature", () => ({
  executeStatusTransition: vi.fn(),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
}));

describe("ESignatureModal Component (21 CFR Part 11)", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    entityType: "Complaint" as const,
    entityId: "cmp_123",
    currentStatus: "INTAKE",
    targetStatus: "INVESTIGATION",
    targetStatusLabel: "Under Investigation",
  };

  it("should render 21 CFR Part 11 password confirmation and statutory notice", () => {
    const html = renderToString(<ESignatureModal {...defaultProps} />);

    expect(html).toContain("Electronic Signature Required");
    expect(html).toContain("Password");
    expect(html).toContain("type=\"password\"");
    expect(html).toContain("This constitutes an electronic signature under 21 CFR Part 11");
  });

  it("should render signature meanings dropdown with all regulatory options", () => {
    const html = renderToString(<ESignatureModal {...defaultProps} />);

    expect(html).toContain("Meaning of Signature");
    expect(html).toContain("Select meaning of signature…");

    for (const meaning of SIGNATURE_MEANINGS) {
      expect(html).toContain(meaning);
    }
  });

  it("should render cancellation mode with destructive warning when isCancel is true", () => {
    const html = renderToString(
      <ESignatureModal
        {...defaultProps}
        isCancel={true}
        targetStatus="CANCELLED"
        targetStatusLabel="Cancelled"
      />
    );

    expect(html).toContain("Record Cancellation — Electronic Signature");
    expect(html).toContain("You are cancelling this");
    expect(html).toContain("record:");
    expect(html).toContain("Cancellation Rationale");
    expect(html).toContain("Sign &amp; Cancel Record");
  });

  it("should render stage reversion mode when isRevert is true", () => {
    const html = renderToString(
      <ESignatureModal
        {...defaultProps}
        isRevert={true}
        targetStatus="INTAKE"
        targetStatusLabel="Intake"
      />
    );

    expect(html).toContain("Stage Reversion — Electronic Signature");
    expect(html).toContain("You are reverting this");
    expect(html).toContain("stage:");
    expect(html).toContain("Rationale for Reversion");
    expect(html).toContain("Sign &amp; Revert Stage");
  });

  it("should render 21 CFR 820.198(b) mandatory rationale when investigation is marked NOT_REQUIRED", () => {
    const html = renderToString(
      <ESignatureModal
        {...defaultProps}
        entityType="Investigation"
        currentStatus="PENDING"
        targetStatus="NOT_REQUIRED"
        targetStatusLabel="Not Required"
      />
    );

    expect(html).toContain("Reason No Investigation is Needed (21 CFR § 820.198(b))");
  });

  it("should not render dialog content when open is false", () => {
    const html = renderToString(<ESignatureModal {...defaultProps} open={false} />);
    expect(html).not.toContain("Electronic Signature Required");
    expect(html).not.toContain("Meaning of Signature");
  });
});
