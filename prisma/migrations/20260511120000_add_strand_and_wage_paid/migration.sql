-- CreateTable
CREATE TABLE "Strand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Strand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Strand_slug_key" ON "Strand"("slug");

-- Seed: two strands
INSERT INTO "Strand" ("id", "name", "slug", "createdAt", "updatedAt") VALUES
    ('00000000-0000-4000-8000-000000000001', 'Balatonvilágos', 'balatonvilagos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000002', 'Tihany',         'tihany',         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AddColumn (nullable for backfill)
ALTER TABLE "Store" ADD COLUMN "strandId" TEXT;

-- Backfill: every existing store goes to Balatonvilágos (nothing is deleted)
UPDATE "Store"
SET "strandId" = (SELECT "id" FROM "Strand" WHERE "slug" = 'balatonvilagos')
WHERE "strandId" IS NULL;

-- Enforce NOT NULL now that backfill is complete
ALTER TABLE "Store" ALTER COLUMN "strandId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Wage paid tracking
ALTER TABLE "Wage" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Wage" ADD COLUMN "paidAt" TIMESTAMP(3);
