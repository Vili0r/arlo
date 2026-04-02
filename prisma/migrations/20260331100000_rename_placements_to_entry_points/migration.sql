ALTER TABLE "placements" RENAME TO "entry_points";

ALTER TABLE "entry_points" RENAME CONSTRAINT "placements_pkey" TO "entry_points_pkey";
ALTER TABLE "entry_points" RENAME CONSTRAINT "placements_projectId_fkey" TO "entry_points_projectId_fkey";
ALTER TABLE "entry_points" RENAME CONSTRAINT "placements_flowId_fkey" TO "entry_points_flowId_fkey";

ALTER INDEX "placements_projectId_idx" RENAME TO "entry_points_projectId_idx";
ALTER INDEX "placements_flowId_idx" RENAME TO "entry_points_flowId_idx";
ALTER INDEX "placements_projectId_key_environment_key" RENAME TO "entry_points_projectId_key_environment_key";
