      // --- START AUTO-CREATE MIR LOGIC ---
      if (entityType === "Vigilance" && newStatus === "REPORTABLE") {
        const vigilance = updatedRecord as any;
        if (vigilance.complaintId) {
          const existingInitial = await tx.initialMIR.findUnique({
            where: { complaintId: vigilance.complaintId }
          });
          if (!existingInitial) {
            await tx.initialMIR.create({
              data: {
                orgId,
                complaintId: vigilance.complaintId,
                status: "DRAFT",
                reportType: "INITIAL",
              }
            });
          }
        }
      }

      if (entityType === "Investigation" && newStatus === "COMPLETED") {
        const investigation = updatedRecord as any;
        if (investigation.complaintId) {
          // Check if reportable
          const vigilance = await tx.vigilanceDecisionTree.findFirst({
            where: {
              complaintId: investigation.complaintId,
              orgId,
              status: { in: ["REPORTABLE", "SUBMITTED"] }
            }
          });
          if (vigilance) {
            const existingFinal = await tx.finalMIR.findUnique({
              where: { complaintId: investigation.complaintId }
            });
            if (!existingFinal) {
              await tx.finalMIR.create({
                data: {
                  orgId,
                  complaintId: investigation.complaintId,
                  status: "DRAFT",
                  reportType: "FINAL",
                }
              });
            }
          }
        }
      }
      // --- END AUTO-CREATE MIR LOGIC ---
