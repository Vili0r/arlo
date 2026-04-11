ALTER TABLE "flows"
ADD COLUMN "draftConfig" JSONB,
ADD COLUMN "draftUpdatedAt" TIMESTAMP(3);

UPDATE "flows" AS f
SET
  "draftConfig" = latest."config",
  "draftUpdatedAt" = latest."createdAt"
FROM (
  SELECT DISTINCT ON ("flowId")
    "flowId",
    "config",
    "createdAt"
  FROM "flow_versions"
  WHERE "publishedAt" IS NULL
  ORDER BY "flowId", "version" DESC
) AS latest
WHERE latest."flowId" = f."id";
