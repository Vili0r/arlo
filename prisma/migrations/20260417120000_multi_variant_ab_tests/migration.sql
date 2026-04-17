-- CreateTable
CREATE TABLE "entry_point_variants" (
    "id" TEXT NOT NULL,
    "entryPointId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_point_variants_pkey" PRIMARY KEY ("id")
);

-- Migrate existing A/B tests into the new table.
-- For each entry point that had a variant, create two rows:
--   1. The control flow with (100 - variantPercentage)%
--   2. The variant flow with variantPercentage%

-- Insert control flow variant rows
INSERT INTO "entry_point_variants" ("id", "entryPointId", "flowId", "percentage", "order", "createdAt")
SELECT
    gen_random_uuid(),
    ep."id",
    ep."flowId",
    100 - ep."variantPercentage",
    0,
    NOW()
FROM "entry_points" ep
WHERE ep."variantFlowId" IS NOT NULL
  AND ep."variantPercentage" IS NOT NULL;

-- Insert variant flow variant rows
INSERT INTO "entry_point_variants" ("id", "entryPointId", "flowId", "percentage", "order", "createdAt")
SELECT
    gen_random_uuid(),
    ep."id",
    ep."variantFlowId",
    ep."variantPercentage",
    1,
    NOW()
FROM "entry_points" ep
WHERE ep."variantFlowId" IS NOT NULL
  AND ep."variantPercentage" IS NOT NULL;

-- Drop the old columns
ALTER TABLE "entry_points" DROP COLUMN "variantFlowId";
ALTER TABLE "entry_points" DROP COLUMN "variantPercentage";

-- Drop old index
DROP INDEX IF EXISTS "entry_points_variantFlowId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "entry_point_variants_entryPointId_flowId_key" ON "entry_point_variants"("entryPointId", "flowId");

-- CreateIndex
CREATE INDEX "entry_point_variants_entryPointId_idx" ON "entry_point_variants"("entryPointId");

-- CreateIndex
CREATE INDEX "entry_point_variants_flowId_idx" ON "entry_point_variants"("flowId");

-- AddForeignKey
ALTER TABLE "entry_point_variants" ADD CONSTRAINT "entry_point_variants_entryPointId_fkey" FOREIGN KEY ("entryPointId") REFERENCES "entry_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_point_variants" ADD CONSTRAINT "entry_point_variants_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
