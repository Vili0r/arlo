ALTER TABLE "entry_points"
ADD COLUMN "variantFlowId" TEXT,
ADD COLUMN "variantPercentage" INTEGER;

CREATE INDEX "entry_points_variantFlowId_idx" ON "entry_points"("variantFlowId");

ALTER TABLE "entry_points"
ADD CONSTRAINT "entry_points_variantFlowId_fkey"
FOREIGN KEY ("variantFlowId") REFERENCES "flows"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
