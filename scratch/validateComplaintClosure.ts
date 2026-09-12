async function validateComplaintClosure(tx: PrismaTx, complaintId: string, orgId: string, newStatus: string) {
  if (newStatus !== "CLOSED" && newStatus !== "CANCELLED") return;

  const fullComplaint = await tx.complaint.findUnique({
    where: { id: complaintId, orgId },
    include: {
      investigation: true,
      vigilanceDecisionTrees: true,
      initialMIR: true,
      finalMIR: true,
      tasks: true,
      customerCommunications: true,
    }
  });

  if (!fullComplaint) {
    throw new Error("Complaint record not found.");
  }

  const activeFolders: string[] = [];

  if (newStatus === "CLOSED") {
    // Check Investigation
    if (fullComplaint.investigation && fullComplaint.investigation.status !== "COMPLETED" && fullComplaint.investigation.status !== "NOT_REQUIRED" && fullComplaint.investigation.status !== "CANCELLED") {
      activeFolders.push(`Investigation is currently in ${fullComplaint.investigation.status} status (must be COMPLETED or NOT_REQUIRED)`);
    }

    // Check Vigilance Decision Tree
    for (const tree of fullComplaint.vigilanceDecisionTrees) {
      if (tree.status !== "SUBMITTED" && tree.status !== "NOT_REPORTABLE" && tree.status !== "CANCELLED") {
        activeFolders.push(`Vigilance Decision Tree is currently in ${tree.status} status (must be SUBMITTED or NOT_REPORTABLE)`);
      }
    }

    // Check Initial MIR
    if (fullComplaint.initialMIR && fullComplaint.initialMIR.status !== "SUBMITTED" && fullComplaint.initialMIR.status !== "CANCELLED") {
      activeFolders.push(`Initial MIR is currently in ${fullComplaint.initialMIR.status} status (must be SUBMITTED)`);
    }

    // Check Final MIR
    if (fullComplaint.finalMIR && fullComplaint.finalMIR.status !== "SUBMITTED" && fullComplaint.finalMIR.status !== "CANCELLED") {
      activeFolders.push(`Final MIR is currently in ${fullComplaint.finalMIR.status} status (must be SUBMITTED)`);
    }

    // Check Follow-ups / Communications
    for (const comm of fullComplaint.customerCommunications) {
      if (comm.status !== "CLOSED" && comm.status !== "CANCELLED") { // Assuming OPEN / CLOSED / CANCELLED
        activeFolders.push(`Customer Communication (${comm.id}) is not closed`);
      }
    }

    // Check Tasks
    for (const task of fullComplaint.tasks) {
      if (task.status !== "COMPLETED" && task.status !== "CANCELLED") {
        activeFolders.push(`Task (${task.title || task.id}) is not completed`);
      }
    }
  } else if (newStatus === "CANCELLED") {
    // If cancelling, ensure subfolders are also cancelled
    if (fullComplaint.investigation && fullComplaint.investigation.status !== "CANCELLED") {
      activeFolders.push(`Investigation must be CANCELLED before the complaint can be cancelled`);
    }
    for (const tree of fullComplaint.vigilanceDecisionTrees) {
      if (tree.status !== "CANCELLED") activeFolders.push(`Vigilance Decision Tree must be CANCELLED`);
    }
    if (fullComplaint.initialMIR && fullComplaint.initialMIR.status !== "CANCELLED") {
      activeFolders.push(`Initial MIR must be CANCELLED`);
    }
    if (fullComplaint.finalMIR && fullComplaint.finalMIR.status !== "CANCELLED") {
      activeFolders.push(`Final MIR must be CANCELLED`);
    }
    for (const comm of fullComplaint.customerCommunications) {
      if (comm.status !== "CANCELLED") activeFolders.push(`Customer Communication must be CANCELLED`);
    }
    for (const task of fullComplaint.tasks) {
      if (task.status !== "CANCELLED") activeFolders.push(`Task must be CANCELLED`);
    }
  }

  if (activeFolders.length > 0) {
    throw new Error(
      `Cannot move complaint to ${newStatus}. The following sub-folders must be completed or cancelled first:\n• ${activeFolders.join("\n• ")}`
    );
  }
}
