UPDATE "flows" AS f
SET
  "draftConfig" = NULL,
  "draftUpdatedAt" = NULL
FROM (
  SELECT
    "flowId",
    MAX("createdAt") AS "latestPublishedCreatedAt"
  FROM "flow_versions"
  WHERE "publishedAt" IS NOT NULL
  GROUP BY "flowId"
) AS latest_published
WHERE latest_published."flowId" = f."id"
  AND f."draftUpdatedAt" IS NOT NULL
  AND f."draftUpdatedAt" <= latest_published."latestPublishedCreatedAt";
