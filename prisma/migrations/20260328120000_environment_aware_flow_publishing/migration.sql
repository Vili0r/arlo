ALTER TABLE "flows" RENAME COLUMN "publishedVersionId" TO "developmentVersionId";

ALTER TABLE "flows"
ADD COLUMN "productionVersionId" TEXT;

ALTER TABLE "flow_versions"
ADD COLUMN "publishedEnvironment" "Environment";

ALTER TABLE "placements"
ADD COLUMN "environment" "Environment" NOT NULL DEFAULT 'DEVELOPMENT';

UPDATE "flow_versions"
SET "publishedEnvironment" = 'DEVELOPMENT'
WHERE "id" IN (
  SELECT "developmentVersionId"
  FROM "flows"
  WHERE "developmentVersionId" IS NOT NULL
);

UPDATE "flows"
SET "productionVersionId" = "developmentVersionId"
WHERE "developmentVersionId" IS NOT NULL;

UPDATE "flow_versions"
SET "publishedEnvironment" = 'PRODUCTION'
WHERE "id" IN (
  SELECT "productionVersionId"
  FROM "flows"
  WHERE "productionVersionId" IS NOT NULL
);

DROP INDEX IF EXISTS "placements_projectId_key_key";

CREATE UNIQUE INDEX "placements_projectId_key_environment_key"
ON "placements"("projectId", "key", "environment");

CREATE UNIQUE INDEX "flows_productionVersionId_key"
ON "flows"("productionVersionId");
